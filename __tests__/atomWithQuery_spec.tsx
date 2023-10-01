/* eslint-disable @typescript-eslint/no-unused-vars */
import React, {
  Component,
  ReactNode,
  StrictMode,
  Suspense,
  useState,
} from 'react'
import { QueryClient } from '@tanstack/query-core'
import { fireEvent, render } from '@testing-library/react'
import { Getter, atom, useAtom, useSetAtom } from 'jotai'
import { QueryErrorResetBoundary, atomWithQuery } from '../src'
beforeEach(() => {
  jest.useFakeTimers()
})
afterEach(() => {
  jest.runAllTimers()
  jest.useRealTimers()
  jest.clearAllMocks()
})

it('query basic test', async () => {
  let resolve = () => {}
  const countAtom = atomWithQuery(() => ({
    queryKey: ['test1'],
    queryFn: async () => {
      await new Promise<void>((r) => (resolve = r))
      return { response: { count: 0 } }
    },
  }))
  const Counter = () => {
    const [countData] = useAtom(countAtom)
    const { data, isLoading, isError } = countData

    if (isLoading) {
      return <>loading</>
    }

    if (isError) {
      return <>errorred</>
    }

    return (
      <>
        <div>count: {data.response.count}</div>
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
  await findByText('count: 0')
})

it('query refetch', async () => {
  let count = 0
  const mockFetch = jest.fn<
    { response: { count: number } },
    { count: number }[]
  >((response) => ({
    response,
  }))
  let resolve = () => {}
  const countAtom = atomWithQuery(() => ({
    queryKey: ['test3'],
    queryFn: async () => {
      await new Promise<void>((r) => (resolve = r))
      const response = mockFetch({ count })
      ++count
      return response
    },
  }))
  const Counter = () => {
    const [{ data, isLoading, isError, refetch }] = useAtom(countAtom)

    if (isLoading) {
      return <>loading</>
    }

    if (isError) {
      return <>errorred</>
    }

    return (
      <>
        <div>count: {data?.response.count}</div>
        <button onClick={() => refetch()}>refetch</button>
      </>
    )
  }

  const { findByText, getByText } = render(
    <StrictMode>
      <Counter />
    </StrictMode>
  )

  await findByText('loading')
  resolve()
  await findByText('count: 0')
  expect(mockFetch).toBeCalledTimes(1)

  fireEvent.click(getByText('refetch'))
  await expect(() => findByText('loading')).rejects.toThrow() //refetch implementation in tanstack doesn't trigger loading state
  resolve()
  await findByText('count: 1')
  expect(mockFetch).toBeCalledTimes(2)
})

it('query no-loading with keepPreviousData', async () => {
  const dataAtom = atom(0)
  const mockFetch = jest.fn<
    { response: { count: number } },
    { count: number }[]
  >((response) => ({ response }))
  let resolve = () => {}
  const countAtom = atomWithQuery((get) => ({
    queryKey: ['test5', get(dataAtom)],
    keepPreviousData: true,
    queryFn: async () => {
      await new Promise<void>((r) => (resolve = r))
      const response = mockFetch({ count: get(dataAtom) })
      return response
    },
  }))
  const Counter = () => {
    const [countData] = useAtom(countAtom)
    const { data, isLoading, isError } = countData

    if (isLoading) {
      return <>loading</>
    }

    if (isError) {
      return <>errorred</>
    }

    return (
      <>
        <div>count: {data.response.count}</div>
      </>
    )
  }
  const RefreshButton = () => {
    const [data, setData] = useAtom(dataAtom)
    return <button onClick={() => setData(data + 1)}>refetch</button>
  }

  const { findByText, getByText } = render(
    <StrictMode>
      <Counter />
      <RefreshButton />
    </StrictMode>
  )

  await findByText('loading')
  resolve()
  await findByText('count: 0')

  fireEvent.click(getByText('refetch'))
  await expect(() => findByText('loading')).rejects.toThrow()
  resolve()
  await findByText('count: 1')

  fireEvent.click(getByText('refetch'))
  await expect(() => findByText('loading')).rejects.toThrow()
  resolve()

  expect(true)
  await findByText('count: 2')
})

it('query with enabled', async () => {
  const slugAtom = atom<string | null>(null)
  const mockFetch = jest.fn<{ response: { slug: string } }, { slug: string }[]>(
    (response) => ({ response })
  )
  let resolve = () => {}
  const slugQueryAtom = atomWithQuery((get) => {
    const slug = get(slugAtom)
    return {
      enabled: !!slug,
      queryKey: ['disabled_until_value', slug],
      queryFn: async () => {
        await new Promise<void>((r) => (resolve = r))
        return mockFetch({ slug: `hello-${slug}` })
      },
    }
  })

  const Slug = () => {
    const [slugQueryData] = useAtom(slugQueryAtom)

    const { data, isLoading, isError, status, fetchStatus } = slugQueryData

    //ref: https://tanstack.com/query/v4/docs/react/guides/dependent-queries
    if (status === 'loading' && fetchStatus === 'idle') {
      return <div>not enabled</div>
    }

    if (isLoading) {
      return <>loading</>
    }

    if (isError) {
      return <>errorred</>
    }

    return <div>slug: {data.response.slug}</div>
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
      <Parent />
    </StrictMode>
  )

  await findByText('not enabled')
  expect(mockFetch).toHaveBeenCalledTimes(0)

  fireEvent.click(getByText('set slug'))
  await findByText('loading')
  resolve()
  await findByText('slug: hello-world')
  expect(mockFetch).toHaveBeenCalledTimes(1)
})

it('query with enabled 2', async () => {
  const mockFetch = jest.fn<{ response: { slug: string } }, { slug: string }[]>(
    (response) => ({ response })
  )
  const enabledAtom = atom<boolean>(true)
  const slugAtom = atom<string | null>('first')

  const slugQueryAtom = atomWithQuery((get: Getter) => {
    const slug = get(slugAtom)
    const enabled = get(enabledAtom)
    return {
      enabled: enabled,
      queryKey: ['enabled_toggle'],
      queryFn: async () => {
        await new Promise<void>((r) => setTimeout(r, 10 * 1000))

        return mockFetch({ slug: `hello-${slug}` })
      },
    }
  })

  const Slug = () => {
    const [slugQueryAtomData] = useAtom(slugQueryAtom)
    const { data, isError, isLoading, status, fetchStatus } = slugQueryAtomData

    if (status === 'loading' && fetchStatus === 'idle') {
      return <div>not enabled</div>
    }

    if (isLoading) {
      return <>loading</>
    }

    if (isError) {
      return <>errorred</>
    }
    return <div>slug: {data.response.slug}</div>
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
      <Parent />
    </StrictMode>
  )

  jest.runOnlyPendingTimers()
  await findByText('slug: hello-first')
  expect(mockFetch).toHaveBeenCalledTimes(1)

  fireEvent.click(getByText('set disabled'))
  fireEvent.click(getByText('set slug'))

  await findByText('slug: hello-first')
  expect(mockFetch).toHaveBeenCalledTimes(1)

  fireEvent.click(getByText('set enabled'))
  jest.runOnlyPendingTimers()
  await findByText('slug: hello-world')
  expect(mockFetch).toHaveBeenCalledTimes(2)
})

it('query with enabled (#500)', async () => {
  const enabledAtom = atom(true)
  let resolve = () => {}
  const countAtom = atomWithQuery((get) => {
    const enabled = get(enabledAtom)
    return {
      enabled,
      queryKey: ['count_500_issue'],
      queryFn: async () => {
        await new Promise<void>((r) => (resolve = r))
        return { response: { count: 1 } }
      },
    }
  })

  const Counter = () => {
    const [countData] = useAtom(countAtom)

    const { data, isLoading, isError } = countData

    if (isLoading) {
      return <>loading</>
    }

    if (isError) {
      return <>errorred</>
    }

    return <div>count: {data.response.count}</div>
  }

  const Parent = () => {
    const [showChildren, setShowChildren] = useState(true)
    const [, setEnabled] = useAtom(enabledAtom)
    return (
      <div>
        <button
          onClick={() => {
            setShowChildren((x) => !x)
            setEnabled((x) => !x)
          }}>
          toggle
        </button>
        {showChildren ? <Counter /> : <div>hidden</div>}
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
  await findByText('count: 1')

  fireEvent.click(getByText('toggle'))
  resolve()
  await findByText('hidden')

  fireEvent.click(getByText('toggle'))
  resolve()
  await findByText('count: 1')
})

it('query with initialData test', async () => {
  const mockFetch = jest.fn((response) => ({ response }))
  let resolve = () => {}

  const countAtom = atomWithQuery(() => ({
    queryKey: ['initialData_count1'],
    queryFn: async () => {
      await new Promise<void>((r) => (resolve = r))
      return mockFetch({ count: 10 })
    },
    initialData: { response: { count: 0 } },
  }))
  const Counter = () => {
    const [countData] = useAtom(countAtom)
    const { data, isLoading, isError } = countData

    if (isLoading) {
      return <>loading</>
    }

    if (isError) {
      return <>errorred</>
    }

    const count = data.response.count
    return (
      <>
        <div>count: {count}</div>
      </>
    )
  }

  const { findByText } = render(
    <StrictMode>
      <Counter />
    </StrictMode>
  )

  // NOTE: the atom is never loading
  await expect(() => findByText('loading')).rejects.toThrow()
  await findByText('count: 0')
  resolve()
  await findByText('count: 10')
  expect(mockFetch).toHaveBeenCalledTimes(1)
})

it('query dependency test', async () => {
  const baseCountAtom = atom(0)
  const incrementAtom = atom(null, (_get, set) =>
    set(baseCountAtom, (c) => c + 1)
  )
  let resolve = () => {}
  const countAtom = atomWithQuery((get) => ({
    queryKey: ['count_with_dependency', get(baseCountAtom)],
    queryFn: async () => {
      await new Promise<void>((r) => (resolve = r))
      return { response: { count: get(baseCountAtom) } }
    },
  }))

  const Counter = () => {
    const [countData] = useAtom(countAtom)
    const { data, isLoading, isError } = countData

    if (isLoading) {
      return <>loading</>
    }

    if (isError) {
      return <>errorred</>
    }

    return (
      <>
        <div>count: {data.response.count}</div>
      </>
    )
  }

  const Controls = () => {
    const [, increment] = useAtom(incrementAtom)
    return <button onClick={increment}>increment</button>
  }

  const { getByText, findByText } = render(
    <StrictMode>
      <Counter />
      <Controls />
    </StrictMode>
  )

  await findByText('loading')
  resolve()
  await findByText('count: 0')

  fireEvent.click(getByText('increment'))
  await findByText('loading')
  resolve()
  await findByText('count: 1')
})

it('query expected QueryCache test', async () => {
  const queryClient = new QueryClient()
  let resolve = () => {}
  const countAtom = atomWithQuery(
    () => ({
      queryKey: ['count6'],
      queryFn: async () => {
        await new Promise<void>((r) => (resolve = r))
        return { response: { count: 0 } }
      },
    }),
    () => queryClient
  )
  const Counter = () => {
    const [countData] = useAtom(countAtom)

    const { data, isLoading, isError } = countData

    if (isLoading) {
      return <>loading</>
    }

    if (isError) {
      return <>errorred</>
    }

    return (
      <>
        <div>count: {data.response.count}</div>
      </>
    )
  }

  const { findByText } = render(
    <StrictMode>
      <Suspense fallback="loading">
        <Counter />
      </Suspense>
    </StrictMode>
  )

  await findByText('loading')
  resolve()
  await findByText('count: 0')
  expect(queryClient.getQueryCache().getAll().length).toBe(1)
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
    const countAtom = atomWithQuery(() => ({
      queryKey: ['catch'],
      retry: false,
      queryFn: async (): Promise<{ response: { count: number } }> => {
        await new Promise<void>((r) => (resolve = r))
        throw new Error('fetch error')
      },
      useErrorBoundary: true,
    }))
    const Counter = () => {
      const [countData] = useAtom(countAtom)

      if ('data' in countData) {
        if (countData.isLoading) {
          return <>loading</>
        }

        return <div>count: {countData.data?.response.count}</div>
      }

      return null
    }

    const { findByText } = render(
      <StrictMode>
        <ErrorBoundary>
          <Counter />
        </ErrorBoundary>
      </StrictMode>
    )

    await findByText('loading')
    resolve()
    await findByText('errored')
  })

  it('can recover from error', async () => {
    let count = -1
    let willThrowError = false
    let resolve = () => {}
    const countAtom = atomWithQuery(() => ({
      queryKey: ['recover'],
      retry: false,
      queryFn: async () => {
        willThrowError = !willThrowError
        ++count
        await new Promise<void>((r) => (resolve = r))
        if (willThrowError) {
          throw new Error('fetch error')
        }
        return { response: { count } }
      },
      useErrorBoundary: true,
    }))
    const Counter = () => {
      const [countData] = useAtom(countAtom)

      const { data, isLoading, refetch } = countData

      if (isLoading) {
        return <>loading</>
      }

      return (
        <>
          <div>count: {data?.response.count}</div>
          <button onClick={() => refetch()}>refetch</button>
        </>
      )
    }

    const App = () => {
      return (
        <QueryErrorResetBoundary>
          {(reset) => (
            <ErrorBoundary retry={reset}>
              <Counter />
            </ErrorBoundary>
          )}
        </QueryErrorResetBoundary>
      )
    }

    const { findByText, getByText } = render(<App />)

    await findByText('loading')
    resolve()
    await findByText('errored')

    fireEvent.click(getByText('retry'))
    await findByText('loading')
    resolve()
    await findByText('count: 1')

    fireEvent.click(getByText('refetch'))
    resolve()
    await findByText('errored')

    fireEvent.click(getByText('retry'))
    await findByText('loading')
    resolve()
    await findByText('count: 3')
  })
})

// // Test for bug described here:
// // https://github.com/jotaijs/jotai-tanstack-query/issues/34
// Note: If error handling tests run after this test, they are failing. Not sure why.
it('renews the result when the query changes and a non stale cache is available', async () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { staleTime: 5 * 60 * 1000 } },
  })
  queryClient.setQueryData([2], 2)

  const currentCountAtom = atom(1)

  const countAtom = atomWithQuery(
    (get) => {
      const currentCount = get(currentCountAtom)
      return {
        queryKey: [currentCount],
        queryFn: () => currentCount,
      }
    },
    () => queryClient
  )

  const Counter = () => {
    const setCurrentCount = useSetAtom(currentCountAtom)
    const [countData] = useAtom(countAtom)
    const { data, isLoading, isError } = countData

    if (isLoading) {
      return <>loading</>
    }

    if (isError) {
      return <>errorred</>
    }

    return (
      <>
        <button onClick={() => setCurrentCount(2)}>Set count to 2</button>
        <div>count: {data}</div>
      </>
    )
  }

  const { findByText } = render(
    <StrictMode>
      <Counter />
    </StrictMode>
  )
  await findByText('loading')
  await findByText('count: 1')
  fireEvent.click(await findByText('Set count to 2'))
  await expect(() => findByText('loading')).rejects.toThrow()
  await findByText('count: 2')
})
