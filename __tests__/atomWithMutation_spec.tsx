import React, { useState } from 'react'
import { fireEvent, render } from '@testing-library/react'
import { useAtom } from 'jotai/react'
import { atomWithMutation } from '../src/index'

it('atomWithMutation should be refreshed on unmount (#2060)', async () => {
  let resolve: (() => void) | undefined
  const mutateAtom = atomWithMutation<number, number>(() => ({
    mutationKey: ['test-atom'],
    mutationFn: async (a) => {
      console.log('mutation triggered')
      await new Promise<void>((r) => {
        resolve = r
      })
      return a
    },
  }))

  function App() {
    const [mount, setMount] = useState<boolean>(true)
    return (
      <div>
        <button onClick={() => setMount(false)}>unmount</button>
        <button onClick={() => setMount(true)}>mount</button>
        {mount && <TestView />}
      </div>
    )
  }

  function TestView() {
    const [{ mutate, isPending, status }] = useAtom(mutateAtom)
    return (
      <div>
        <p>status: {status}</p>
        <button disabled={isPending} onClick={() => mutate(1)}>
          mutate
        </button>
      </div>
    )
  }

  const { findByText, getByText } = render(<App />)

  await findByText('status: idle')

  fireEvent.click(getByText('mutate'))
  await findByText('status: pending')
  resolve?.()
  await findByText('status: success')

  fireEvent.click(getByText('unmount'))
  fireEvent.click(getByText('mount'))
  await findByText('status: idle')
  resolve?.()
})
