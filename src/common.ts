import { QueryClient, isCancelledError } from '@tanstack/query-core'
import { atom } from 'jotai'
import type { Getter } from 'jotai'
import { atomWithObservable } from 'jotai/utils'

export const createAtoms = <
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
    destroy?(): void
  },
  Action
>(
  getOptions: (get: Getter) => Options,
  getQueryClient: (get: Getter) => QueryClient,
  createObserver: (client: QueryClient, options: Options) => Observer,
  handleAction: (
    action: Action,
    observer: Observer,
    refresh: () => void
  ) => Promise<void> | void
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
      if (observer.destroy) {
        observer.destroy()
        observer.setOptions(options)
      } else {
        Promise.resolve().then(() => {
          ;(observer as Observer).setOptions(options)
        })
      }
    } else {
      observer = createObserver(queryClient, options)
      observerCache.set(queryClient, observer)
    }
    return observer
  })

  const baseStatusAtom = atom((get) => {
    const observer = get(observerAtom)
    const observable = {
      subscribe: (
        arg: { next: (result: Result) => void } | ((result: Result) => void)
      ) => {
        const callback = (result: Result) => {
          ;(typeof arg === 'function' ? arg : arg.next)(result)
        }
        const unsubscribe = observer.subscribe(callback)
        callback(observer.getCurrentResult())
        return { unsubscribe }
      },
    }
    const resultAtom = atomWithObservable(() => observable, {
      initialValue: observer.getCurrentResult(),
    })
    return resultAtom
  })

  const statusAtom = atom(
    (get) => {
      const resultAtom = get(baseStatusAtom)
      return get(resultAtom)
    },
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

  const baseDataAtom = atom((get) => {
    getOptions(get) // re-create observable when options change
    const observer = get(observerAtom)
    const observable = {
      subscribe: (
        arg: { next: (result: Result) => void } | ((result: Result) => void)
      ) => {
        const callback = (result: Result) => {
          if (
            (result.isSuccess && result.data !== undefined) ||
            (result.isError && !isCancelledError(result.error))
          ) {
            ;(typeof arg === 'function' ? arg : arg.next)(result)
          }
        }
        const unsubscribe = observer.subscribe(callback)
        callback(observer.getCurrentResult())
        return { unsubscribe }
      },
    }
    const resultAtom = atomWithObservable(() => observable)
    return resultAtom
  })

  const dataAtom = atom(
    (get) => {
      const resultAtom = get(baseDataAtom)
      const result = get(resultAtom)
      if (result.error) {
        throw result.error
      }
      return result.data
    },
    (_get, set, action: Action) => set(statusAtom, action)
  )

  return [dataAtom, statusAtom] as const
}
