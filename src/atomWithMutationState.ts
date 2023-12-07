import {
  DefaultError,
  Mutation,
  MutationCache,
  MutationFilters,
  MutationState,
  QueryClient,
} from '@tanstack/query-core'
import { Getter, atom } from 'jotai'
import { queryClientAtom } from './queryClientAtom'

type MutationStateOptions<TResult = MutationState> = {
  filters?: MutationFilters
  select?: (
    mutation: Mutation<unknown, DefaultError, unknown, unknown>
  ) => TResult
}

function getResult<TResult = MutationState>(
  mutationCache: MutationCache,
  options: MutationStateOptions<TResult>
): Array<TResult> {
  return mutationCache
    .findAll({ ...options.filters, status: 'pending' })
    .map(
      (mutation): TResult =>
        (options.select
          ? options.select(
              mutation as Mutation<unknown, DefaultError, unknown, unknown>
            )
          : mutation.state) as TResult
    )
}

export const atomWithMutationState = <TResult = MutationState>(
  getOptions: (get: Getter) => MutationStateOptions<TResult>,
  getQueryClient: (get: Getter) => QueryClient = (get) => get(queryClientAtom)
) => {
  const resultsAtom = atom<TResult[]>([])
  if (process.env.NODE_ENV !== 'production') {
    resultsAtom.debugPrivate = true
  }

  const observableAtom = atom((get) => {
    const queryClient = getQueryClient(get)

    const mutationCache = queryClient.getMutationCache()
    resultsAtom.onMount = (set) => {
      mutationCache.subscribe(() => {
        set(getResult(getQueryClient(get).getMutationCache(), getOptions(get)))
      })
    }
  })
  if (process.env.NODE_ENV !== 'production') {
    observableAtom.debugPrivate = true
  }

  return atom((get) => {
    get(observableAtom)
    return get(resultsAtom)
  })
}
