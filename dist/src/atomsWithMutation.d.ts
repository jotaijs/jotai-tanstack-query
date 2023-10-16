import { QueryClient } from '@tanstack/query-core';
import type { MutateOptions, MutationObserverOptions, MutationObserverResult } from '@tanstack/query-core';
import type { Getter, WritableAtom } from 'jotai/vanilla';
type Action<TData, TError, TVariables, TContext> = [
    variables: TVariables,
    options?: MutateOptions<TData, TError, TVariables, TContext>
];
export declare function atomsWithMutation<TData = unknown, TError = unknown, TVariables = void, TContext = unknown>(getOptions: (get: Getter) => MutationObserverOptions<TData, TError, TVariables, TContext>, getQueryClient?: (get: Getter) => QueryClient): readonly [
    dataAtom: WritableAtom<TData | Promise<TData>, [
        Action<TData, TError, TVariables, TContext>
    ], Promise<TData>>,
    statusAtom: WritableAtom<MutationObserverResult<TData, TError, TVariables, TContext>, [
        Action<TData, TError, TVariables, TContext>
    ], Promise<TData>>
];
export {};
