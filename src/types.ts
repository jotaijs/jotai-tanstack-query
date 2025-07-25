import {
  type DefaultError,
  type DefinedInfiniteQueryObserverResult,
  type DefinedQueryObserverResult,
  type InfiniteData,
  type InfiniteQueryObserverOptions,
  type InfiniteQueryObserverResult,
  type MutationObserverOptions,
  type MutationObserverResult,
  type QueryKey,
  type MutateFunction as QueryMutateFunction,
  type QueryObserverOptions,
  type QueryObserverResult,
  type WithRequired,
} from '@tanstack/query-core'

type Override<A, B> = { [K in keyof A]: K extends keyof B ? B[K] : A[K] }

export type MutateFunction<
  TData = unknown,
  TError = DefaultError,
  TVariables = void,
  TContext = unknown,
> = (
  ...args: Parameters<QueryMutateFunction<TData, TError, TVariables, TContext>>
) => void

export type MutateAsyncFunction<
  TData = unknown,
  TError = DefaultError,
  TVariables = void,
  TContext = unknown,
> = QueryMutateFunction<TData, TError, TVariables, TContext>

export type AtomWithMutationResult<TData, TError, TVariables, TContext> =
  Override<
    MutationObserverResult<TData, TError, TVariables, TContext>,
    { mutate: MutateFunction<TData, TError, TVariables, TContext> }
  > & {
    mutateAsync: MutateAsyncFunction<TData, TError, TVariables, TContext>
  }

export type MutationOptions<
  TData = unknown,
  TError = DefaultError,
  TVariables = void,
  TContext = unknown,
> = Omit<
  MutationObserverOptions<TData, TError, TVariables, TContext>,
  '_defaulted' | 'variables'
>

export type BaseAtomWithQueryOptions<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
> = WithRequired<
  QueryObserverOptions<TQueryFnData, TError, TData, TQueryData, TQueryKey>,
  'queryKey'
>

export type AtomWithQueryOptions<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
> = Omit<
  WithRequired<
    BaseAtomWithQueryOptions<
      TQueryFnData,
      TError,
      TData,
      TQueryFnData,
      TQueryKey
    >,
    'queryKey'
  >,
  'suspense'
>

export type AtomWithSuspenseQueryOptions<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
> = Omit<
  AtomWithQueryOptions<TQueryFnData, TError, TData, TQueryKey>,
  'enabled' | 'throwOnError' | 'placeholderData'
>

export type AtomWithInfiniteQueryOptions<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = unknown,
> = WithRequired<
  Omit<
    InfiniteQueryObserverOptions<
      TQueryFnData,
      TError,
      TData,
      TQueryKey,
      TPageParam
    >,
    'suspense'
  >,
  'queryKey'
>

export type AtomWithSuspenseInfiniteQueryOptions<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = unknown,
> = Omit<
  AtomWithInfiniteQueryOptions<
    TQueryFnData,
    TError,
    TData,
    TQueryKey,
    TPageParam
  >,
  'enabled' | 'throwOnError' | 'placeholderData'
>

export type AtomWithQueryResult<
  TData = unknown,
  TError = DefaultError,
> = QueryObserverResult<TData, TError>

export type DefinedAtomWithQueryResult<
  TData = unknown,
  TError = DefaultError,
> = DefinedQueryObserverResult<TData, TError>

export type AtomWithSuspenseQueryResult<
  TData = unknown,
  TError = DefaultError,
> =
  | Omit<DefinedQueryObserverResult<TData, TError>, 'isPlaceholderData'>
  | Promise<
      Omit<DefinedQueryObserverResult<TData, TError>, 'isPlaceholderData'>
    >

export type AtomWithInfiniteQueryResult<
  TData = unknown,
  TError = DefaultError,
> = InfiniteQueryObserverResult<TData, TError>

export type DefinedAtomWithInfiniteQueryResult<
  TData = unknown,
  TError = DefaultError,
> = DefinedInfiniteQueryObserverResult<TData, TError>

export type AtomWithSuspenseInfiniteQueryResult<
  TData = unknown,
  TError = DefaultError,
> = Promise<
  Omit<DefinedInfiniteQueryObserverResult<TData, TError>, 'isPlaceholderData'>
>

export type UndefinedInitialDataOptions<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
> = AtomWithQueryOptions<TQueryFnData, TError, TData, TQueryKey> & {
  initialData?: undefined
}

type NonUndefinedGuard<T> = T extends undefined ? never : T

export type DefinedInitialDataOptions<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
> = AtomWithQueryOptions<TQueryFnData, TError, TData, TQueryKey> & {
  initialData:
    | NonUndefinedGuard<TQueryFnData>
    | (() => NonUndefinedGuard<TQueryFnData>)
}

export type UndefinedInitialDataInfiniteOptions<
  TQueryFnData,
  TError = DefaultError,
  TData = InfiniteData<TQueryFnData>,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = unknown,
> = AtomWithInfiniteQueryOptions<
  TQueryFnData,
  TError,
  TData,
  TQueryKey,
  TPageParam
> & {
  initialData?: undefined
}

export type DefinedInitialDataInfiniteOptions<
  TQueryFnData,
  TError = DefaultError,
  TData = InfiniteData<TQueryFnData>,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = unknown,
> = AtomWithInfiniteQueryOptions<
  TQueryFnData,
  TError,
  TData,
  TQueryKey,
  TPageParam
> & {
  initialData:
    | NonUndefinedGuard<InfiniteData<TQueryFnData, TPageParam>>
    | (() => NonUndefinedGuard<InfiniteData<TQueryFnData, TPageParam>>)
}
