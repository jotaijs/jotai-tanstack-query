import {
  type DefaultError,
  QueryClient,
  QueryObserver,
} from '@tanstack/query-core'
import { Getter, WritableAtom, atom } from 'jotai'
import { queryClientAtom } from './_queryClientAtom'
import { baseAtomWithQuery } from './baseAtomWithQuery'
import { AtomWithQueryOptions, AtomWithQueryResult } from './types'

export function atomWithQueries<TCombinedResult>(
  {
    queries,
    combine,
  }: {
    queries: Array<(get: Getter) => AtomWithQueryOptions>
    combine: (results: AtomWithQueryResult[]) => TCombinedResult
  },
  getQueryClient?: (get: Getter) => QueryClient
): WritableAtom<TCombinedResult, [], void>
export function atomWithQueries<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
>(
  {
    queries,
  }: {
    queries: Array<(get: Getter) => AtomWithQueryOptions>
  },
  getQueryClient?: (get: Getter) => QueryClient
): Array<WritableAtom<AtomWithQueryResult<TData, TError>, [], void>>

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
