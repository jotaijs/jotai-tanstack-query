'use client'

import { PropsWithChildren, useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Provider as JotaiProvider } from 'jotai'
import { useHydrateAtoms } from 'jotai/react/utils'
import { queryClientAtom } from 'jotai-tanstack-query'

export default function AppProviders({ children }: PropsWithChildren) {
  const [queryClient] = useState(() => new QueryClient())

  return (
    <QueryClientProvider client={queryClient}>
      <JotaiProvider>
        <HydrateAtoms queryClient={queryClient}>
          {children}
        </HydrateAtoms>
      </JotaiProvider>
    </QueryClientProvider>
  )
}

const HydrateAtoms = ({ 
  children, 
  queryClient 
}: PropsWithChildren<{ queryClient: QueryClient }>) => {
  useHydrateAtoms([[queryClientAtom, queryClient]])
  return children
}