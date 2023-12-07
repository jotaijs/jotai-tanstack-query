import React, { Suspense } from 'react'
import { useAtom } from 'jotai/react'
import { atomWithSuspenseInfiniteQuery } from 'jotai-tanstack-query'

const postsAtom = atomWithSuspenseInfiniteQuery(() => ({
  initialPageParam: 1,
  queryKey: ['posts'],
  queryFn: async ({ pageParam = 1 }) => {
    const res = await fetch(
      `https://jsonplaceholder.typicode.com/posts/${pageParam}`
    )
    const data: { id: number; title: string } = await res.json()
    return data
  },
  getNextPageParam: (lastPage) => lastPage.id + 1,
}))

const Posts = () => {
  const [{ data, fetchNextPage }] = useAtom(postsAtom)
  return (
    <div>
      <button onClick={() => fetchNextPage()}>Next</button>
      <ul>
        {data.pages.map((item) => (
          <li key={item.id}>{item.title}</li>
        ))}
      </ul>
    </div>
  )
}

const App = () => (
  <>
    <Suspense fallback="Loading...">
      <Posts />
    </Suspense>
  </>
)

export default App
