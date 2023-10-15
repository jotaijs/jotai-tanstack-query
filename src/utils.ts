import type {
  DefaultedQueryObserverOptions,
  Query,
  QueryKey,
  QueryObserverResult,
  UseErrorBoundary,
} from '@tanstack/query-core'
import { QueryErrorResetBoundaryValue } from './QueryAtomErrorResetBoundary'

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
) => result.isLoading && !isRestoring

export const getHasError = <
  TData,
  TError,
  TQueryFnData,
  TQueryData,
  TQueryKey extends QueryKey,
>({
  result,
  errorResetBoundary,
  useErrorBoundary,
  query,
}: {
  result: QueryObserverResult<TData, TError>
  errorResetBoundary: QueryErrorResetBoundaryValue
  useErrorBoundary: UseErrorBoundary<
    TQueryFnData,
    TError,
    TQueryData,
    TQueryKey
  >
  query: Query<TQueryFnData, TError, TQueryData, TQueryKey>
}) => {
  return (
    result.isError &&
    !errorResetBoundary.isReset() &&
    !result.isFetching &&
    shouldThrowError(useErrorBoundary, [result.error, query])
  )
}
export function shouldThrowError<T extends (...args: any[]) => boolean>(
  _useErrorBoundary: boolean | T | undefined,
  params: Parameters<T>
): boolean {
  // Allow useErrorBoundary function to override throwing behavior on a per-error basis
  if (typeof _useErrorBoundary === 'function') {
    return _useErrorBoundary(...params)
  }

  return !!_useErrorBoundary
}
