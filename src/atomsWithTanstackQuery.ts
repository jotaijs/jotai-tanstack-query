import { QueryClient, QueryObserver } from '@tanstack/query-core'
import type {
  QueryKey,
  QueryObserverOptions,
  QueryObserverResult,
} from '@tanstack/query-core'
import type { Getter, WritableAtom } from 'jotai'
import { buildCreateAtoms } from './common'
import { queryClientAtom } from './queryClientAtom'

type Action = {
  type: 'refetch'
  force?: boolean
  options?: Parameters<QueryObserver['refetch']>[0]
}

const createAtoms = buildCreateAtoms<
  QueryObserverOptions<any, any, any, any, any>,
  QueryObserverResult<any, any>,
  QueryObserver<any, any, any, any, any>,
  Action
>(
  (client, options) => new QueryObserver(client, options),
  (action, observer, refresh) => {
    if (action.type === 'refetch') {
      if (action.force) {
        observer.remove()
        refresh()
        return
      }
      return observer.refetch(action.options).then(() => {})
    }
  }
)

export function atomsWithTanstackQuery<
  TQueryFnData = unknown,
  TError = unknown,
  TData = TQueryFnData,
  TQueryData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey
>(
  getOptions: (
    get: Getter
  ) => QueryObserverOptions<TQueryFnData, TError, TData, TQueryData, TQueryKey>,
  getQueryClient: (get: Getter) => QueryClient = (get) => get(queryClientAtom)
): readonly [
  dataAtom: WritableAtom<TData, Action>,
  statusAtom: WritableAtom<QueryObserverResult<TData, TError>, Action>
] {
  return createAtoms(getOptions, getQueryClient)
}
