import React, { Component, ReactNode, StrictMode, Suspense } from 'react'
import { QueryClient } from '@tanstack/query-core'
import { fireEvent, render } from '@testing-library/react'
import { atom, useAtom, useSetAtom } from 'jotai'
import { atomWithSuspenseQuery } from '../src'

it('suspense basic, suspends', async () => {
  let resolve = () => {}
  const countAtom = atomWithSuspenseQuery(() => ({
    queryKey: ['test1'],
    queryFn: async () => {
      await new Promise<void>((r) => (resolve = r))
      return { response: { count: 0 } }
    },
  }))
  const Counter = () => {
    const [{ data }] = useAtom(countAtom)
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
})

it('query refetch', async () => {
  const mockFetch = jest.fn<
    { response: { message: string } },
    { message: string }[]
  >((response) => ({
    response,
  }))
  let resolve = () => {}
  const greetingAtom = atomWithSuspenseQuery(() => ({
    queryKey: ['test3'],
    queryFn: async () => {
      await new Promise<void>((r) => (resolve = r))
      const response = mockFetch({ message: 'helloWorld' })
      return response
    },
  }))
  const Greeting = () => {
    const [{ data, refetch }] = useAtom(greetingAtom)

    return (
      <>
        <div>message: {data?.response.message}</div>
        <button onClick={() => refetch?.()}>refetch</button>
      </>
    )
  }

  const { findByText, getByText } = render(
    <StrictMode>
      <Suspense fallback="loading">
        <Greeting />
      </Suspense>
    </StrictMode>
  )

  await findByText('loading')
  resolve()
  await findByText('message: helloWorld')
  expect(mockFetch).toBeCalledTimes(1)

  fireEvent.click(getByText('refetch'))
  await expect(() => findByText('loading')).rejects.toThrow() //refetch implementation in tanstack doesn't trigger loading state
  resolve()
  await findByText('message: helloWorld')
  expect(mockFetch).toBeCalledTimes(2) //this ensures we are actually running the query function again
})

describe('intialData test', () => {
  it('query with initialData test', async () => {
    const mockFetch = jest.fn((response) => ({ response }))
    let resolve = () => {}

    const countAtom = atomWithSuspenseQuery(() => ({
      queryKey: ['initialData_count1'],
      queryFn: async () => {
        await new Promise<void>((r) => (resolve = r))
        return mockFetch({ count: 10 })
      },
      initialData: { response: { count: 0 } },
      staleTime: 0,
    }))
    const Counter = () => {
      const [countData] = useAtom(countAtom)
      const { data, isError } = countData

      if (isError) {
        return <>errorred</>
      }

      const count = data?.response.count
      return (
        <>
          <div>count: {count}</div>
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

    // NOTE: the atom is never loading
    await expect(() => findByText('loading')).rejects.toThrow()
    await findByText('count: 0')
    resolve()
    await findByText('count: 10')
    expect(mockFetch).toHaveBeenCalledTimes(1)
  })

  it('query with initialData test with dependency', async () => {
    const mockFetch = jest.fn((response) => ({ response }))
    let resolve = () => {}
    const numberAtom = atom(10)
    const countAtom = atomWithSuspenseQuery((get) => ({
      queryKey: ['initialData_count1', get(numberAtom)],
      queryFn: async ({ queryKey: [, myNumber] }) => {
        await new Promise<void>((r) => (resolve = r))
        return mockFetch({ count: myNumber })
      },
      initialData: { response: { count: 0 } },
      staleTime: 0,
    }))
    const Counter = () => {
      const [countData] = useAtom(countAtom)
      const { data, isError } = countData
      if (isError) {
        return <>errorred</>
      }
      const count = data?.response.count
      return (
        <>
          <div>count: {count}</div>
        </>
      )
    }

    const Increment = () => {
      const setNumber = useSetAtom(numberAtom)
      return <button onClick={() => setNumber((n) => n + 1)}>increment</button>
    }
    const { findByText } = render(
      <StrictMode>
        <Suspense fallback="loading">
          <Counter />
        </Suspense>
        <Increment />
      </StrictMode>
    )
    // NOTE: the atom is never loading
    await expect(() => findByText('loading')).rejects.toThrow()
    await findByText('count: 0')
    resolve()
    await findByText('count: 10')
    expect(mockFetch).toHaveBeenCalledTimes(1)
    await findByText('increment')
    fireEvent.click(await findByText('increment'))
    await findByText('count: 0')
    resolve()
    await findByText('count: 11')
    expect(mockFetch).toHaveBeenCalledTimes(2)
  })
})

it('query dependency test', async () => {
  const baseCountAtom = atom(0)
  const incrementAtom = atom(null, (_get, set) =>
    set(baseCountAtom, (c) => c + 1)
  )
  let resolve = () => {}
  const countAtom = atomWithSuspenseQuery((get) => ({
    queryKey: ['count_with_dependency', get(baseCountAtom)],
    queryFn: async () => {
      await new Promise<void>((r) => (resolve = r))
      return { response: { count: get(baseCountAtom) } }
    },
  }))

  const Counter = () => {
    const [{ data }] = useAtom(countAtom)

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
      <Suspense fallback={'loading'}>
        <Counter />
      </Suspense>
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
  const countAtom = atomWithSuspenseQuery(
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
    const [{ data }] = useAtom(countAtom)

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
    const countAtom = atomWithSuspenseQuery(() => ({
      queryKey: ['catch'],
      retry: false,
      queryFn: async (): Promise<{ response: { count: number } }> => {
        await new Promise<void>((r) => (resolve = r))
        throw new Error('fetch error')
      },
    }))
    const Counter = () => {
      const [{ data }] = useAtom(countAtom)

      return <div>count: {data.response.count}</div>
    }

    const { findByText } = render(
      <StrictMode>
        <ErrorBoundary>
          <Suspense fallback={'loading'}>
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

it('renews the result when the query changes and a non stale cache is available', async () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { staleTime: 5 * 60 * 1000 } },
  })
  queryClient.setQueryData([2], 2)

  const currentCountAtom = atom(1)

  const countAtom = atomWithSuspenseQuery(
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
    const [{ data }] = useAtom(countAtom)

    return (
      <>
        <button onClick={() => setCurrentCount(2)}>Set count to 2</button>
        <div>count: {data}</div>
      </>
    )
  }

  const { findByText } = render(
    <StrictMode>
      <Suspense fallback={'loading'}>
        <Counter />
      </Suspense>
    </StrictMode>
  )
  await findByText('loading')
  await findByText('count: 1')
  fireEvent.click(await findByText('Set count to 2'))
  await expect(() => findByText('loading')).rejects.toThrow()
  await findByText('count: 2')
})
