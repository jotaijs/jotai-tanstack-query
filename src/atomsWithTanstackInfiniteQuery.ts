import { InfiniteQueryObserver, QueryClient } from '@tanstack/query-core'
import type {
  InfiniteData,
  InfiniteQueryObserverOptions,
  InfiniteQueryObserverResult,
  QueryKey,
  ResetOptions,
} from '@tanstack/query-core'
import type { Getter, WritableAtom } from 'jotai'
import { buildCreateAtoms } from './atomsWithTanstackQuery'
import { queryClientAtom } from './queryClientAtom'

const createAtoms = buildCreateAtoms<
  InfiniteQueryObserverOptions<any, any, any, any, any>,
  InfiniteQueryObserver<any, any, any, any, any>,
  InfiniteQueryObserverResult<any, any>
>((client, options) => new InfiniteQueryObserver(client, options))

type Action = {
  type: 'refetch'
  force?: boolean
  options?: ResetOptions
}

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
