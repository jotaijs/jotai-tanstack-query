import {
  QueryClient,
  type QueryKey,
  QueryObserver,
  type QueryObserverOptions,
} from '@tanstack/query-core'
import { Getter, atom } from 'jotai'
import { queryClientAtom } from './queryClientAtom'

export const atomWithSuspenseQuery = <
  TQueryFnData = unknown,
  TError = unknown,
  TData = TQueryFnData,
  TQueryData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
  TSuspense extends boolean = false,
>(
  getOptions: (
    get: Getter
  ) => QueryObserverOptions<
    TQueryFnData,
    TError,
    TData,
    TQueryData,
    TQueryKey
  > & { suspense?: TSuspense },
  getQueryClient: (get: Getter) => QueryClient = (get) => get(queryClientAtom)
) => {
  return atom((get) => {
    const options = { ...getOptions(get), enabled: true, suspense: true }
    const queryClient = getQueryClient(get)
    const defaultedQueryOptions = queryClient.defaultQueryOptions(options)
    const observer = new QueryObserver(queryClient, defaultedQueryOptions)
    // const errorResetBoundary = get(errorResetBoundaryAtom)

    return observer.fetchOptimistic(defaultedQueryOptions).catch(() => {
      //reset error boundary state
    })
  })
}
