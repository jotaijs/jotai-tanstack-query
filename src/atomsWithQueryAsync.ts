import type { QueryKey, QueryObserverOptions } from '@tanstack/query-core'
import type { ExtractAtomArgs, ExtractAtomValue, Getter } from 'jotai'
import { atom } from 'jotai'
import { atomsWithQuery } from './atomsWithQuery'

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
  >
) {
  const atomsAtom = atom(async (get) => {
    const options = await getOptions(get)
    return atomsWithQuery(() => options)
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
