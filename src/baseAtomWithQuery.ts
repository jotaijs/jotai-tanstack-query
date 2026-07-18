import {
  type Query,
  type QueryCache,
  QueryClient,
  type QueryKey,
  QueryObserver,
  type QueryObserverResult,
  notifyManager,
} from '@tanstack/query-core'
import { Getter, WritableAtom, atom } from 'jotai'
import { queryClientAtom } from './_queryClientAtom'
import { BaseAtomWithQueryOptions } from './types'
import { ensureStaleTime, getHasError, shouldSuspend } from './utils'

type QueryAddedListener = (query: Query) => void

type QueryCacheSubscription = {
  listenersByQueryHash: Map<string, Set<QueryAddedListener>>
  unsubscribe: () => void
}

const queryCacheSubscriptions = new WeakMap<
  QueryCache,
  QueryCacheSubscription
>()

const subscribeToQueryAdded = (
  queryCache: QueryCache,
  queryHash: string,
  listener: QueryAddedListener
) => {
  let subscription = queryCacheSubscriptions.get(queryCache)

  if (!subscription) {
    const listenersByQueryHash = new Map<
      string,
      Set<QueryAddedListener>
    >()
    const notify = (query: Query) => {
      if (queryCache.get(query.queryHash) !== query) return
      listenersByQueryHash
        .get(query.queryHash)
        ?.forEach((listener) => listener(query))
    }

    subscription = {
      listenersByQueryHash,
      unsubscribe: queryCache.subscribe((event) => {
        if (event.type === 'added') {
          void Promise.resolve().then(() => notify(event.query))
        }
      }),
    }
    queryCacheSubscriptions.set(queryCache, subscription)
  }

  let listeners = subscription.listenersByQueryHash.get(queryHash)
  if (!listeners) {
    listeners = new Set()
    subscription.listenersByQueryHash.set(queryHash, listeners)
  }
  listeners.add(listener)

  let isSubscribed = true
  return () => {
    if (!isSubscribed) return
    isSubscribed = false
    listeners.delete(listener)

    if (!listeners.size) {
      subscription.listenersByQueryHash.delete(queryHash)
    }
    if (!subscription.listenersByQueryHash.size) {
      subscription.unsubscribe()
      if (queryCacheSubscriptions.get(queryCache) === subscription) {
        queryCacheSubscriptions.delete(queryCache)
      }
    }
  }
}

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
      cachedObserver.setOptions(defaultedOptions)
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
    const client = get(clientAtom)
    const observer = get(observerAtom)
    const defaultedOptions = get(defaultedOptionsAtom)
    const result = observer.getOptimisticResult(defaultedOptions)

    const resultAtom = atom(result)
    if (process.env.NODE_ENV !== 'production') {
      resultAtom.debugPrivate = true
    }

    let mountGeneration = 0
    resultAtom.onMount = (set) => {
      const generation = ++mountGeneration
      observer.setOptions(defaultedOptions)
      let isMounted = true
      const queryCache = client.getQueryCache()
      const unsubscribeCache = subscribeToQueryAdded(
        queryCache,
        observer.getCurrentQuery().queryHash,
        (query) => {
          if (
            isMounted &&
            queryCache.get(query.queryHash) === query &&
            query.queryHash === observer.options.queryHash &&
            query !== observer.getCurrentQuery()
          ) {
            observer.setOptions(observer.options)
          }
        }
      )
      const unsubscribeObserver = observer.subscribe(
        notifyManager.batchCalls((result) => {
          if (generation === mountGeneration) set(result)
        })
      )
      set(observer.getCurrentResult())

      return () => {
        isMounted = false
        unsubscribeCache()
        if (observer.getCurrentResult().isError) {
          observer.getCurrentQuery().reset()
        }
        unsubscribeObserver()
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
