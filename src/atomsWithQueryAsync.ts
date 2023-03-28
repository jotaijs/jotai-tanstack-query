import type { QueryKey, QueryObserverOptions } from '@tanstack/query-core'
import type { Getter, ExtractAtomArgs, ExtractAtomValue } from 'jotai'
import { QueryClient, QueryObserver } from '@tanstack/query-core'
import { atom } from 'jotai'
import { atomsWithQuery } from './atomsWithQuery'
import { createAtoms } from './common'
import { queryClientAtom } from './queryClientAtom'

export function atomsWithQueryAsync<
  TQueryFnData = unknown,
  TError = unknown,
  TData = TQueryFnData,
  TQueryData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey
>(
  getOptions: (
    get: Getter
  ) => Promise<
    QueryObserverOptions<TQueryFnData, TError, TData, TQueryData, TQueryKey>
  >,
  getQueryClient: (get: Getter) => QueryClient = (get) => get(queryClientAtom)
) {
  const atomsAtom = atom(async (get) => {
    const options = await getOptions(get)

    return createAtoms(
      () => options,
      getQueryClient,
      (client, options) => new QueryObserver(client, options),
      (action, observer, _) => {
        if (action.type === 'refetch') {
          return observer.refetch(action.options)
        }
      }
    ) as ReturnType<typeof atomsWithQuery<TData>>
  })

  const dataAtom = atom(
    async (get) => get((await get(atomsAtom))[0]),
    async (
      get,
      set,
      ...args: ExtractAtomArgs<Awaited<ExtractAtomValue<typeof atomsAtom>>[0]>
    ) => {
      const a = (await get(atomsAtom))[0]
      return set(a, ...args)
    }
  )

  const statusAtom = atom(
    async (get) => get((await get(atomsAtom))[1]),
    async (
      get,
      set,
      ...args: ExtractAtomArgs<Awaited<ExtractAtomValue<typeof atomsAtom>>[1]>
    ) => {
      const a = (await get(atomsAtom))[1]
      return set(a, ...args)
    }
  )

  return [dataAtom, statusAtom] as const
}
