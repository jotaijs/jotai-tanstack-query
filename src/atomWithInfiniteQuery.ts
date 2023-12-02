import { InfiniteQueryObserver, QueryClient } from '@tanstack/query-core'
import type {
  DefaultError,
  InfiniteData,
  InfiniteQueryObserverOptions,
  InfiniteQueryObserverResult,
  QueryKey,
  WithRequired,
} from '@tanstack/query-core'
import { type Getter, atom } from 'jotai/vanilla'
import { make, pipe, toObservable } from 'wonka'
import { queryClientAtom } from './queryClientAtom'
import { getHasError } from './utils'

export function atomWithInfiniteQuery<
  TQueryFnData,
  TError = DefaultError,
  TData = InfiniteData<TQueryFnData>,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = unknown,
>(
  getOptions: (
    get: Getter
  ) => InfiniteQueryOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam>,
  getQueryClient: (get: Getter) => QueryClient = (get) => get(queryClientAtom)
) {
  const IN_RENDER = Symbol()

  const queryClientAtom = atom(getQueryClient)
  const optionsAtom = atom((get) => {
    return getOptions(get)
  })

  const observerCacheAtom = atom(
    () =>
      new WeakMap<
        QueryClient,
        InfiniteQueryObserver<
          TQueryFnData,
          TError,
          TData,
          TQueryFnData,
          TQueryKey,
          TPageParam
        >
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

    const newObserver = new InfiniteQueryObserver(client, options)
    observerCache.set(client, newObserver)

    return newObserver
  })

  const observableAtom = atom((get) => {
    const observer = get(observerAtom)
    const source = make<InfiniteQueryObserverResult<TData, TError>>(
      ({ next }) => {
        const callback = (
          result: InfiniteQueryObserverResult<TData, TError>
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
      }
    )
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
    const options = get(optionsAtom)
    const observer = get(observerAtom)
    const resultAtom = get(dataAtom)
    const result = get(resultAtom)

    if (
      getHasError({
        query: observer.getCurrentQuery(),
        result,
        throwOnError: options.throwOnError,
      })
    ) {
      throw result.error
    }

    return result
  })
}

interface InfiniteQueryOptions<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = InfiniteData<TQueryFnData>,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = unknown,
> extends WithRequired<
    Omit<
      InfiniteQueryObserverOptions<
        TQueryFnData,
        TError,
        TData,
        TQueryFnData,
        TQueryKey,
        TPageParam
      >,
      'suspense'
    >,
    'queryKey'
  > {}
