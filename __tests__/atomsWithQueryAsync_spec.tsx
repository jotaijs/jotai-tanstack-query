import React, { StrictMode, Suspense } from 'react'
import { render } from '@testing-library/react'
import { atom, useAtom } from 'jotai'
import { atomsWithQueryAsync } from '../src/index'

it('async query basic test', async () => {
  let resolveFunc = () => {}
  let resolveQuery = () => {}

  const func = async () => {
    await new Promise<void>((r) => (resolveFunc = r))
    return 2
  }

  const [userAtom] = atomsWithQueryAsync(async () => {
    const userId = await func()

    return {
      queryKey: ['userId', userId],
      queryFn: async ({ queryKey: [, id] }) => {
        await new Promise<void>((r) => (resolveQuery = r))
        return { response: { id: id as number } }
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
  resolveFunc()
  await new Promise((r) => setTimeout(r)) // wait a tick
  resolveQuery()
  await findByText('id: 2')
})

it('async query from derived atom', async () => {
  let resolveAtom = () => {}
  let resolveQuery = () => {}

  const userIdAtom = atom(async () => {
    await new Promise<void>((r) => (resolveAtom = r))
    return 2
  })
  const [userAtom] = atomsWithQueryAsync(async (get) => {
    const userId = await get(userIdAtom)

    return {
      queryKey: ['userId', userId],
      queryFn: async ({ queryKey: [, id] }) => {
        await new Promise<void>((r) => (resolveQuery = r))
        return { response: { id: id as number } }
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
  resolveAtom()
  await new Promise((r) => setTimeout(r)) // wait a tick
  resolveQuery()
  await findByText('id: 2')
})

it('async query refetch', async () => {
  let defaultId = 0
  const mockFetch = jest.fn((response) => ({ response }))
  let resolveFunc = () => {}
  let resolveQuery = () => {}

  const func = async () => {
    await new Promise<void>((r) => (resolveFunc = r))
    return 'extraKey'
  }

  const [userAtom] = atomsWithQueryAsync(async () => {
    const extraKey = await func()

    return {
      queryKey: ['userId', extraKey],
      queryFn: async () => {
        await new Promise<void>((r) => (resolveQuery = r))
        const response = mockFetch({ id: defaultId })
        return response
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
        <button
          onClick={() => {
            ++defaultId
            dispatch({ type: 'refetch', force: true })
          }}>
          refetch
        </button>
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
  resolveFunc()
  await new Promise((r) => r) // wait a tick
  resolveQuery()
  await findByText('id: 0')
  expect(mockFetch).toBeCalledTimes(1)

  // This fails
  // fireEvent.click(getByText('refetch'))
  // await findByText('loading')
  // resolveFunc()
  // await new Promise((r) => r) // wait a tick
  // resolveQuery()
  // await findByText('id: 1')
  // expect(mockFetch).toBeCalledTimes(2)
})
