import {
  type DefaultError,
  QueryClient,
  type QueryKey,
  QueryObserver,
} from '@tanstack/query-core'
import { Getter, WritableAtom } from 'jotai'
import { baseAtomWithQuery } from './baseAtomWithQuery'
import { queryClientAtom } from './queryClientAtom'
import {
  AtomWithQueryOptions,
  AtomWithQueryResult,
  DefinedAtomWithQueryResult,
  DefinedInitialDataOptions,
  MaybePromise,
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
  ) => MaybePromise<
    UndefinedInitialDataOptions<TQueryFnData, TError, TData, TQueryKey>
  >,
  getQueryClient?: (get: Getter) => QueryClient
): WritableAtom<AtomWithQueryResult<TData, TError>, [], void>
export function atomWithQuery<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(
  getOptions: (
    get: Getter
  ) => MaybePromise<
    DefinedInitialDataOptions<TQueryFnData, TError, TData, TQueryKey>
  >,
  getQueryClient?: (get: Getter) => QueryClient
): WritableAtom<DefinedAtomWithQueryResult<TData, TError>, [], void>
export function atomWithQuery<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(
  getOptions: (
    get: Getter
  ) => MaybePromise<
    AtomWithQueryOptions<TQueryFnData, TError, TData, TQueryKey>
  >,
  getQueryClient?: (get: Getter) => QueryClient
): WritableAtom<AtomWithQueryResult<TData, TError>, [], void>
export function atomWithQuery(
  getOptions: (get: Getter) => MaybePromise<AtomWithQueryOptions>,
  getQueryClient: (get: Getter) => QueryClient = (get) => get(queryClientAtom)
) {
  return baseAtomWithQuery(getOptions, QueryObserver, getQueryClient)
}
