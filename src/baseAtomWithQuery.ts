import {
  QueryClient,
  type QueryKey,
  QueryObserver,
  type QueryObserverResult,
  notifyManager,
} from '@tanstack/query-core'
import { Getter, WritableAtom, atom } from 'jotai'
import { queryClientAtom } from './queryClientAtom'
import { BaseAtomWithQueryOptions, MaybePromise } from './types'
import {
  ensureStaleTime,
  getHasError,
  isPromiseLike,
  shouldSuspend,
} from './utils'

export function baseAtomWithQuery<
  TQueryFnData,
  TError,
  TData,
  TQueryData,
  TQueryKey extends QueryKey,
>(
  getOptions: (
    get: Getter
  ) => MaybePromise<
    BaseAtomWithQueryOptions<TQueryFnData, TError, TData, TQueryData, TQueryKey>
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
    if (isPromiseLike(options)) {
      return options.then((resolvedOptions) => {
        const defaultedOptions = client.defaultQueryOptions(resolvedOptions)

        const cache = get(observerCacheAtom)
        const cachedObserver = cache.get(client)

        defaultedOptions._optimisticResults = 'optimistic'

        if (cachedObserver) {
          cachedObserver.setOptions(defaultedOptions)
        }

        return ensureStaleTime(defaultedOptions)
      })
    }
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

    if (isPromiseLike(defaultedOptions)) {
      return defaultedOptions.then((resolvedOptions) => {
        const newObserver = new Observer(client, resolvedOptions)
        observerCache.set(client, newObserver)

        return newObserver
      })
    }

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
    if (isPromiseLike(defaultedOptions) || isPromiseLike(observer)) {
      return Promise.all([observer, defaultedOptions]).then(
        ([resolvedObserver, resolvedOptions]) => {
          const result = resolvedObserver.getOptimisticResult(resolvedOptions)

          const resultAtom = atom(result)
          if (process.env.NODE_ENV !== 'production') {
            resultAtom.debugPrivate = true
          }

          resultAtom.onMount = (set) => {
            const unsubscribe = resolvedObserver.subscribe(
              notifyManager.batchCalls(set)
            )
            return () => {
              if (resolvedObserver.getCurrentResult().isError) {
                resolvedObserver.getCurrentQuery().reset()
              }
              unsubscribe()
            }
          }

          return resultAtom
        }
      )
    }
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
      const data = get(dataAtom)
      if (
        isPromiseLike(defaultedOptions) ||
        isPromiseLike(data) ||
        isPromiseLike(observer)
      ) {
        return Promise.all([defaultedOptions, data, observer]).then(
          ([resolvedOptions, resolvedData, resolvedObserver]) => {
            const result = get(resolvedData)

            if (shouldSuspend(resolvedOptions, result, false)) {
              return resolvedObserver.fetchOptimistic(resolvedOptions)
            }

            if (
              getHasError({
                result,
                query: resolvedObserver.getCurrentQuery(),
                throwOnError: resolvedOptions.throwOnError,
              })
            ) {
              throw result.error
            }

            return result
          }
        )
      }

      const result = get(data)

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
