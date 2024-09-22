import {
  QueryClient,
  QueryKey,
  QueryObserver,
  QueryObserverResult,
  notifyManager,
} from '@tanstack/query-core'
import { Getter, WritableAtom, atom } from 'jotai'
import { queryClientAtom } from './queryClientAtom'
import { BaseAtomWithQueryOptions } from './types'
import { ensureStaleTime, getHasError, shouldSuspend } from './utils'

export function baseAtomWithQuery<
  TQueryFnData,
  TError,
  TData,
  TQueryData,
  TQueryKey extends QueryKey,
>(
  getOptions: (
    get: Getter
  ) => BaseAtomWithQueryOptions<
    TQueryFnData,
    TError,
    TData,
    TQueryData,
    TQueryKey
  >,
  Observer: typeof QueryObserver,
  getQueryClient: (get: Getter) => QueryClient = (get) => get(queryClientAtom)
): WritableAtom<
  | QueryObserverResult<TData, TError>
  | Promise<QueryObserverResult<TData, TError>>,
  [],
  void
> {
  const refreshAtom = atom(0)
  const clientAtom = atom(getQueryClient)
  if (process.env.NODE_ENV !== 'production') {
    clientAtom.debugPrivate = true
  }

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

  const defaultedOptionsAtom = atom((get) => {
    const client = get(clientAtom)
    const options = getOptions(get)
    const defaultedOptions = client.defaultQueryOptions(options)

    const cache = get(observerCacheAtom)
    const cachedObserver = cache.get(client)

    defaultedOptions._optimisticResults = 'optimistic'

    if (cachedObserver) {
      cachedObserver.setOptions(defaultedOptions, {
        listeners: false,
      })
    }

    return ensureStaleTime(defaultedOptions)
  })
  if (process.env.NODE_ENV !== 'production') {
    defaultedOptionsAtom.debugPrivate = true
  }

  const observerAtom = atom((get) => {
    const client = get(clientAtom)
    const defaultedOptions = get(defaultedOptionsAtom)

    const observerCache = get(observerCacheAtom)

    const cachedObserver = observerCache.get(client)

    if (cachedObserver) return cachedObserver

    const newObserver = new Observer(client, defaultedOptions)
    observerCache.set(client, newObserver)

    return newObserver
  })
  if (process.env.NODE_ENV !== 'production') {
    observerAtom.debugPrivate = true
  }

  const dataAtom = atom((get) => {
    const observer = get(observerAtom)
    const defaultedOptions = get(defaultedOptionsAtom)
    const result = observer.getOptimisticResult(defaultedOptions)

    const resultAtom = atom(result)
    if (process.env.NODE_ENV !== 'production') {
      resultAtom.debugPrivate = true
    }

    resultAtom.onMount = (set) => {
      const unsubscribe = observer.subscribe(notifyManager.batchCalls(set))
      return () => {
        if (observer.getCurrentResult().isError) {
          observer.getCurrentQuery().reset()
        }
        unsubscribe()
      }
    }

    return resultAtom
  })
  if (process.env.NODE_ENV !== 'production') {
    dataAtom.debugPrivate = true
  }

  return atom(
    (get) => {
      get(refreshAtom)
      const observer = get(observerAtom)
      const defaultedOptions = get(defaultedOptionsAtom)

      const result = get(get(dataAtom))

      if (shouldSuspend(defaultedOptions, result, false)) {
        return observer.fetchOptimistic(defaultedOptions)
      }

      if (
        getHasError({
          result,
          query: observer.getCurrentQuery(),
          throwOnError: defaultedOptions.throwOnError,
        })
      ) {
        throw result.error
      }

      return result
    },
    (_get, set) => {
      set(refreshAtom, (c) => c + 1)
    }
  )
}
