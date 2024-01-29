import {
  DefaultError,
  QueryClient,
  QueryKey,
  QueryObserver,
} from '@tanstack/query-core'
import { Getter } from 'jotai'
import { baseAtomWithQuery } from './baseAtomWithQuery'
import { queryClientAtom } from './queryClientAtom'
import {
  AtomWithQueryOptions,
  AtomWithQueryResult,
  DefinedAtomWithQueryResult,
  DefinedInitialDataOptions,
  UndefinedInitialDataOptions,
} from './types'

export function atomWithQuery<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(
  getOptions: (
    get: Getter
  ) => UndefinedInitialDataOptions<TQueryFnData, TError, TData, TQueryKey>,
  getQueryClient?: (get: Getter) => QueryClient
): AtomWithQueryResult<TData, TError>
export function atomWithQuery<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(
  getOptions: (
    get: Getter
  ) => DefinedInitialDataOptions<TQueryFnData, TError, TData, TQueryKey>,
  getQueryClient?: (get: Getter) => QueryClient
): DefinedAtomWithQueryResult<TData, TError>
export function atomWithQuery<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(
  getOptions: (
    get: Getter
  ) => AtomWithQueryOptions<TQueryFnData, TError, TData, TQueryKey>,
  getQueryClient?: (get: Getter) => QueryClient
): AtomWithQueryResult<TData, TError>
export function atomWithQuery(
  getOptions: (get: Getter) => AtomWithQueryOptions,
  getQueryClient: (get: Getter) => QueryClient = (get) => get(queryClientAtom)
) {
  return baseAtomWithQuery(getOptions, QueryObserver, getQueryClient)
}
