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
    setOptions(options: Options, notifyOptions?: { listeners?: boolean }): void
    getCurrentResult(): Result
    subscribe(callback: (result: Result) => void): () => void
  },
  Action,
  ActionResult extends Promise<void> | void
>(
  getOptions: (get: Getter) => Options,
  getQueryClient: (get: Getter) => QueryClient,
  createObserver: (client: QueryClient, options: Options) => Observer,
  handleAction: (
    action: Action,
    observer: Observer,
    refresh: () => void
  ) => ActionResult
) => {
  const observerCacheAtom = atom(() => new WeakMap<QueryClient, Observer>())

  const refreshAtom = atom(0)

  // Hoped `notifyOptions.listeners = false` works,
  // but it doesn't work as expected.
  // So, the workaround is this special property.
  const SKIP_LISTENERS = Symbol()

  const observerAtom = atom((get) => {
    get(refreshAtom)
    const queryClient = getQueryClient(get)
    const options = getOptions(get)
    const observerCache = get(observerCacheAtom)
    let observer = observerCache.get(queryClient)
    if (observer) {
      ;(observer as any)[SKIP_LISTENERS] = true
      observer.setOptions(options, { listeners: false })
      delete (observer as any)[SKIP_LISTENERS]
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
          if (!(observer as any)[SKIP_LISTENERS]) {
            ;(typeof arg === 'function' ? arg : arg.next)(result)
          }
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
            !(observer as any)[SKIP_LISTENERS] &&
            ((result.isSuccess && result.data !== undefined) ||
              (result.isError && !isCancelledError(result.error)))
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
