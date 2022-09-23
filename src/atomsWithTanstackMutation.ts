import { MutationObserver, QueryClient } from '@tanstack/query-core'
import type {
  MutateOptions,
  MutationObserverOptions,
  MutationObserverResult,
} from '@tanstack/query-core'
import type { Getter, WritableAtom } from 'jotai'
import { buildCreateAtoms } from './common'
import { queryClientAtom } from './queryClientAtom'

type Action<TData, TError, TVariables, TContext> = [
  variables: TVariables,
  options?: MutateOptions<TData, TError, TVariables, TContext>
]

const createAtoms = buildCreateAtoms<
  MutationObserverOptions<any, any, any, any>,
  MutationObserverResult<any, any, any, any>,
  MutationObserver<any, any, any, any>,
  Action<any, any, any, any>
>(
  (client, options) => new MutationObserver(client, options),
  async (action, observer) => {
    await observer.mutate(...action)
  }
)

export function atomsWithTanstackMutation<
  TData = unknown,
  TError = unknown,
  TVariables = void,
  TContext = unknown
>(
  getOptions: (
    get: Getter
  ) => MutationObserverOptions<TData, TError, TVariables, TContext>,
  getQueryClient: (get: Getter) => QueryClient = (get) => get(queryClientAtom)
): readonly [
  dataAtom: WritableAtom<TData, Action<TData, TError, TVariables, TContext>>,
  statusAtom: WritableAtom<
    MutationObserverResult<TData, TError, TVariables, TContext>,
    Action<TData, TError, TVariables, TContext>
  >
] {
  return createAtoms(getOptions, getQueryClient)
}
