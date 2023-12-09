import React from 'react'
import { useAtom } from 'jotai'
import { atomWithInfiniteQuery } from 'jotai-tanstack-query'

const postsAtom = atomWithInfiniteQuery(() => ({
  queryKey: ['posts'],
  queryFn: async ({ pageParam }) => {
    const res = await fetch(
      `https://jsonplaceholder.typicode.com/posts?_page=${pageParam}`
    )
    return res.json()
  },
  getNextPageParam: (...args) => {
    return args[2] + 1
  },
  initialPageParam: 0,
}))

const Posts = () => {
  const [{ data, fetchNextPage, isPending, isError, isFetching }] =
    useAtom(postsAtom)

  if (isFetching || isPending) return <div>Loading...</div>
  if (isError) return <div>Error</div>

  return (
    <>
      {data?.pages.map((page, index) => (
        <div key={index}>
          {page.map((post: any) => (
            <div key={post.id}>{post.title}</div>
          ))}
        </div>
      ))}
      <button onClick={() => fetchNextPage()}>Next</button>
    </>
  )
}

const App = () => (
  <>
    <Posts />
  </>
)

export default App
