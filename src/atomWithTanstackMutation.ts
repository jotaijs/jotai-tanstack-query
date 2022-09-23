import { MutationObserver, QueryClient } from '@tanstack/query-core'
import type {
  MutateOptions,
  MutationObserverOptions,
  MutationObserverResult,
} from '@tanstack/query-core'
import { atom } from 'jotai'
import type { Getter, WritableAtom } from 'jotai'
import { atomWithDefault } from 'jotai/utils'
import { queryClientAtom } from './queryClientAtom'

type Action<TData, TError, TVariables, TContext> = [
  variables: TVariables,
  options?: MutateOptions<TData, TError, TVariables, TContext>
]

export function atomWithTanstackMutation<
  TData = unknown,
  TError = unknown,
  TVariables = void,
  TContext = unknown
>(
  getOptions: (
    get: Getter
  ) => MutationObserverOptions<TData, TError, TVariables, TContext>,
  getQueryClient: (get: Getter) => QueryClient = (get) => get(queryClientAtom)
): WritableAtom<
  MutationObserverResult<TData, TError, TVariables, TContext>,
  Action<TData, TError, TVariables, TContext>
> {
  const observerCacheAtom = atom(
    () =>
      new WeakMap<
        QueryClient,
        MutationObserver<TData, TError, TVariables, TContext>
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
      observer = new MutationObserver(queryClient, options)
      observerCache.set(queryClient, observer)
    }
    return observer
  })

  const resultAtom = atomWithDefault((get) => {
    const observer = get(observerAtom)
    return observer.getCurrentResult()
  })

  const baseStatusAtom = atom(
    (get) => get(resultAtom),
    (get, set, returnUnsubscribe: (unsubscribe: () => void) => void) => {
      const observer = get(observerAtom)
      const unsubscribe = observer.subscribe((result) => {
        set(resultAtom, result)
      })
      set(resultAtom, observer.getCurrentResult())
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
    async (get, _set, action: Action<TData, TError, TVariables, TContext>) => {
      const observer = get(observerAtom)
      await observer.mutate(...action)
    }
  )

  return statusAtom
}
