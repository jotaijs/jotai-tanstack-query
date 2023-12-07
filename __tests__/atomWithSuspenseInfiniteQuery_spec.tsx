import React, { StrictMode, Suspense } from 'react'
import { fireEvent, render } from '@testing-library/react'
import { useAtom } from 'jotai'
import { atomWithSuspenseInfiniteQuery } from '../src'

it('suspense basic, suspends', async () => {
  let resolve = () => {}
  type DataResponse = {
    response: {
      count: number
    }
  }
  const countAtom = atomWithSuspenseInfiniteQuery<DataResponse>(() => ({
    getNextPageParam: (lastPage) => {
      const nextPageParam = lastPage.response.count + 1
      return nextPageParam
    },
    initialPageParam: 1,
    queryKey: ['test1'],
    queryFn: async ({ pageParam }) => {
      await new Promise<void>((r) => (resolve = r))
      return { response: { count: pageParam as number } }
    },
  }))
  const Counter = () => {
    const [countData] = useAtom(countAtom)
    const { data, fetchNextPage } = countData
    return (
      <>
        <div>count: {data?.pages?.[data.pages.length - 1]?.response.count}</div>
        <button
          onClick={() => {
            fetchNextPage()
          }}>
          fetchNextPage
        </button>
      </>
    )
  }

  const { findByText, getByText } = render(
    <StrictMode>
      <Suspense fallback="loading">
        <Counter />
      </Suspense>
    </StrictMode>
  )

  await findByText('loading')
  resolve()
  await findByText('count: 1')

  fireEvent.click(getByText('fetchNextPage'))
  await expect(() => findByText('loading')).rejects.toThrow() //refetch implementation in tanstack doesn't trigger loading state
  resolve()
  await findByText('count: 2')
})
