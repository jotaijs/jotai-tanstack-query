import { HydrationBoundary, dehydrate, QueryClient } from '@tanstack/react-query'
import UserClient from './user-client'

// This runs on the server
async function getDehydratedState() {
  const queryClient = new QueryClient()

  // Prefetch the same query used by our Jotai atom
  await queryClient.prefetchQuery({
    queryKey: ['user'],
    queryFn: async () => {
      const res = await fetch('https://jsonplaceholder.typicode.com/users/1')
      return res.json()
    },
  })

  return dehydrate(queryClient)
}

export default async function Page() {
  const dehydratedState = await getDehydratedState()

  return (
    <HydrationBoundary state={dehydratedState}>
      {/* Client Component that reads from Jotai atom */}
      <UserClient />
    </HydrationBoundary>
  )
}


