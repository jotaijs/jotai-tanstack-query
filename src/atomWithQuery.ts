import { QueryClient, QueryObserver } from '@tanstack/query-core'
import type { QueryKey, QueryObserverOptions } from '@tanstack/query-core'
import { type Getter, atom } from 'jotai/vanilla'
import { queryClientAtom } from './queryClientAtom'

export function atomWithQuery<
  TQueryFnData = unknown,
  TError = unknown,
  TData = TQueryFnData,
  TQueryData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(
  getOptions: (
    get: Getter
  ) => QueryObserverOptions<TQueryFnData, TError, TData, TQueryData, TQueryKey>,
  getQueryClient: (get: Getter) => QueryClient = (get) => get(queryClientAtom)
) {
  return atom((get) => {
    const client = getQueryClient(get)
    const options = getOptions(get)

    const observer = new QueryObserver(client, options)
    const defaultedOptions = client.defaultQueryOptions(options)

    const result = observer.getCurrentResult()
    return defaultedOptions.notifyOnChangeProps
      ? observer.trackResult(result)
      : result
  })
}
