import {
  MutationObserver,
  type MutationObserverOptions,
  type MutationObserverResult,
  QueryClient,
} from '@tanstack/query-core'
import { Getter, atom } from 'jotai'
import { atomWithObservable } from 'jotai/utils'
import { make, pipe, toObservable } from 'wonka'
import { queryClientAtom } from './queryClientAtom'
import { shouldThrowError } from './utils'

export function atomWithMutation<
  TData = unknown,
  TVariables = void,
  TError = unknown,
  TContext = unknown,
>(
  getOptions: (
    get: Getter
  ) => MutationObserverOptions<TData, TError, TVariables, TContext>,
  getQueryClient: (get: Getter) => QueryClient = (get) => get(queryClientAtom)
) {
  const resetAtom = atom(0)
  if (process.env.NODE_ENV !== 'production') {
    resetAtom.debugPrivate = true
  }
  const IN_RENDER = Symbol()

  const optionsAtom = atom((get) => {
    const client = getQueryClient(get)
    const options = getOptions(get)
    return client.defaultMutationOptions(options)
  })
  if (process.env.NODE_ENV !== 'production') {
    optionsAtom.debugPrivate = true
  }
  const observerCacheAtom = atom(
    () =>
      new WeakMap<
        QueryClient,
        MutationObserver<TData, TError, TVariables, TContext>
      >()
  )
  if (process.env.NODE_ENV !== 'production') {
    observerCacheAtom.debugPrivate = true
  }

  const observerAtom = atom((get) => {
    const options = get(optionsAtom)
    const client = get(queryClientAtom)
    const observerCache = get(observerCacheAtom)

    const observer = observerCache.get(client)

    if (observer) {
      ;(observer as any)[IN_RENDER] = true
      observer.setOptions(options)
      delete (observer as any)[IN_RENDER]

      return observer
    }

    const newObserver = new MutationObserver(client, options)
    observerCache.set(client, newObserver)

    return newObserver
  })
  if (process.env.NODE_ENV !== 'production') {
    observerAtom.debugPrivate = true
  }

  const observableAtom = atom((get) => {
    const observer = get(observerAtom)
    const source = make<
      MutationObserverResult<TData, TError, TVariables, TContext>
    >(({ next }) => {
      const callback = (
        result: MutationObserverResult<TData, TError, TVariables, TContext>
      ) => {
        const notifyResult = () => next(result)

        if ((observer as any)[IN_RENDER]) {
          Promise.resolve().then(notifyResult)
        } else {
          notifyResult()
        }
      }

      return observer.subscribe(callback)
    })
    const resultAtom = atomWithObservable(() => pipe(source, toObservable), {
      initialValue: observer.getCurrentResult(),
    })
    if (process.env.NODE_ENV !== 'production') {
      resultAtom.debugPrivate = true
    }
    return resultAtom
  })

  const mutateAtom = atom((get) => {
    const observer = get(observerAtom)
    const mutate = (
      variables: TVariables,
      options?: MutationObserverOptions<TData, TError, TVariables, TContext>
    ) => {
      observer.mutate(variables, options).catch(noop)
    }

    return mutate
  })
  if (process.env.NODE_ENV !== 'production') {
    mutateAtom.debugPrivate = true
  }

  return atom((get) => {
    get(resetAtom)
    const observer = get(observerAtom)
    const resultAtom = get(observableAtom)

    const result = get(resultAtom)
    const mutate = get(mutateAtom)

    resetAtom.onMount = () => {
      return () => {
        observer.reset()
      }
    }

    if (
      result.isError &&
      shouldThrowError(observer.options.throwOnError, [result.error])
    ) {
      throw result.error
    }

    return { ...result, mutate, mutateAsync: result.mutate }
  })
}

// eslint-disable-next-line @typescript-eslint/no-empty-function
function noop() {}
