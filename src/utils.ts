import type {
  DefaultedQueryObserverOptions,
  Query,
  QueryKey,
  QueryObserverResult,
  ThrowOnError,
} from '@tanstack/query-core'

export const shouldSuspend = (
  defaultedOptions:
    | DefaultedQueryObserverOptions<any, any, any, any, any>
    | undefined,
  result: QueryObserverResult<any, any>,
  isRestoring: boolean
) => defaultedOptions?.suspense && willFetch(result, isRestoring)

export const willFetch = (
  result: QueryObserverResult<any, any>,
  isRestoring: boolean
) => result.isPending && !isRestoring

export const getHasError = <
  TData,
  TError,
  TQueryFnData,
  TQueryData,
  TQueryKey extends QueryKey,
>({
  result,
  throwOnError,
  query,
}: {
  result: QueryObserverResult<TData, TError>
  throwOnError:
    | ThrowOnError<TQueryFnData, TError, TQueryData, TQueryKey>
    | undefined
  query: Query<TQueryFnData, TError, TQueryData, TQueryKey>
}) => {
  return (
    result.isError &&
    !result.isFetching &&
    shouldThrowError(throwOnError, [result.error, query])
  )
}

export function shouldThrowError<T extends (...args: any[]) => boolean>(
  throwOnError: boolean | T | undefined,
  params: Parameters<T>
): boolean {
  // Allow useErrorBoundary function to override throwing behavior on a per-error basis
  if (typeof throwOnError === 'function') {
    return throwOnError(...params)
  }

  return !!throwOnError
}
