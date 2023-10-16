import { InfiniteQueryObserver, QueryClient } from '@tanstack/query-core';
import type { InfiniteData, InfiniteQueryObserverOptions, InfiniteQueryObserverResult, QueryKey, QueryObserverResult } from '@tanstack/query-core';
import type { Getter, WritableAtom } from 'jotai/vanilla';
type Action = {
    type: 'refetch';
    force?: boolean;
    options?: Parameters<InfiniteQueryObserver['refetch']>[0];
} | {
    type: 'fetchNextPage';
} | {
    type: 'fetchPreviousPage';
};
export declare function atomsWithInfiniteQuery<TQueryFnData = unknown, TError = unknown, TData = TQueryFnData, TQueryData = TQueryFnData, TQueryKey extends QueryKey = QueryKey>(getOptions: (get: Getter) => InfiniteQueryObserverOptions<TQueryFnData, TError, TData, TQueryData, TQueryKey>, getQueryClient?: (get: Getter) => QueryClient): readonly [
    dataAtom: WritableAtom<InfiniteData<TData> | Promise<InfiniteData<TData>>, [
        Action
    ], Promise<QueryObserverResult<InfiniteData<TData>, TError>> | undefined>,
    statusAtom: WritableAtom<InfiniteQueryObserverResult<TData, TError>, [
        Action
    ], Promise<QueryObserverResult<InfiniteData<TData>, TError>> | undefined>
];
export {};
