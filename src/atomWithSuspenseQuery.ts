import {
  DefaultError,
  QueryClient,
  QueryKey,
  QueryObserver,
} from '@tanstack/query-core'
import { Atom, Getter, atom } from 'jotai'
import { baseAtomWithQuery } from './baseAtomWithQuery'
import { queryClientAtom } from './queryClientAtom'
import {
  AtomWithSuspenseQueryOptions,
  AtomWithSuspenseQueryResult,
} from './types'
import { defaultThrowOnError } from './utils'

export function atomWithSuspenseQuery<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(
  getOptions: (
    get: Getter
  ) => AtomWithSuspenseQueryOptions<TQueryFnData, TError, TData, TQueryKey>,
  getQueryClient: (get: Getter) => QueryClient = (get) => get(queryClientAtom)
): Atom<AtomWithSuspenseQueryResult<TData, TError>> {
  const suspenseOptions = atom((get) => {
    const options = getOptions(get)
    return {
      ...options,
      suspense: true,
      enabled: true,
      throwOnError: defaultThrowOnError,
    }
  })

  return baseAtomWithQuery(
    (get: Getter) => get(suspenseOptions),
    QueryObserver,
    getQueryClient
  ) as Atom<AtomWithSuspenseQueryResult<TData, TError>>
}
