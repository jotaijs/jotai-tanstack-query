import {
  DefaultError,
  DefaultedInfiniteQueryObserverOptions,
  InfiniteData,
  InfiniteQueryObserver,
  InfiniteQueryObserverOptions,
  InfiniteQueryObserverSuccessResult,
  QueryClient,
  type QueryKey,
} from '@tanstack/query-core'
import { Atom, Getter, atom } from 'jotai'
import { baseAtomWithQuery } from './baseAtomWithQuery'
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
): Atom<Promise<InfiniteQueryObserverSuccessResult<TData, TError>>> => {
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
  if (process.env.NODE_ENV !== 'production') {
    observerCacheAtom.debugPrivate = true
  }

  const optionsAtom = atom((get) => {
    const client = getQueryClient(get)
    const options = getOptions(get)
    const cache = get(observerCacheAtom)
    const cachedObserver = cache.get(client)
    const dOptions = client.defaultQueryOptions(
      options
    ) as DefaultedInfiniteQueryObserverOptions<
      TQueryFnData,
      TError,
      TData,
      TQueryFnData,
      TQueryKey,
      TPageParam
    >

    dOptions._optimisticResults = 'optimistic'

    if (typeof dOptions.staleTime !== 'number') {
      dOptions.staleTime = 1000
    }

    if (cachedObserver) {
      cachedObserver.setOptions(dOptions, { listeners: false })
    }

    return dOptions
  })
  if (process.env.NODE_ENV !== 'production') {
    optionsAtom.debugPrivate = true
  }

  const observerAtom = atom((get) => {
    const options = get(optionsAtom)
    const client = getQueryClient(get)

    const observerCache = get(observerCacheAtom)

    const cachedObserver = observerCache.get(client)

    if (cachedObserver) return cachedObserver

    const newObserver = new InfiniteQueryObserver(client, options)
    observerCache.set(client, newObserver)

    return newObserver
  })
  if (process.env.NODE_ENV !== 'production') {
    observerAtom.debugPrivate = true
  }

  return baseAtomWithQuery<
    TQueryFnData,
    TError,
    TData,
    TQueryFnData,
    TQueryKey,
    TPageParam
  >(
    (get) => ({
      ...get(optionsAtom),
      suspense: true,
      enabled: true,
    }),
    (get) => get(observerAtom),
    getQueryClient
  )
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
