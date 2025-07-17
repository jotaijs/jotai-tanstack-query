import {
  type DefaultError,
  QueryClient,
  type QueryKey,
  QueryObserver,
} from '@tanstack/query-core'
import { Getter, WritableAtom, atom } from 'jotai'
import { baseAtomWithQuery } from './baseAtomWithQuery'
import { queryClientAtom } from './queryClientAtom'
import { AtomWithQueryOptions, AtomWithQueryResult } from './types'

export function atomWithQueries<
  TCombinedResult,
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(
  {
    queries,
    combine,
  }: {
    queries: Array<
      (
        get: Getter
      ) => AtomWithQueryOptions<TQueryFnData, TError, TData, TQueryKey>
    >
    combine: (
      results: AtomWithQueryResult<TQueryFnData, TError>[]
    ) => TCombinedResult
  },
  getQueryClient?: (get: Getter) => QueryClient
): WritableAtom<TCombinedResult, [], void>
export function atomWithQueries<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(
  {
    queries,
  }: {
    queries: Array<
      (
        get: Getter
      ) => AtomWithQueryOptions<TQueryFnData, TError, TData, TQueryKey>
    >
  },
  getQueryClient?: (get: Getter) => QueryClient
): Array<WritableAtom<AtomWithQueryResult<TQueryFnData, TError>, [], void>>

export function atomWithQueries(
  {
    queries,
    combine,
  }: {
    queries: Array<(get: Getter) => AtomWithQueryOptions>
    combine?: (results: AtomWithQueryResult[]) => any
  },
  getQueryClient: (get: Getter) => QueryClient = (get) => get(queryClientAtom)
): any {
  if (!combine) {
    return queries.map((getOptions) =>
      baseAtomWithQuery(getOptions, QueryObserver, getQueryClient)
    )
  }

  const queryAtoms = queries.map((getOptions) =>
    baseAtomWithQuery(getOptions, QueryObserver, getQueryClient)
  )

  return atom((get) => {
    const results = queryAtoms.map((queryAtom) => {
      const result = get(queryAtom)
      return result as AtomWithQueryResult
    })
    return combine(results)
  })
}
