import type { QueryKey, QueryObserverOptions, QueryObserverResult } from '@tanstack/query-core';
import { QueryClient, QueryObserver } from '@tanstack/query-core';
import type { Getter, WritableAtom } from 'jotai';
type Action = {
    type: 'refetch';
    force?: boolean;
    options?: Parameters<QueryObserver['refetch']>[0];
};
export declare function atomsWithQueryAsync<TQueryFnData = unknown, TError = unknown, TData = TQueryFnData, TQueryData = TQueryFnData, TQueryKey extends QueryKey = QueryKey>(getOptions: (get: Getter) => Promise<QueryObserverOptions<TQueryFnData, TError, TData, TQueryData, TQueryKey>>, getQueryClient?: (get: Getter) => QueryClient): readonly [
    dataAtom: WritableAtom<Promise<TData>, [
        Action
    ], Promise<QueryObserverResult<TData, TError>> | undefined>,
    statusAtom: WritableAtom<QueryObserverResult<TData, TError>, [
        Action
    ], Promise<QueryObserverResult<TData, TError>> | undefined>
];
export {};
