import {
  QueryClient,
  type QueryKey,
  QueryObserver,
  type QueryObserverOptions,
  type QueryObserverResult,
  type QueryObserverSuccessResult,
} from '@tanstack/query-core'
import { Atom, Getter, atom } from 'jotai'
import { filter, fromPromise, make, pipe, toObservable, toPromise } from 'wonka'
import { isResetAtom } from './QueryAtomErrorResetBoundary'
import { queryClientAtom } from './queryClientAtom'
import { shouldSuspend } from './utils'

export const atomWithSuspenseQuery = <
  TQueryFnData = unknown,
  TError = unknown,
  TData = TQueryFnData,
  TQueryData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
  TInitialData = TData,
>(
  getOptions: (
    get: Getter
  ) => QueryObserverOptions<
    TQueryFnData,
    TError,
    TData,
    TQueryData,
    TQueryKey
  > & { initialData?: TInitialData },
  getQueryClient: (get: Getter) => QueryClient = (get) => get(queryClientAtom)
) => {
  const IN_RENDER = Symbol()

  const queryClientAtom = atom(getQueryClient)
  const optionsAtom = atom((get) => {
    const client = get(queryClientAtom)
    const options = getOptions(get)
    return client.defaultQueryOptions({
      ...options,
      enabled: true,
      suspense: true,
    })
  })

  const observerCacheAtom = atom(
    () =>
      new WeakMap<
        QueryClient,
        QueryObserver<TQueryFnData, TError, TData, TQueryData, TQueryKey>
      >()
  )

  const observerAtom = atom((get) => {
    const isReset = get(isResetAtom)

    const options = get(optionsAtom)
    const client = get(queryClientAtom)
    const observerCache = get(observerCacheAtom)

    const observer = observerCache.get(client)

    if (isReset) {
      if (observer) {
        observerCache.delete(client)
        observer.remove()
      }
      const newObserver = new QueryObserver(client, options)
      observerCache.set(client, newObserver)
      return newObserver
    }

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

  const observableAtom = atom((get) => {
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
      return () => unsubscribe()
    })
    return pipe(
      source,
      filter((state) => !state.isFetching),
      toObservable
    )
  })

  const dataAtom = atom((get) => {
    const observer = get(observerAtom)
    const observable = get(observableAtom)

    const currentResult = observer.getCurrentResult()
    const resultAtom = atom(currentResult)

    resultAtom.onMount = (set) => {
      const { unsubscribe } = observable.subscribe((state) => {
        set(state)
      })
      return () => unsubscribe()
    }

    return resultAtom
  })

  return atom((get) => {
    const options = get(optionsAtom)
    const observer = get(observerAtom)
    const optimisticResult = observer.getOptimisticResult(options)
    console.log({ defaultedOptions: options })
    const suspend = shouldSuspend(options, optimisticResult, false)
    console.log({ suspend })

    if (suspend) {
      return observer.fetchOptimistic(options)
    }

    const shouldThrowError =
      optimisticResult.isError && !optimisticResult.isFetching

    if (shouldThrowError) {
      throw optimisticResult.error
    }

    const resultAtom = get(dataAtom)
    const result = get(resultAtom)

    return result
  })
}
