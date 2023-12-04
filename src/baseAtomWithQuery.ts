import {
  DefaultError,
  InfiniteQueryObserver,
  InfiniteQueryObserverOptions,
  InfiniteQueryObserverResult,
  InfiniteQueryObserverSuccessResult,
  QueryClient,
  QueryKey,
  QueryObserver,
  QueryObserverOptions,
  QueryObserverResult,
  QueryObserverSuccessResult,
} from '@tanstack/query-core'
import { Atom, Getter, atom } from 'jotai'
import { make, pipe, toObservable } from 'wonka'
import { queryClientAtom } from './queryClientAtom'
import { getHasError, shouldSuspend } from './utils'

export function baseAtomWithQuery<
  TQueryFnData = unknown,
  TError = DefaultError,
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
  getObserver: (
    get: Getter
  ) => QueryObserver<TQueryFnData, TError, TData, TQueryData, TQueryKey>,
  getQueryClient?: (get: Getter) => QueryClient
): Atom<Promise<QueryObserverSuccessResult<TData, TError>>>
export function baseAtomWithQuery<
  TQueryFnData = unknown,
  TError = DefaultError,
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
  getObserver: (
    get: Getter
  ) => QueryObserver<TQueryFnData, TError, TData, TQueryData, TQueryKey>,
  getQueryClient?: (get: Getter) => QueryClient
): Atom<QueryObserverResult<TData, TError>>
export function baseAtomWithQuery<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = unknown,
>(
  getOptions: (
    get: Getter
  ) => InfiniteQueryObserverOptions<
    TQueryFnData,
    TError,
    TData,
    TQueryData,
    TQueryKey,
    TPageParam
  > & { suspense: true },
  getObserver: (
    get: Getter
  ) => InfiniteQueryObserver<
    TQueryFnData,
    TError,
    TData,
    TQueryFnData,
    TQueryKey,
    TPageParam
  >,
  getQueryClient?: (get: Getter) => QueryClient
): Atom<Promise<InfiniteQueryObserverSuccessResult<TData, TError>>>
export function baseAtomWithQuery<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = unknown,
>(
  getOptions: (
    get: Getter
  ) => InfiniteQueryObserverOptions<
    TQueryFnData,
    TError,
    TData,
    TQueryData,
    TQueryKey,
    TPageParam
  > & { suspense?: false },
  getObserver: (
    get: Getter
  ) => InfiniteQueryObserver<
    TQueryFnData,
    TError,
    TData,
    TQueryFnData,
    TQueryKey,
    TPageParam
  >,
  getQueryClient?: (get: Getter) => QueryClient
): Atom<InfiniteQueryObserverResult<TData, TError>>
export function baseAtomWithQuery<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(
  getOptions: (
    get: Getter
  ) => QueryObserverOptions<TQueryFnData, TError, TData, TQueryData, TQueryKey>,
  getObserver: (
    get: Getter
  ) => QueryObserver<TQueryFnData, TError, TData, TQueryData, TQueryKey>,
  getQueryClient: (get: Getter) => QueryClient = (get) => get(queryClientAtom)
) {
  const IN_RENDER = Symbol()

  const queryClientAtom = atom(getQueryClient)

  const optionsAtom = atom((get) => {
    const client = get(queryClientAtom)
    const options = getOptions(get)
    return client.defaultQueryOptions(options)
  })

  const observerAtom = atom(getObserver)

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
    return pipe(source, toObservable)
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

    const resultAtom = get(dataAtom)
    const result = get(resultAtom)

    if (shouldSuspend(options, optimisticResult, false)) {
      return observer.fetchOptimistic(options)
    }

    if (
      getHasError({
        result,
        query: observer.getCurrentQuery(),
        throwOnError: options.throwOnError,
      })
    ) {
      throw result.error
    }

    return result
  })
}
