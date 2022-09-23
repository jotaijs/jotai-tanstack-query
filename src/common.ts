import { QueryClient, isCancelledError } from '@tanstack/query-core'
import { atom } from 'jotai'
import type { Getter } from 'jotai'
import { atomWithDefault, atomWithObservable } from 'jotai/utils'

export const buildCreateAtoms =
  <
    Options,
    Result extends {
      isSuccess: boolean
      isError: boolean
      data: any
      error: any
    },
    Observer extends {
      setOptions(options: Options): void
      getCurrentResult(): Result
      subscribe(callback: (result: Result) => void): () => void
    },
    Action
  >(
    createObserver: (client: QueryClient, options: Options) => Observer,
    handleAction: (
      action: Action,
      observer: Observer,
      refresh: () => void
    ) => Promise<void> | void
  ) =>
  (
    getOptions: (get: Getter) => Options,
    getQueryClient: (get: Getter) => QueryClient
  ) => {
    const observerCacheAtom = atom(() => new WeakMap<QueryClient, Observer>())

    const refreshAtom = atom(0)

    const observerAtom = atom((get) => {
      get(refreshAtom)
      const queryClient = getQueryClient(get)
      const options = getOptions(get)
      const observerCache = get(observerCacheAtom)
      let observer = observerCache.get(queryClient)
      if (observer) {
        observer.setOptions(options)
      } else {
        observer = createObserver(queryClient, options)
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
          set(resultAtom, result as Result)
        })
        set(resultAtom, observer.getCurrentResult() as Result)
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
      (get, set, action: Action) => {
        const observer = get(observerAtom)
        const refresh = () => {
          const queryClient = getQueryClient(get)
          const observerCache = get(observerCacheAtom)
          observerCache.delete(queryClient)
          set(refreshAtom, (c) => c + 1)
        }
        return handleAction(action, observer, refresh)
      }
    )

    const baseDataAtom = atomWithObservable((get) => {
      const observer = get(observerAtom)
      const observable = {
        subscribe: (
          arg: { next: (result: Result) => void } | ((result: Result) => void)
        ) => {
          const callback = (result: Result) => {
            if (
              (result.isSuccess && result.data !== undefined) ||
              (result.isError && isCancelledError(result.error))
            ) {
              ;(typeof arg === 'function' ? arg : arg.next)(result)
            }
          }
          const unsubscribe = observer.subscribe(
            callback as (result: unknown) => void
          )
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
        return baseData.data
      },
      (_get, set, action: Action) => set(statusAtom, action)
    )

    return [dataAtom, statusAtom] as const
  }
