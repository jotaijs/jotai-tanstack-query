import React, { StrictMode, Suspense } from 'react'
import { render } from '@testing-library/react'
import { atom, useAtom } from 'jotai'
import { atomsWithQueryAsync } from '../src/index'

it('async query basic test', async () => {
  let resolve = () => {}
  let resolveQuery = () => {}

  const userIdAtom = atom(async () => {
    await new Promise<void>((r) => (resolve = r))
    return 2
  })
  const [userAtom] = atomsWithQueryAsync(async (get) => {
    const userId = await get(userIdAtom)

    return {
      queryKey: ['idTest', userId],
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
  resolve()
  await new Promise((r) => setTimeout(r)) // wait a tick
  resolveQuery()
  await findByText('id: 2')
})
