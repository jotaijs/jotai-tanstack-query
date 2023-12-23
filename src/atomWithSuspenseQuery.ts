import {
  DefaultError,
  type DefinedQueryObserverResult,
  QueryClient,
  type QueryKey,
  QueryObserver,
  type QueryObserverOptions,
} from '@tanstack/query-core'
import { Atom, Getter, atom } from 'jotai'
import { baseAtomWithQuery } from './baseAtomWithQuery'
import { queryClientAtom } from './queryClientAtom'

export const atomWithSuspenseQuery = <
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(
  getOptions: (
    get: Getter
  ) => Omit<
    QueryObserverOptions<TQueryFnData, TError, TData, TQueryData, TQueryKey>,
    'suspense' | 'enabled'
  >,
  getQueryClient: (get: Getter) => QueryClient = (get) => get(queryClientAtom)
): Atom<
  | DefinedQueryObserverResult<TData, TError>
  | Promise<DefinedQueryObserverResult<TData, TError>>
> => {
  const observerCacheAtom = atom(
    () =>
      new WeakMap<
        QueryClient,
        QueryObserver<TQueryFnData, TError, TData, TQueryData, TQueryKey>
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
    const dOptions = client.defaultQueryOptions(options)

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

    const newObserver = new QueryObserver(client, options)
    observerCache.set(client, newObserver)

    return newObserver
  })
  if (process.env.NODE_ENV !== 'production') {
    observerAtom.debugPrivate = true
  }

  return baseAtomWithQuery<TQueryFnData, TError, TData, TQueryData, TQueryKey>(
    (get) => ({
      ...get(optionsAtom),
      suspense: true,
      enabled: true,
    }),
    (get) => get(observerAtom),
    getQueryClient
  )
}
