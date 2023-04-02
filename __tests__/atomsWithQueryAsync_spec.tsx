import type { ReactNode } from 'react'
import React, { Component, StrictMode, Suspense } from 'react'
import { QueryClient } from '@tanstack/query-core'
import { fireEvent, render } from '@testing-library/react'
import { atom, useAtom } from 'jotai'
import { atomsWithQueryAsync } from '../src/index'

beforeEach(() => {
  jest.useFakeTimers()
})
afterEach(() => {
  jest.runAllTimers()
  jest.useRealTimers()
})

it('async query basic test', async () => {
  const fn = jest.fn(() => Promise.resolve(2))
  const queryFn = jest.fn((id) => {
    return Promise.resolve({ response: { id } })
  })

  const [userAtom] = atomsWithQueryAsync(async () => {
    const userId = await fn()

    return {
      queryKey: ['userId', userId],
      queryFn: async ({ queryKey: [, id] }) => {
        const res = await queryFn(id)
        return res
      },
    }
  })
  const User = () => {
    const [
      {
        response: { id },
      },
    ] = useAtom(userAtom)

    return (
      <>
        <div>id: {id}</div>
      </>
    )
  }
  const { findByText } = render(
    <StrictMode>
      <Suspense fallback="loading">
        <User />
      </Suspense>
    </StrictMode>
  )

  await findByText('loading')
  await findByText('id: 2')
})

it('async query from derived atom', async () => {
  const atomFn = jest.fn(() => Promise.resolve(2))
  const queryFn = jest.fn((id) => {
    return Promise.resolve({ response: { id } })
  })

  const userIdAtom = atom(async () => {
    return await atomFn()
  })
  const [userAtom] = atomsWithQueryAsync(async (get) => {
    const userId = await get(userIdAtom)

    return {
      queryKey: ['userId', userId],
      queryFn: async ({ queryKey: [, id] }) => {
        const res = await queryFn(id)
        return res
      },
    }
  })
  const User = () => {
    const [
      {
        response: { id },
      },
    ] = useAtom(userAtom)

    return (
      <>
        <div>id: {id}</div>
      </>
    )
  }
  const { findByText } = render(
    <StrictMode>
      <Suspense fallback="loading">
        <User />
      </Suspense>
    </StrictMode>
  )

  await findByText('loading')
  await findByText('id: 2')
})

it('refetch async query', async () => {
  let defaultId = 0

  const fn = jest.fn(() => Promise.resolve('uniqueKey'))
  const queryFn = jest.fn((id) => {
    return Promise.resolve({ response: { id } })
  })

  const [userAtom] = atomsWithQueryAsync(async () => {
    const extraKey = await fn()

    return {
      queryKey: ['userId', extraKey],
      queryFn: async () => {
        const res = await queryFn(defaultId)
        defaultId++
        return res
      },
    }
  })

  const User = () => {
    const [
      {
        response: { id },
      },
      dispatch,
    ] = useAtom(userAtom)
    return (
      <>
        <div>id: {id}</div>
        <button onClick={() => dispatch({ type: 'refetch', force: true })}>
          refetch
        </button>
      </>
    )
  }

  const { findByText, getByText } = render(
    <StrictMode>
      <Suspense fallback="loading">
        <User />
      </Suspense>
    </StrictMode>
  )

  await findByText('loading')
  await findByText('id: 0')

  fireEvent.click(getByText('refetch'))
  await findByText('id: 1')

  fireEvent.click(getByText('refetch'))
  await findByText('id: 2')

  fireEvent.click(getByText('refetch'))
  await findByText('id: 3')
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
      if (this.state.hasError) {
        return (
          <div>
            {this.props.message || 'errored'}
            <button
              onClick={() => {
                this.props.retry?.()
                this.setState({ hasError: false })
              }}>
              retry
            </button>
          </div>
        )
      }

      return this.props.children
    }
  }

  it('can catch error in error boundary', async () => {
    const fn = jest.fn(() => Promise.resolve('uniqueKey'))
    const queryFn = jest.fn(() => {
      return Promise.resolve()
    })

    const [userAtom] = atomsWithQueryAsync(async () => {
      const extraKey = await fn()

      return {
        queryKey: ['error test', extraKey],
        retry: false,
        queryFn: async (): Promise<{ response: { id: number } }> => {
          await queryFn()
          throw new Error('fetch error')
        },
      }
    })

    const User = () => {
      const [
        {
          response: { id },
        },
      ] = useAtom(userAtom)
      return (
        <>
          <div>id: {id}</div>
        </>
      )
    }

    const { findByText } = render(
      <StrictMode>
        <ErrorBoundary>
          <Suspense fallback="loading">
            <User />
          </Suspense>
        </ErrorBoundary>
      </StrictMode>
    )

    await findByText('loading')
    await findByText('errored')
  })
})

it('query expected QueryCache test', async () => {
  const queryClient = new QueryClient()

  const fn = jest.fn(() => Promise.resolve('uniqueKey'))
  const queryFn = jest.fn(() => {
    return Promise.resolve(2)
  })

  const [userAtom] = atomsWithQueryAsync(
    async () => {
      const extraKey = await fn()

      return {
        queryKey: [extraKey],
        queryFn: async () => {
          const id = await queryFn()
          return { response: { id } }
        },
      }
    },
    () => queryClient
  )

  const User = () => {
    const [
      {
        response: { id },
      },
    ] = useAtom(userAtom)

    return (
      <>
        <div>id: {id}</div>
      </>
    )
  }

  const { findByText } = render(
    <StrictMode>
      <Suspense fallback="loading">
        <User />
      </Suspense>
    </StrictMode>
  )

  await findByText('loading')
  await findByText('id: 2')
  expect(queryClient.getQueryCache().getAll().length).toBe(1)
})
