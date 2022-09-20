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
  getQueryClient?: (get: Getter) => QueryClient
) {
  type Result = QueryObserverResult<TData, TError>

  const observerAtom = atom((get) => {
    const queryClient = getQueryClient
      ? getQueryClient(get)
      : get(queryClientAtom)
    const options = getOptions(get)
    const observer = new QueryObserver(queryClient, options)
    return observer
  })

  const resultAtom = atomWithDefault((get) => {
    const observer = get(observerAtom)
    return observer.getCurrentResult() as Result
  })

  const baseStatusAtom = atom(
    (get) => get(resultAtom),
    (get, set, registerCleanup: (cleanup: () => void) => void) => {
      const observer = get(observerAtom)
      const unsubscribe = observer.subscribe((result) => {
        set(resultAtom, result)
      })
      registerCleanup(unsubscribe)
    }
  )
  baseStatusAtom.onMount = (initialize) => {
    let unsub: (() => void) | undefined | false
    initialize((cleanup) => {
      if (unsub === false) {
        cleanup()
      } else {
        unsub = cleanup
      }
    })
    return () => {
      if (unsub) {
        unsub()
      }
      unsub = false
    }
  }

  const statusAtom = atom(
    (get) => get(baseStatusAtom),
    (get, set, action: Action) => {
      // TODO
      console.log('TODO', get, set, action)
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
    (get, set, action: Action) => {
      // TODO
      console.log('TODO', get, set, action)
    }
  )

  return [dataAtom, statusAtom] as const
}
