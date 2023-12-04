import {
  DefaultError,
  DefaultedInfiniteQueryObserverOptions,
  DefinedInfiniteQueryObserverResult,
  InfiniteData,
  InfiniteQueryObserver,
  InfiniteQueryObserverOptions,
  InfiniteQueryObserverResult,
  QueryClient,
  type QueryKey,
} from '@tanstack/query-core'
import { Getter, atom } from 'jotai'
import { make, pipe, toObservable } from 'wonka'
import { queryClientAtom } from './queryClientAtom'

export const atomWithSuspenseInfiniteQuery = <
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = InfiniteData<TQueryFnData>,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = unknown,
>(
  getOptions: (
    get: Getter
  ) => SuspenseInfiniteQueryOptions<
    TQueryFnData,
    TError,
    TPageParam,
    TData,
    TQueryKey
  >,
  getQueryClient: (get: Getter) => QueryClient = (get) => get(queryClientAtom)
) => {
  const IN_RENDER = Symbol()

  const queryClientAtom = atom(getQueryClient)

  const optionsAtom = atom<
    DefaultedInfiniteQueryObserverOptions<
      TQueryFnData,
      TError,
      TData,
      TQueryFnData,
      TQueryKey,
      TPageParam
    >
  >((get) => {
    const client = get(queryClientAtom)
    const options = getOptions(get)
    return client.defaultQueryOptions({
      ...options,
      enabled: true,
      suspense: true,
    }) as unknown as DefaultedInfiniteQueryObserverOptions<
      TQueryFnData,
      TError,
      TData,
      TQueryFnData,
      TQueryKey,
      TPageParam
    >
  })

  const observerCacheAtom = atom(
    () =>
      new WeakMap<
        QueryClient,
        InfiniteQueryObserver<
          TQueryFnData,
          TError,
          TData,
          TQueryFnData,
          TQueryKey,
          TPageParam
        >
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

    const newObserver = new InfiniteQueryObserver(client, options)
    observerCache.set(client, newObserver)

    return newObserver
  })

  const sourceAtom = atom((get) => {
    const observer = get(observerAtom)
    return make<InfiniteQueryObserverResult<TData, TError>>(({ next }) => {
      const callback = (result: InfiniteQueryObserverResult<TData, TError>) => {
        const notifyResult = () => next(result)

        if ((observer as any)[IN_RENDER]) {
          Promise.resolve().then(notifyResult)
        } else {
          notifyResult()
        }
      }

      return observer.subscribe(callback)
    })
  })

  const observableAtom = atom((get) => {
    const source = get(sourceAtom)

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
      return unsubscribe
    }

    return resultAtom
  })

  return atom((get) => {
    const options = get(optionsAtom)
    const observer = get(observerAtom)

    const optimisticResult = observer.getOptimisticResult(options)

    const resultAtom = get(dataAtom)
    const result = get(resultAtom)

    if (optimisticResult.isPending) {
      return observer.fetchOptimistic(options).catch((err) => {
        throw err
      }) as Promise<DefinedInfiniteQueryObserverResult<TData, TError>>
    }

    return result as DefinedInfiniteQueryObserverResult<TData, TError>
  })
}

interface SuspenseInfiniteQueryOptions<
  TQueryFnData = unknown,
  TError = DefaultError,
  TPageParam = unknown,
  TData = InfiniteData<TQueryFnData>,
  TQueryKey extends QueryKey = QueryKey,
> extends Omit<
    InfiniteQueryObserverOptions<
      TQueryFnData,
      TError,
      TData,
      TQueryFnData,
      TQueryKey,
      TPageParam
    >,
    'enabled' | 'throwOnError' | 'placeholderData'
  > {}
