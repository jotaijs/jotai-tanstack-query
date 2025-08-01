import { createElement } from 'react'
import {
  QueryClientProvider,
  type QueryClientProviderProps,
} from '@tanstack/react-query'
import { Provider } from 'jotai'
import { useHydrateAtoms } from 'jotai/utils'
import { queryClientAtom } from './_queryClientAtom'

const HydrateAtoms = ({ client, children }: QueryClientProviderProps) => {
  useHydrateAtoms([[queryClientAtom, client]])
  return children
}

export function QueryClientAtomProvider({
  client,
  children,
}: QueryClientProviderProps) {
  return createElement(
    QueryClientProvider,
    { client },
    createElement(
      Provider,
      null,
      createElement(HydrateAtoms, { client }, children)
    )
  )
}
