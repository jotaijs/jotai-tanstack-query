import { InfiniteQueryObserver, QueryClient } from '@tanstack/query-core'
import type {
  InfiniteData,
  InfiniteQueryObserverOptions,
  InfiniteQueryObserverResult,
  QueryKey,
} from '@tanstack/query-core'
import type { Getter, WritableAtom } from 'jotai'
import { buildCreateAtoms } from './common'
import { queryClientAtom } from './queryClientAtom'

type Action =
  | {
      type: 'refetch'
      force?: boolean
      options?: Parameters<InfiniteQueryObserver['refetch']>[0]
    }
  | { type: 'fetchNextPage' }
  | { type: 'fetchPreviousPage' }

const createAtoms = buildCreateAtoms<
  InfiniteQueryObserverOptions<any, any, any, any, any>,
  InfiniteQueryObserverResult<any, any>,
  InfiniteQueryObserver<any, any, any, any, any>,
  Action
>(
  (client, options) => new InfiniteQueryObserver(client, options),
  (action, observer, refresh) => {
    if (action.type === 'refetch') {
      if (action.force) {
        observer.remove()
        refresh()
        return
      }
      return observer.refetch(action.options).then(() => {})
    }
    if (action.type === 'fetchNextPage') {
      return observer.fetchNextPage().then(() => {})
    }
    if (action.type === 'fetchPreviousPage') {
      return observer.fetchPreviousPage().then(() => {})
    }
  }
)

export function atomsWithTanstackInfiniteQuery<
  TQueryFnData = unknown,
  TError = unknown,
  TData = TQueryFnData,
  TQueryData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey
>(
  getOptions: (
    get: Getter
  ) => InfiniteQueryObserverOptions<
    TQueryFnData,
    TError,
    TData,
    TQueryData,
    TQueryKey
  >,
  getQueryClient: (get: Getter) => QueryClient = (get) => get(queryClientAtom)
): readonly [
  dataAtom: WritableAtom<InfiniteData<TData>, Action>,
  statusAtom: WritableAtom<InfiniteQueryObserverResult<TData, TError>, Action>
] {
  return createAtoms(getOptions, getQueryClient)
}
