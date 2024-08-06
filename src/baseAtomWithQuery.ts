import {
  QueryClient,
  QueryKey,
  QueryObserver,
  QueryObserverResult,
  hashKey,
} from '@tanstack/query-core'
import { Atom, Getter, atom } from 'jotai'
import { queryClientAtom } from './queryClientAtom'
import { BaseAtomWithQueryOptions } from './types'
import { ensureStaleTime, getHasError, shouldSuspend, wait } from './utils'

export function baseAtomWithQuery<
  TQueryFnData,
  TError,
  TData,
  TQueryData,
  TQueryKey extends QueryKey,
>(
  getOptions: (
    get: Getter
  ) => BaseAtomWithQueryOptions<
    TQueryFnData,
    TError,
    TData,
    TQueryData,
    TQueryKey
  >,
  Observer: typeof QueryObserver,
  getQueryClient: (get: Getter) => QueryClient = (get) => get(queryClientAtom)
): Atom<
  | QueryObserverResult<TData, TError>
  | Promise<QueryObserverResult<TData, TError>>
> {
  const clientAtom = atom(getQueryClient)
  const observerCacheAtom = atom(
    () =>
      new WeakMap<
        QueryClient,
        QueryObserver<TQueryFnData, TError, TData, TQueryData, TQueryKey>
      >()
  )
  const defaultedOptionsAtom = atom((get) => {
    const client = get(clientAtom)
    const options = getOptions(get)
    const defaultedOptions = client.defaultQueryOptions(options)

    const cache = get(observerCacheAtom)
    const cachedObserver = cache.get(client)

    defaultedOptions._optimisticResults = 'optimistic'

    if (cachedObserver) {
      // This is equivalent to this effect
      // https://github.com/TanStack/query/blob/main/packages/react-query/src/useBaseQuery.ts#L94
      // but notice that tanstack/react-query is always returning either observer.getOptimisticResult or observer.fetchOptimistic,
      // it never uses value from observer.subscribe (and this implementation does).
      //
      // Yet, I think that it works as expected,
      // because if theres an error, then resultAtom is cleared, therefore after remounting, optimisticResultAtom will be called.
      cachedObserver.setOptions(defaultedOptions, {
        listeners: false,
      })
    }

    return ensureStaleTime(defaultedOptions)
  })
  const observerAtom = atom((get) => {
    const client = get(clientAtom)
    const observerCache = get(observerCacheAtom)
    const cachedObserver = observerCache.get(client)

    if (cachedObserver) {
      return cachedObserver
    }
    // Prevent recalculating this atom by getting defaultedOptions only when creating observer for the first time,
    // later observer options will get updated via defaultedOptionsAtom.
    const defaultedOptions = get(defaultedOptionsAtom)
    const newObserver = new Observer<
      TQueryFnData,
      TError,
      TData,
      TQueryData,
      TQueryKey
    >(client, defaultedOptions)
    // Is it good approach to use client as WeakMap key? Would observer get ever garbage collected?
    // Why not assign it to scoped variable?
    // When whole atom is no longer accessible via reference, then observer should also get garbage collected.
    observerCache.set(client, newObserver)

    return newObserver
  })
  const queryResultGetterAtom = atom((get) => {
    const observer = get(observerAtom)
    // When this atom has value other than null, it means that query result
    // has been obtained either by optimisticResultAtom or query subscription defined in onMount below.
    // Value is set to null when query is resetting.
    const queryResultAtom = atom<QueryObserverResult<TData, TError> | null>(
      null
    )
    // Subscribe to query result updates. Note that this happens only when query did not throw promise or error
    // (therefore it has to have valid result)
    queryResultAtom.onMount = (set) => {
      // tanstack/react-query useBaseQuery is wrapping 'set' with
      // https://tanstack.com/query/latest/docs/reference/notifyManager#notifymanagerbatchcalls
      // not sure is it relevant here.
      const unsubscribe = observer.subscribe(set)
      // comment and line from tanstack/react-query useBaseQuery:
      // Update result to make sure we did not miss any query updates
      // between creating the observer and subscribing to it.
      observer.updateResult()

      return () => {
        // Is there any case where it makes sense to reset value on queryAtom unmount?
        // I think that it will get garbage collected due to WeakMap usage by jotai.
        // Doing this could result in returning outdated state in returnAtom.
        // set(null);
        unsubscribe()
      }
    }

    return queryResultAtom
  })
  // Simple counter which allows to retrigger optimisticResultAtom calculation, after resetting atom.
  const optimisticResultResetAtom = atom(0)
  const queryKeyAtom = atom((get) =>
    hashKey(get(defaultedOptionsAtom).queryKey)
  )
  // Reset queryResult each time when queryKey has changed.
  const resetQueryResultOnQueryKeyChangeAtom = atom(
    (get, { setSelf }) => {
      get(queryKeyAtom)

      Promise.resolve().then(setSelf)
    },
    (get, set) => {
      set(get(queryResultGetterAtom), null)
      set(optimisticResultResetAtom, get(optimisticResultResetAtom) + 1)
    }
  )

  // Request optimistic result from observer. Decide whether to suspend or not.
  // This atom will recalculate only once per atom reset - see returnAtom.
  const optimisticResultAtom = atom<
    | Promise<QueryObserverResult<TData, TError>>
    | QueryObserverResult<TData, TError>,
    [QueryObserverResult<TData, TError>],
    void
  >(
    (get, { setSelf }) => {
      const observer = get(observerAtom)
      const defaultedOptions = get(defaultedOptionsAtom)
      // Recalculate atom when query is resetted.
      get(optimisticResultResetAtom)

      const result = observer.getOptimisticResult(defaultedOptions)

      if (!shouldSuspend(defaultedOptions, result, false)) {
        // Update queryResultAtom with sync result.
        Promise.resolve(result).then(setSelf)

        return result
      }

      return (
        observer
          .fetchOptimistic(defaultedOptions)
          .then((succeedResult) => {
            setSelf(succeedResult)

            return succeedResult
          })
          // useSuspenseQuery is catching fetchOptimistic error, and triggers error boundary.
          // Later, when error boundary is resetted, it means that useSuspenseQuery is mounting, and it's resetting the query.
          // (therefore for useSuspenseQuery, when error boundary is active then query.state.status === 'error'? Not sure is it like this)
          //
          // Jotai also has to catch error, because if error would be set as atom value,
          // then recovering from error is possible only by outside call
          // - see https://github.com/jotaijs/jotai-tanstack-query/issues/32#issue-1684399582
          // This is different than jotai-tanstack-query current implementation.
          .catch(() => {
            // Since fetchOptimistic failed, error has to be thrown, but let's do it same way as tanstack/react-query useBaseQuery.
            // Error handling is done in returnAtom, but first, current query result must be obtained.
            //
            // observer.currentResult() has outdated value, and observer.updateResult() doesn't help,
            // (I'm guessing that's due how observer.getOptimisticResult behaves with suspense = true)
            // therefore get optimisticResult but without activating query (_optimisticResults: undefined [I think that's how it works])
            const { _optimisticResults, ...clearedDefaultedOptions } =
              defaultedOptions

            const erroredResult = observer.getOptimisticResult(
              clearedDefaultedOptions
            )

            setSelf(erroredResult)

            return erroredResult
          })
      )
    },
    (get, set, result) => {
      // Update queryResultAtom.
      set(get(queryResultGetterAtom), result)
    }
  )
  // Better name or just return without variable assignment?
  const returnAtom = atom<
    | QueryObserverResult<TData, TError>
    | Promise<QueryObserverResult<TData, TError>>,
    [],
    Promise<void>
  >(
    (get, { setSelf }) => {
      const result = get(get(queryResultGetterAtom))
      // If queryResultAtom has null value it means that value has not yet been obtained from observer.
      // Therefore read optimisticResultAtom which activates query and decides whether to suspend or not.
      if (result === null) {
        // Notice that this atom has valid (up to date) value only just after mounting or resetting queryAtom,
        // Later, valid value is held in queryResultAtom.
        return get(optimisticResultAtom)
      }
      // At this point, for atomWithSuspenseQuery it's known that fetchOptimistic promise has been resolved,
      // but it could be resolved with error, which is not yet handled.
      // Same goes for atomWithQuery (but it could throw error only by using custom throwOnError).
      // Therefore verify does query has error or not.

      // Theres potential to retrieve pre 0.8 feature of having async query options getter,
      //  because we only need options.throwOnError there
      // which is non-async function, but this only makes sense for atomWithSuspenseQuery - would have to think about it.
      get(resetQueryResultOnQueryKeyChangeAtom)
      const options = get(defaultedOptionsAtom)
      const query = get(observerAtom).getCurrentQuery()

      if (
        getHasError({
          result,
          query,
          throwOnError: options.throwOnError,
        })
      ) {
        // Atom reset has to be scheduled just before throwing error,
        //  because atom needs to somehow recover from error boundary,
        // and if left in error state after unmounting component, thats not possible without outside call.
        // If needed that outside call is still possible by using useSetAtom(yourAtomWithQuery),
        // but now it's easier to maintain and does not require manually resetting query.

        // While using Promise.resolve().then(setSelf) or wait(0), returnAtom was recalculating before error boundary caught error,
        // Maybe @dai-shi could check am I not doing some bad things out there.
        wait(1).then(setSelf)

        throw result.error
      }
      // Non-promise result without error - return it.
      return result
    },
    async (get, set) => {
      // Not sure is it a good call to reset query there.
      // tanstack/react-query provides resetErrorBoundary callback, which uses react context under the hood.
      // This callback does not reset query, instead it sets a value which is later read when useQuery/useSuspenseQuery
      // is triggered (after resetting error boundary).
      // https://github.com/TanStack/query/blob/main/packages/react-query/src/errorBoundaryUtils.ts#L29
      // Then, if I understand correctly - query goes back to fetching state, but it still has error.
      get(observerAtom).getCurrentQuery().reset()
      // Reset to initial state and allow to recalculate optimisticResultAtom
      set(get(queryResultGetterAtom), null)
      set(optimisticResultResetAtom, get(optimisticResultResetAtom) + 1)
    }
  )

  return returnAtom
}
