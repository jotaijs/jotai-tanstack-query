import { InfiniteQueryObserver, QueryClient } from '@tanstack/query-core'
import type {
  DefaultError,
  DefaultedInfiniteQueryObserverOptions,
  InfiniteData,
  InfiniteQueryObserverOptions,
  InfiniteQueryObserverResult,
  QueryKey,
  WithRequired,
} from '@tanstack/query-core'
import { Atom, type Getter, atom } from 'jotai/vanilla'
import { baseAtomWithQuery } from './baseAtomWithQuery'
import { queryClientAtom } from './queryClientAtom'

export function atomWithInfiniteQuery<
  TQueryFnData,
  TError = DefaultError,
  TData = InfiniteData<TQueryFnData>,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = unknown,
>(
  getOptions: (
    get: Getter
  ) => InfiniteQueryOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam>,
  getQueryClient: (get: Getter) => QueryClient = (get) => get(queryClientAtom)
): Atom<InfiniteQueryObserverResult<TData, TError>> {
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
      suspense: false,
    }),
    (get) => get(observerAtom),
    getQueryClient
  )
}

interface InfiniteQueryOptions<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = InfiniteData<TQueryFnData>,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = unknown,
> extends WithRequired<
    Omit<
      InfiniteQueryObserverOptions<
        TQueryFnData,
        TError,
        TData,
        TQueryFnData,
        TQueryKey,
        TPageParam
      >,
      'suspense'
    >,
    'queryKey'
  > {}
