import { QueryClient, isCancelledError } from '@tanstack/query-core'
import type { Getter } from 'jotai/vanilla'
import { atom } from 'jotai/vanilla'
import { atomWithObservable } from 'jotai/vanilla/utils'

export const createAtoms = <
  Options,
  Result extends {
    isSuccess: boolean
    isError: boolean
    data: any
    error: any
    dataUpdatedAt?: any
  },
  Observer extends {
    setOptions(options: Options): void
    getCurrentResult(): Result
    subscribe(callback: (result: Result) => void): () => void
  },
  Action,
  ActionResult
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

  if (process.env.NODE_ENV !== 'production') {
    observerCacheAtom.debugPrivate = true
  }

  const refreshAtom = atom(0)
  if (process.env.NODE_ENV !== 'production') {
    refreshAtom.debugPrivate = true
  }

  // This is for a special property to indicate
  // that it is in the render function.
  // It's a workaround because we can't use useEffect.
  const IN_RENDER = Symbol()

  const observerAtom = atom((get) => {
    get(refreshAtom)
    const queryClient = getQueryClient(get)
    const options = getOptions(get)
    const observerCache = get(observerCacheAtom)
    let observer = observerCache.get(queryClient)
    if (observer) {
      ;(observer as any)[IN_RENDER] = true
      observer.setOptions(options)
      delete (observer as any)[IN_RENDER]
    } else {
      observer = createObserver(queryClient, options)
      observerCache.set(queryClient, observer)
    }
    return observer
  })

  if (process.env.NODE_ENV !== 'production') {
    observerAtom.debugPrivate = true
  }

  const baseStatusAtom = atom((get) => {
    const options = getOptions(get) // re-create observable when options change
    const observer = get(observerAtom)
    const observable = {
      subscribe: (arg: { next: (result: Result) => void }) => {
        const callback = (result: Result) => {
          const notifyResult = () => arg.next(result)
          if ((observer as any)[IN_RENDER]) {
            Promise.resolve().then(notifyResult)
          } else {
            notifyResult()
          }
        }
        const unsubscribe = observer.subscribe(callback)
        const currentResult = observer.getCurrentResult()
        const optimisticResult = (observer as any).getOptimisticResult?.(
          options
        )
        const freshData =
          !currentResult?.dataUpdatedAt ||
          !optimisticResult?.dataUpdatedAt ||
          currentResult.dataUpdatedAt >= optimisticResult.dataUpdatedAt
            ? currentResult
            : optimisticResult
        callback(freshData)
        return { unsubscribe }
      },
    }
    const resultAtom = atomWithObservable(() => observable, {
      initialValue: observer.getCurrentResult(),
    })

    if (process.env.NODE_ENV !== 'production') {
      resultAtom.debugPrivate = true
    }

    return resultAtom
  })

  if (process.env.NODE_ENV !== 'production') {
    baseStatusAtom.debugPrivate = true
  }

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
    const options = getOptions(get) // re-create observable when options change
    const observer = get(observerAtom)
    const observable = {
      subscribe: (arg: { next: (result: Result) => void }) => {
        const callback = (result: Result) => {
          if (
            (result.isSuccess && result.data !== undefined) ||
            (result.isError && !isCancelledError(result.error))
          ) {
            const notifyResult = () => arg.next(result)
            if ((observer as any)[IN_RENDER]) {
              Promise.resolve().then(notifyResult)
            } else {
              notifyResult()
            }
          }
        }
        const unsubscribe = observer.subscribe(callback)
        const currentResult = observer.getCurrentResult()
        const optimisticResult = (observer as any).getOptimisticResult?.(
          options
        )
        const freshData =
          !currentResult?.dataUpdatedAt ||
          !optimisticResult?.dataUpdatedAt ||
          currentResult.dataUpdatedAt >= optimisticResult.dataUpdatedAt
            ? currentResult
            : optimisticResult
        callback(freshData)

        return { unsubscribe }
      },
    }
    const resultAtom = atomWithObservable(() => observable)

    if (process.env.NODE_ENV !== 'production') {
      resultAtom.debugPrivate = true
    }

    return resultAtom
  })

  if (process.env.NODE_ENV !== 'production') {
    baseDataAtom.debugPrivate = true
  }

  const returnResultData = (result: Result) => {
    if (result.error) {
      throw result.error
    }
    return result.data
  }

  const dataAtom = atom(
    (get) => {
      const resultAtom = get(baseDataAtom)
      const result = get(resultAtom)
      if (result instanceof Promise) {
        return result.then(returnResultData)
      }
      return returnResultData(result)
    },
    (_get, set, action: Action) => set(statusAtom, action)
  )

  return [dataAtom, statusAtom] as const
}

export const createAsyncAtoms = <
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
  Action,
  ActionResult
>(
  getOptions: (get: Getter) => Promise<Options>,
  getQueryClient: (get: Getter) => QueryClient,
  createObserver: (client: QueryClient, options: Options) => Observer,
  handleAction: (
    action: Action,
    observer: Observer,
    refresh: () => void
  ) => Promise<ActionResult>
) => {
  const observerCacheAtom = atom(() => new WeakMap<QueryClient, Observer>())

  if (process.env.NODE_ENV !== 'production') {
    observerCacheAtom.debugPrivate = true
  }

  const refreshAtom = atom(0)
  if (process.env.NODE_ENV !== 'production') {
    refreshAtom.debugPrivate = true
  }

  // This is for a special property to indicate
  // that it is in the render function.
  // It's a workaround because we can't use useEffect.
  const IN_RENDER = Symbol()

  const observerAtom = atom(async (get) => {
    get(refreshAtom)
    const options = await getOptions(get)
    const queryClient = getQueryClient(get)
    const observerCache = get(observerCacheAtom)
    let observer = observerCache.get(queryClient)
    if (observer) {
      ;(observer as any)[IN_RENDER] = true
      observer.setOptions(options)
      delete (observer as any)[IN_RENDER]
    } else {
      observer = createObserver(queryClient, options)
      observerCache.set(queryClient, observer)
    }
    return observer
  })

  if (process.env.NODE_ENV !== 'production') {
    observerAtom.debugPrivate = true
  }

  const baseStatusAtom = atom(async (get) => {
    const observer = await get(observerAtom)
    const observable = {
      subscribe: (arg: { next: (result: Result) => void }) => {
        const callback = (result: Result) => {
          const notifyResult = () => arg.next(result)
          if ((observer as any)[IN_RENDER]) {
            Promise.resolve().then(notifyResult)
          } else {
            notifyResult()
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

    if (process.env.NODE_ENV !== 'production') {
      resultAtom.debugPrivate = true
    }

    return resultAtom
  })

  if (process.env.NODE_ENV !== 'production') {
    baseStatusAtom.debugPrivate = true
  }

  const statusAtom = atom(
    async (get) => {
      const resultAtom = await get(baseStatusAtom)
      return get(resultAtom)
    },
    async (get, set, action: Action) => {
      const observer = await get(observerAtom)
      const refresh = () => {
        const queryClient = getQueryClient(get)
        const observerCache = get(observerCacheAtom)
        observerCache.delete(queryClient)
        set(refreshAtom, (c) => c + 1)
      }
      return await handleAction(action, observer, refresh)
    }
  )

  const baseDataAtom = atom(async (get) => {
    getOptions(get) // re-create observable when options change
    const observer = await get(observerAtom)
    const observable = {
      subscribe: (arg: { next: (result: Result) => void }) => {
        const callback = (result: Result) => {
          if (
            (result.isSuccess && result.data !== undefined) ||
            (result.isError && !isCancelledError(result.error))
          ) {
            const notifyResult = () => arg.next(result)
            if ((observer as any)[IN_RENDER]) {
              Promise.resolve().then(notifyResult)
            } else {
              notifyResult()
            }
          }
        }
        const unsubscribe = observer.subscribe(callback)
        callback(observer.getCurrentResult())
        return { unsubscribe }
      },
    }
    const resultAtom = atomWithObservable(() => observable)

    if (process.env.NODE_ENV !== 'production') {
      resultAtom.debugPrivate = true
    }

    return resultAtom
  })

  if (process.env.NODE_ENV !== 'production') {
    baseDataAtom.debugPrivate = true
  }

  const returnResultData = (result: Result) => {
    if (result.error) {
      throw result.error
    }
    return result.data
  }

  const dataAtom = atom(
    async (get) => {
      const resultAtom = await get(baseDataAtom)
      const result = await get(resultAtom)
      if (result instanceof Promise) {
        return result.then(returnResultData)
      }
      return await returnResultData(result)
    },
    (_get, set, action: Action) => set(statusAtom, action)
  )

  return [dataAtom, statusAtom] as const
}
