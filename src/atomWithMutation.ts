import {
  MutationObserver,
  MutationOptions,
  QueryClient,
} from '@tanstack/query-core'
import { Atom, Getter, atom } from 'jotai'
import { queryClientAtom } from './queryClientAtom'
import { AtomWithMutationResult, MutateFunction } from './types'
import { shouldThrowError } from './utils'

export function atomWithMutation<
  TData = unknown,
  TVariables = void,
  TError = unknown,
  TContext = unknown,
>(
  getOptions: (
    get: Getter
  ) => MutationOptions<TData, TError, TVariables, TContext>,
  getQueryClient: (get: Getter) => QueryClient = (get) => get(queryClientAtom)
): Atom<AtomWithMutationResult<TData, TError, TVariables, TContext>> {
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
    const client = getQueryClient(get)
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

  const dataAtom = atom((get) => {
    const observer = get(observerAtom)
    // const observable = get(observableAtom)

    const currentResult = observer.getCurrentResult()
    const resultAtom = atom(currentResult)

    resultAtom.onMount = (set) => {
      const unsubscribe = observer.subscribe((state) => {
        set(state)
      })
      return () => {
        unsubscribe()
        observer.reset()
      }
    }
    if (process.env.NODE_ENV !== 'production') {
      resultAtom.debugPrivate = true
    }

    return resultAtom
  })

  const mutateAtom = atom((get) => {
    const observer = get(observerAtom)
    const mutate: MutateFunction<TData, TError, TVariables, TContext> = (
      variables,
      options
    ) => {
      observer.mutate(variables, options).catch(noop)
    }

    return mutate
  })
  if (process.env.NODE_ENV !== 'production') {
    mutateAtom.debugPrivate = true
  }

  return atom((get) => {
    const observer = get(observerAtom)
    const resultAtom = get(dataAtom)

    const result = get(resultAtom)
    const mutate = get(mutateAtom)

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
