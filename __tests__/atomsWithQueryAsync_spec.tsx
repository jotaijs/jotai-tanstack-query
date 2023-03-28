import React, { StrictMode, Suspense } from 'react'
import { render, fireEvent } from '@testing-library/react'
import { atom, useAtom } from 'jotai'
import { atomsWithQueryAsync } from '../src/index'

beforeEach(() => {
  jest.useFakeTimers({
    legacyFakeTimers: true,
  })
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
        <p>id: {id}</p>
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

it('refetch async query, force arg has no effect', async () => {
  let defaultId = 0

  const fn = jest.fn(() => Promise.resolve('uniqueKey'))
  const queryFn = jest.fn((id) => {
    return Promise.resolve({ response: { id } })
  })

  const func = async () => {
    return await fn()
  }

  const [userAtom] = atomsWithQueryAsync(async () => {
    const extraKey = await func()

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
})
