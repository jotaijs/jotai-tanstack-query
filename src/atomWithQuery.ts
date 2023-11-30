import type {
  QueryClient,
  QueryKey,
  QueryObserverOptions,
  QueryObserverResult,
} from '@tanstack/query-core'
import { QueryObserver } from '@tanstack/query-core'
import { Atom, Getter, atom } from 'jotai'
import { make, pipe, toObservable } from 'wonka'
import { isResetAtom } from './QueryAtomErrorResetBoundary'
import { queryClientAtom } from './queryClientAtom'

export function atomWithQuery<
  TQueryFnData = unknown,
  TError = unknown,
  TData = TQueryFnData,
  TQueryData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(
  getOptions: (
    get: Getter
  ) => Omit<
    QueryObserverOptions<TQueryFnData, TError, TData, TQueryData, TQueryKey>,
    'suspense'
  >,
  getQueryClient: (get: Getter) => QueryClient = (get) => get(queryClientAtom)
): Atom<QueryObserverResult<TData, TError>> {
  const IN_RENDER = Symbol()

  const queryClientAtom = atom(getQueryClient)
  const optionsAtom = atom((get) => {
    const client = get(queryClientAtom)
    const options = getOptions(get)
    return client.defaultQueryOptions(options)
  })

  const observerCacheAtom = atom(
    () =>
      new WeakMap<
        QueryClient,
        QueryObserver<TQueryFnData, TError, TData, TQueryData, TQueryKey>
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

    const newObserver = new QueryObserver(client, options)
    observerCache.set(client, newObserver)

    return newObserver
  })

  const observableAtom = atom((get) => {
    const observer = get(observerAtom)
    const source = make<QueryObserverResult<TData, TError>>(({ next }) => {
      const callback = (result: QueryObserverResult<TData, TError>) => {
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
      return () => unsubscribe()
    }

    return resultAtom
  })

  return atom((get) => {
    const resultAtom = get(dataAtom)
    const result = get(resultAtom)

    if (result.isError && !result.isFetching) {
      throw result.error
    }

    return result
  })
}
