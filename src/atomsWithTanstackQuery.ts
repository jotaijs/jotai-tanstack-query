import { QueryClient, QueryObserver } from '@tanstack/query-core'
import type {
  QueryKey,
  QueryObserverOptions,
  QueryObserverResult,
} from '@tanstack/query-core'
import { atom } from 'jotai'
import type { Getter } from 'jotai'
import { atomWithDefault, atomWithObservable } from 'jotai/utils'
import { queryClientAtom } from './queryClientAtom'

type Action = {
  type: 'refetch'
  force?: boolean
}

export function atomsWithTanstackQuery<
  TQueryFnData = unknown,
  TError = unknown,
  TData = TQueryFnData,
  TQueryData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey
>(
  getOptions: (
    get: Getter
  ) => QueryObserverOptions<TQueryFnData, TError, TData, TQueryData, TQueryKey>,
  getQueryClient: (get: Getter) => QueryClient = (get) => get(queryClientAtom)
) {
  type Result = QueryObserverResult<TData, TError>

  const observerCacheAtom = atom(
    () =>
      new WeakMap<
        QueryClient,
        QueryObserver<TQueryFnData, TError, TData, TQueryData, TQueryKey>
      >()
  )

  const observerAtom = atom((get) => {
    const queryClient = getQueryClient(get)
    const options = getOptions(get)
    const observerCache = get(observerCacheAtom)
    let observer = observerCache.get(queryClient)
    if (observer) {
      observer.setOptions(options)
    } else {
      observer = new QueryObserver(queryClient, options)
      observerCache.set(queryClient, observer)
    }
    return observer
  })

  const resultAtom = atomWithDefault((get) => {
    const observer = get(observerAtom)
    return observer.getCurrentResult() as Result
  })

  const baseStatusAtom = atom(
    (get) => get(resultAtom),
    (get, set, returnUnsubscribe: (unsubscribe: () => void) => void) => {
      const observer = get(observerAtom)
      const unsubscribe = observer.subscribe((result) => {
        set(resultAtom, result)
      })
      returnUnsubscribe(unsubscribe)
    }
  )
  baseStatusAtom.onMount = (initialize) => {
    let unsub: (() => void) | undefined
    initialize((unsubscribe) => {
      unsub = unsubscribe
    })
    return unsub
  }

  const statusAtom = atom(
    (get) => get(baseStatusAtom),
    (get, _set, action: Action) => {
      if (action.type === 'refetch') {
        if (action.force) {
          const queryClient = getQueryClient(get)
          const observerCache = get(observerCacheAtom)
          observerCache.delete(queryClient)
        }
        const observer = get(observerAtom)
        return observer.refetch({ cancelRefetch: true }).then(() => {})
      }
    }
  )

  const baseDataAtom = atomWithObservable((get) => {
    const observer = get(observerAtom)
    const observable = {
      subscribe: (
        arg: { next: (result: Result) => void } | ((result: Result) => void)
      ) => {
        const callback = (result: Result) => {
          if (result.error || result.data !== undefined) {
            ;(typeof arg === 'function' ? arg : arg.next)(result)
          }
        }
        const unsubscribe = observer.subscribe(callback)
        callback(observer.getCurrentResult() as Result)
        return { unsubscribe }
      },
    }
    return observable
  })

  const dataAtom = atom(
    (get) => {
      const baseData = get(baseDataAtom)
      if (baseData.error) {
        throw baseData.error
      }
      return baseData.data as TData
    },
    (_get, set, action: Action) => set(statusAtom, action)
  )

  return [dataAtom, statusAtom] as const
}
