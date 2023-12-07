import React, { Component, StrictMode, Suspense } from 'react'
import type { ReactNode } from 'react'
import { fireEvent, render } from '@testing-library/react'
import { useAtom } from 'jotai/react'
import { atom } from 'jotai/vanilla'
import { atomWithInfiniteQuery } from '../src/index'

let originalConsoleError: typeof console.error

beforeEach(() => {
  originalConsoleError = console.error
  console.error = jest.fn()
})
afterEach(() => {
  console.error = originalConsoleError
})

it('infinite query basic test', async () => {
  let resolve = () => {}
  type DataResponse = { response: { count: number } }
  const countAtom = atomWithInfiniteQuery<DataResponse>(() => ({
    initialPageParam: 1,
    getNextPageParam: (lastPage) => lastPage.response.count + 1,
    queryKey: ['countInfinite'],

    queryFn: async ({ pageParam }) => {
      await new Promise<void>((r) => (resolve = r))
      return { response: { count: pageParam as number } }
    },
  }))

  const Counter = () => {
    const [countData] = useAtom(countAtom)

    const { data, isPending, isError } = countData

    if (isPending) return <>loading</>
    if (isError) return <>error</>

    return (
      <>
        <div>page count: {data.pages.length}</div>
      </>
    )
  }

  const { findByText } = render(
    <StrictMode>
      <Counter />
    </StrictMode>
  )

  await findByText('loading')
  resolve()
  await findByText('page count: 1')
})

it('infinite query next page test', async () => {
  const mockFetch = jest.fn((response) => ({ response }))
  let resolve = () => {}
  const countAtom = atomWithInfiniteQuery<{ response: { count: number } }>(
    () => ({
      initialPageParam: 1,
      queryKey: ['nextPageAtom'],
      queryFn: async ({ pageParam }) => {
        await new Promise<void>((r) => (resolve = r))
        return mockFetch({ count: pageParam as number })
      },
      getNextPageParam: (lastPage) => {
        const {
          response: { count },
        } = lastPage
        return (count + 1).toString()
      },
      getPreviousPageParam: (lastPage) => {
        const {
          response: { count },
        } = lastPage
        return (count - 1).toString()
      },
    })
  )
  const Counter = () => {
    const [countData] = useAtom(countAtom)

    const { isPending, isError, data, fetchNextPage, fetchPreviousPage } =
      countData

    if (isPending) return <>loading</>
    if (isError) return <>error</>

    return (
      <>
        <div>page count: {data.pages.length}</div>
        <button onClick={() => fetchNextPage()}>next</button>
        <button onClick={() => fetchPreviousPage()}>prev</button>
      </>
    )
  }

  const { findByText, getByText } = render(
    <>
      <Counter />
    </>
  )

  await findByText('loading')
  resolve()
  await findByText('page count: 1')
  expect(mockFetch).toBeCalledTimes(1)

  fireEvent.click(getByText('next'))
  resolve()
  await findByText('page count: 2')
  expect(mockFetch).toBeCalledTimes(2)

  fireEvent.click(getByText('prev'))
  resolve()
  await findByText('page count: 3')
  expect(mockFetch).toBeCalledTimes(3)
})

it('infinite query with enabled', async () => {
  const slugAtom = atom<string | null>(null)

  let resolve = () => {}
  type DataResponse = {
    response: {
      slug: string
      currentPage: number
    }
  }
  const slugQueryAtom = atomWithInfiniteQuery<DataResponse>((get) => {
    const slug = get(slugAtom)
    return {
      initialPageParam: 1,
      getNextPageParam: (lastPage) => lastPage.response.currentPage + 1,
      enabled: !!slug,
      queryKey: ['disabled_until_value', slug],
      queryFn: async ({ pageParam }) => {
        await new Promise<void>((r) => (resolve = r))
        return {
          response: { slug: `hello-${slug}`, currentPage: pageParam as number },
        }
      },
    }
  })

  const Slug = () => {
    const [slugQueryData] = useAtom(slugQueryAtom)
    const { data, isPending, isError, fetchStatus } = slugQueryData

    if (isPending && fetchStatus === 'idle') return <div>not enabled</div>

    if (isPending) return <>loading</>
    if (isError) return <>error</>

    return <div>slug: {data.pages[0]?.response?.slug}</div>
  }

  const Parent = () => {
    const [, setSlug] = useAtom(slugAtom)
    return (
      <div>
        <button
          onClick={() => {
            setSlug('world')
          }}>
          set slug
        </button>
        <Slug />
      </div>
    )
  }

  const { getByText, findByText } = render(
    <StrictMode>
      <Suspense fallback="loading">
        <Parent />
      </Suspense>
    </StrictMode>
  )

  await findByText('not enabled')

  fireEvent.click(getByText('set slug'))
  await findByText('loading')
  resolve()
  await findByText('slug: hello-world')
})

it('infinite query with enabled 2', async () => {
  const enabledAtom = atom<boolean>(true)
  const slugAtom = atom<string | null>('first')
  type DataResponse = {
    response: {
      slug: string
      currentPage: number
    }
  }
  let resolve = () => {}
  const slugQueryAtom = atomWithInfiniteQuery<DataResponse>((get) => {
    const slug = get(slugAtom)
    const isEnabled = get(enabledAtom)
    return {
      getNextPageParam: (lastPage) => lastPage.response.currentPage + 1,
      initialPageParam: 1,
      enabled: isEnabled,
      queryKey: ['enabled_toggle'],
      queryFn: async ({ pageParam }) => {
        await new Promise<void>((r) => (resolve = r))
        return {
          response: { slug: `hello-${slug}`, currentPage: pageParam as number },
        }
      },
    }
  })

  const Slug = () => {
    const [slugQueryData] = useAtom(slugQueryAtom)
    const { data, isPending, isError, fetchStatus } = slugQueryData

    if (isPending && fetchStatus === 'idle') return <div>not enabled</div>

    if (isPending) return <>loading</>
    if (isError) return <>error</>

    return <div>slug: {data.pages[0]?.response.slug}</div>
  }

  const Parent = () => {
    const [, setSlug] = useAtom(slugAtom)
    const [, setEnabled] = useAtom(enabledAtom)
    return (
      <div>
        <button
          onClick={() => {
            setSlug('world')
          }}>
          set slug
        </button>
        <button
          onClick={() => {
            setEnabled(true)
          }}>
          set enabled
        </button>
        <button
          onClick={() => {
            setEnabled(false)
          }}>
          set disabled
        </button>
        <Slug />
      </div>
    )
  }

  const { getByText, findByText } = render(
    <StrictMode>
      <Suspense fallback="loading">
        <Parent />
      </Suspense>
    </StrictMode>
  )

  await findByText('loading')
  resolve()
  await findByText('slug: hello-first')
  fireEvent.click(getByText('set disabled'))
  fireEvent.click(getByText('set slug'))

  await findByText('slug: hello-first')

  fireEvent.click(getByText('set enabled'))
  resolve()
  await findByText('slug: hello-world')
})

describe('error handling', () => {
  class ErrorBoundary extends Component<
    { message?: string; retry?: () => void; children: ReactNode },
    { hasError: boolean }
  > {
    constructor(props: { message?: string; children: ReactNode }) {
      super(props)
      this.state = { hasError: false }
    }
    static getDerivedStateFromError() {
      return { hasError: true }
    }
    render() {
      return this.state.hasError ? (
        <div>
          {this.props.message || 'errored'}
          {this.props.retry && (
            <button
              onClick={() => {
                this.props.retry?.()
                this.setState({ hasError: false })
              }}>
              retry
            </button>
          )}
        </div>
      ) : (
        this.props.children
      )
    }
  }

  it('can catch error in error boundary', async () => {
    let resolve = () => {}
    const countAtom = atomWithInfiniteQuery(() => ({
      initialPageParam: 1,
      getNextPageParam: (lastPage) => lastPage.response.count + 1,
      queryKey: ['error test', 'count1Infinite'],
      retry: false,
      queryFn: async (): Promise<{ response: { count: number } }> => {
        await new Promise<void>((r) => (resolve = r))
        throw new Error('fetch error')
      },
      throwOnError: true,
    }))
    const Counter = () => {
      const [{ data, isPending }] = useAtom(countAtom)

      if (isPending) return <>loading</>

      const pages = data?.pages

      return (
        <>
          <div>count: {pages?.[0]?.response.count}</div>
        </>
      )
    }

    const { findByText } = render(
      <StrictMode>
        <ErrorBoundary>
          <Suspense fallback="loading">
            <Counter />
          </Suspense>
        </ErrorBoundary>
      </StrictMode>
    )

    await findByText('loading')
    resolve()
    await findByText('errored')
  })
})
