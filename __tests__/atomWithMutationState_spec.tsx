import React from 'react'
import { QueryClient } from '@tanstack/query-core'
import { fireEvent, render } from '@testing-library/react'
import { Provider, useAtom } from 'jotai'
import { atomWithMutation, atomWithMutationState } from '../src'

it('atomWithMutationState multiple', async () => {
  const client = new QueryClient()
  let resolve1: (() => void) | undefined
  const mutateAtom1 = atomWithMutation<number, number>(
    () => ({
      mutationKey: ['test-atom'],
      mutationFn: async (a) => {
        await new Promise<void>((r) => {
          resolve1 = r
        })
        return a
      },
    }),
    () => client
  )
  let resolve2: (() => void) | undefined
  const mutateAtom2 = atomWithMutation<number, number>(
    () => ({
      mutationKey: ['test-atom'],
      mutationFn: async (a) => {
        await new Promise<void>((r) => {
          resolve2 = r
        })
        return a
      },
    }),
    () => client
  )

  const mutationStateAtom = atomWithMutationState(
    () => ({ filters: { mutationKey: ['test-atom'] } }),
    () => client
  )

  function App() {
    const [{ mutate: mutate1 }] = useAtom(mutateAtom1)
    const [{ mutate: mutate2 }] = useAtom(mutateAtom2)
    const [mutations] = useAtom(mutationStateAtom)

    return (
      <div>
        <p>mutationCount: {mutations.length}</p>
        <button
          onClick={() => {
            mutate1(1)
            mutate2(2)
          }}>
          mutate
        </button>
      </div>
    )
  }

  const { findByText, getByText } = render(
    <Provider>
      <App />
    </Provider>
  )

  await findByText('mutationCount: 0')
  fireEvent.click(getByText('mutate'))
  await findByText('mutationCount: 2')
  resolve1?.()
  await findByText('mutationCount: 1')
  resolve2?.()
  await findByText('mutationCount: 0')
})
