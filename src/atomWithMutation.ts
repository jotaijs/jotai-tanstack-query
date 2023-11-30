import {
  MutationObserver,
  type MutationObserverOptions,
  type MutationObserverResult,
  QueryClient,
} from '@tanstack/query-core'
import { Getter, atom } from 'jotai'
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
  const IN_RENDER = Symbol()
  const queryClientAtom = atom(getQueryClient)

  const optionsAtom = atom((get) => {
    const client = get(queryClientAtom)
    const options = getOptions(get)
    return client.defaultMutationOptions(options)
  })

  const observerCacheAtom = atom(
    () =>
      new WeakMap<
        QueryClient,
        MutationObserver<TData, TError, TVariables, TContext>
      >()
  )

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

      const unsubscribe = observer.subscribe(callback)
      return () => unsubscribe()
    })
    return pipe(source, toObservable)
  })

  const dataAtom = atom((get) => {
    const observer = get(observerAtom)
    const observable = get(observableAtom)

    const currentResult = observer.getCurrentResult()
    const resultAtom = atom(currentResult)

    resultAtom.onMount = (set) => {
      const { unsubscribe } = observable.subscribe((state) => {
        set(state)
      })
      return () => {
        observer.reset()
        unsubscribe()
      }
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
