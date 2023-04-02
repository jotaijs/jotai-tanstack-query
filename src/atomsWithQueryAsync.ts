import type {
  QueryKey,
  QueryObserverOptions,
  QueryObserverResult,
} from '@tanstack/query-core'
import { QueryClient, QueryObserver } from '@tanstack/query-core'
import type { Getter, WritableAtom } from 'jotai'
import { createAsyncAtoms } from './common'
import { queryClientAtom } from './queryClientAtom'

type Action = {
  type: 'refetch'
  force?: boolean
  options?: Parameters<QueryObserver['refetch']>[0]
}

export function atomsWithQueryAsync<
  TQueryFnData = unknown,
  TError = unknown,
  TData = TQueryFnData,
  TQueryData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey
>(
  getOptions: (
    get: Getter
  ) => Promise<
    QueryObserverOptions<TQueryFnData, TError, TData, TQueryData, TQueryKey>
  >,
  getQueryClient: (get: Getter) => QueryClient = (get) => get(queryClientAtom)
): readonly [
  dataAtom: WritableAtom<
    Promise<TData>,
    [Action],
    Promise<QueryObserverResult<TData, TError>> | undefined
  >,
  statusAtom: WritableAtom<
    QueryObserverResult<TData, TError>,
    [Action],
    Promise<QueryObserverResult<TData, TError>> | undefined
  >
] {
  return createAsyncAtoms(
    getOptions,
    getQueryClient,
    (client, options) => new QueryObserver(client, options),
    async (action: Action, observer, refresh) => {
      if (action.type === 'refetch') {
        if (action.force) {
          observer.remove()
          refresh()
          return
        }
        return await observer.refetch(action.options)
      }
    }
  ) as any
}
