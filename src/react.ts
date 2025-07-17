import { createElement } from 'react'
import {
  type QueryClientProviderProps,
  QueryClientProvider as RootProvider,
} from '@tanstack/react-query'
import { useHydrateAtoms } from 'jotai/utils'
import { queryClientAtom } from './queryClientAtom'

export function QueryClientProvider(props: QueryClientProviderProps) {
  useHydrateAtoms([[queryClientAtom, props.client]])
  return createElement(RootProvider, props)
}
