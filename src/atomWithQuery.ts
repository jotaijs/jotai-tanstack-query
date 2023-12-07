import {
  DefaultError,
  QueryClient,
  QueryKey,
  QueryObserver,
  QueryObserverOptions,
  QueryObserverResult,
} from '@tanstack/query-core'
import { Atom, Getter, atom } from 'jotai'
import { baseAtomWithQuery } from './baseAtomWithQuery'
import { queryClientAtom } from './queryClientAtom'

export function atomWithQuery<
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
    'suspense'
  >,
  getQueryClient: (get: Getter) => QueryClient = (get) => get(queryClientAtom)
): Atom<QueryObserverResult<TData, TError>> {
  const IN_RENDER = Symbol()

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
    const dOptions = client.defaultQueryOptions(options)

    dOptions._optimisticResults = 'optimistic'

    return dOptions
  })
  if (process.env.NODE_ENV !== 'production') {
    optionsAtom.debugPrivate = true
  }

  const observerAtom = atom((get) => {
    const options = get(optionsAtom)
    const client = getQueryClient(get)

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
  if (process.env.NODE_ENV !== 'production') {
    observerAtom.debugPrivate = true
  }

  return baseAtomWithQuery<TQueryFnData, TError, TData, TQueryData, TQueryKey>(
    (get) => ({ ...get(optionsAtom), suspense: false }),
    (get) => get(observerAtom),
    getQueryClient
  )
}
