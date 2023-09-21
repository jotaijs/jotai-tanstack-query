import type {
  QueryClient,
  QueryKey,
  QueryObserverOptions,
  QueryObserverResult,
  QueryObserverSuccessResult,
} from '@tanstack/query-core'
import { QueryObserver, isCancelledError } from '@tanstack/query-core'
import { Atom, Getter, atom } from 'jotai'
import { atomWithObservable } from 'jotai/vanilla/utils'
import { filter, make, pipe, toObservable } from 'wonka'
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
  const observerCacheAtom = atom(
    () =>
      new WeakMap<
        QueryClient,
        QueryObserver<TQueryFnData, TError, TData, TQueryData, TQueryKey>
      >()
  )

  const observerAtom = atom((get) => {
    const options = getOptions(get)
    const client = getQueryClient(get)
    const observerCache = get(observerCacheAtom)
    const observer = observerCache.get(client)
    if (observer) {
      ;(observer as any)[IN_RENDER] = true
      observer.setOptions(options)
      delete (observer as any)[IN_RENDER]
      return observer
    }
    const defaultedOptions = client.defaultQueryOptions(options)
    const newObserver = new QueryObserver(client, defaultedOptions)
    observerCache.set(client, newObserver)
    return newObserver
  })
  const IN_RENDER = Symbol()
  const dataAtom = atom((get) => {
    const options = getOptions(get)
    const observer = get(observerAtom)

    const source = make<QueryObserverResult<TData, TError>>(({ next }) => {
      const callback = (result: QueryObserverResult<TData, TError>) => {
        const notifyResult = () => next(result)
        if ((observer as any)[IN_RENDER]) {
          Promise.resolve().then(notifyResult)
        } else {
          notifyResult()
        }
      }

      const unsubscribe = observer.subscribe(callback)
      callback(observer.getCurrentResult())
      return () => unsubscribe()
    })

    const observable = pipe(
      source,
      // tap((state) => console.log(JSON.stringify({ state }))),
      filter((state) => {
        if (options.suspense) {
          if (
            (state.isSuccess && state.data !== undefined) ||
            (state.isError && !isCancelledError(state.error))
          ) {
            return true
          } else {
            return false
          }
        }
        return true
      }),
      toObservable
    )

    const observableAtom = atomWithObservable(() => observable)

    return observableAtom
  })

  const returnResultData = (result: any) => {
    if (result.error) {
      throw result.error
    }
    return result
  }

  const resultAtom = atom((get) => {
    const finalAtom = get(dataAtom)
    const result = get(finalAtom)

    if (result instanceof Promise) {
      return result.then(returnResultData)
    } else {
      return returnResultData(result)
    }
  })

  return resultAtom
}
