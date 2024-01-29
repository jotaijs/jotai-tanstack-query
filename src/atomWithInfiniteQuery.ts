import {
  DefaultError,
  InfiniteData,
  InfiniteQueryObserver,
  QueryClient,
  QueryKey,
  QueryObserver,
} from '@tanstack/query-core'
import { Getter } from 'jotai'
import { baseAtomWithQuery } from './baseAtomWithQuery'
import { queryClientAtom } from './queryClientAtom'
import {
  AtomWithInfiniteQueryOptions,
  AtomWithInfiniteQueryResult,
  DefinedAtomWithInfiniteQueryResult,
  DefinedInitialDataInfiniteOptions,
  UndefinedInitialDataInfiniteOptions,
} from './types'

export function atomWithInfiniteQuery<
  TQueryFnData,
  TError = DefaultError,
  TData = InfiniteData<TQueryFnData>,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = unknown,
>(
  getOptions: (
    get: Getter
  ) => UndefinedInitialDataInfiniteOptions<
    TQueryFnData,
    TError,
    TData,
    TQueryKey,
    TPageParam
  >,
  getQueryClient?: (get: Getter) => QueryClient
): AtomWithInfiniteQueryResult<TData, TError>
export function atomWithInfiniteQuery<
  TQueryFnData,
  TError = DefaultError,
  TData = InfiniteData<TQueryFnData>,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = unknown,
>(
  getOptions: (
    get: Getter
  ) => DefinedInitialDataInfiniteOptions<
    TQueryFnData,
    TError,
    TData,
    TQueryKey,
    TPageParam
  >,
  getQueryClient?: (get: Getter) => QueryClient
): DefinedAtomWithInfiniteQueryResult<TData, TError>
export function atomWithInfiniteQuery<
  TQueryFnData,
  TError = DefaultError,
  TData = InfiniteData<TQueryFnData>,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = unknown,
>(
  getOptions: (
    get: Getter
  ) => AtomWithInfiniteQueryOptions<
    TQueryFnData,
    TError,
    TData,
    TQueryFnData,
    TQueryKey,
    TPageParam
  >,
  getQueryClient?: (get: Getter) => QueryClient
): AtomWithInfiniteQueryResult<TData, TError>
export function atomWithInfiniteQuery(
  getOptions: (get: Getter) => AtomWithInfiniteQueryOptions,
  getQueryClient: (get: Getter) => QueryClient = (get) => get(queryClientAtom)
) {
  return baseAtomWithQuery(
    getOptions,
    InfiniteQueryObserver as typeof QueryObserver,
    getQueryClient
  )
}
