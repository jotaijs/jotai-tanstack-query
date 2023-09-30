import type {
  QueryClient,
  QueryKey,
  QueryObserverOptions,
  QueryObserverResult,
  QueryObserverSuccessResult,
} from '@tanstack/query-core'
import { QueryObserver, isCancelledError } from '@tanstack/query-core'
import { Atom, Getter, atom } from 'jotai'
import { filter, make, pipe, take, tap, toObservable, toPromise } from 'wonka'
import { queryClientAtom } from './queryClientAtom'

export function atomWithQuery<
  TQueryFnData = unknown,
  TError = unknown,
  TData = TQueryFnData,
  TQueryData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(
  getOptions: (
    get: Getter
  ) => QueryObserverOptions<
    TQueryFnData,
    TError,
    TData,
    TQueryData,
    TQueryKey
  > & { suspense: true },
  getQueryClient?: (get: Getter) => QueryClient
): Atom<Promise<QueryObserverSuccessResult<TData, TError>>>
export function atomWithQuery<
  TQueryFnData = unknown,
  TError = unknown,
  TData = TQueryFnData,
  TQueryData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(
  getOptions: (
    get: Getter
  ) => QueryObserverOptions<
    TQueryFnData,
    TError,
    TData,
    TQueryData,
    TQueryKey
  > & { suspense?: false },
  getQueryClient?: (get: Getter) => QueryClient
): Atom<Promise<QueryObserverResult<TData, TError>>>
export function atomWithQuery<
  TQueryFnData = unknown,
  TError = unknown,
  TData = TQueryFnData,
  TQueryData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
  TSuspense extends boolean = false,
>(
  getOptions: (
    get: Getter
  ) => QueryObserverOptions<
    TQueryFnData,
    TError,
    TData,
    TQueryData,
    TQueryKey
  > & { suspense?: TSuspense },
  getQueryClient: (get: Getter) => QueryClient = (get) => get(queryClientAtom)
) {
  const IN_RENDER = Symbol()
  const queryClientAtom = atom(getQueryClient)

  const optionsAtom = atom((get) => {
    const client = get(queryClientAtom)
    const options = getOptions(get)
    return client.defaultQueryOptions(options)
  })
  const observerCacheAtom = atom(
    () =>
      new WeakMap<
        QueryClient,
        QueryObserver<TQueryFnData, TError, TData, TQueryData, TQueryKey>
      >()
  )

  const observerAtom = atom((get) => {
    const options = get(optionsAtom)
    const client = get(queryClientAtom)
    const observerCache = get(observerCacheAtom)

    const observer = observerCache.get(client)

    if (observer) {
      ;(observer as any)[IN_RENDER] = true
      observer.setOptions(options)
      delete (observer as any)[IN_RENDER]

      return observer
    }

    const newObserver = new QueryObserver(client, options)
    observerCache.set(client, newObserver)

    return newObserver
  })

  const sourceAtom = atom((get) => {
    const observer = get(observerAtom)
    const options = get(optionsAtom)
    const source = make<QueryObserverResult<TData, TError>>(({ next }) => {
      const callback = (result: QueryObserverResult<TData, TError>) => {
        console.log(result)
        const notifyResult = () => next(result)
        if ((observer as any)[IN_RENDER]) {
          Promise.resolve().then(notifyResult)
        } else {
          notifyResult()
        }
      }

      const unsubscribe = observer.subscribe(callback)
      return () => unsubscribe()
    })

    return pipe(
      source,
      filter((state) => {
        if (options.suspense) {
          return (
            (state.isError && !isCancelledError(state.error)) || state.isSuccess
          )
        } else {
          return true
        }
      }),
      tap((filteredState) => console.log(JSON.stringify({ filteredState })))
    )
  })

  const observableAtom = atom((get) => {
    const source = get(sourceAtom)
    return pipe(source, toObservable)
  })

  const dataAtom = atom((get) => {
    const source = get(sourceAtom)
    const observer = get(observerAtom)
    const observable = get(observableAtom)

    const initialPromise = toPromise(pipe(source, take(1)))
    const currentResult = observer.getCurrentResult()

    const initialData = currentResult.isInitialLoading
      ? initialPromise
      : observer.getCurrentResult()
    console.log(initialData, 'initialData')
    const resultAtom = atom<
      | QueryObserverResult<TData, TError>
      | Promise<QueryObserverResult<TData, TError>>
    >(initialData)

    resultAtom.onMount = (set) => {
      const { unsubscribe } = observable.subscribe((res) => {
        set(res)
      })

      return () => unsubscribe()
    }

    return resultAtom
  })

  const returnResultData = (result: QueryObserverResult<TData, TError>) => {
    if (result.error) {
      throw result.error
    }
    return result.data
  }
  const finalAtom = atom((get) => {
    const result = get(dataAtom)

    const data = get(result)

    if (data instanceof Promise) {
      return data.then(returnResultData)
    }
    return returnResultData(data)
  })

  return finalAtom
}
