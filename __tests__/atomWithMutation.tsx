import React, { useState } from 'react'
import { fireEvent, render } from '@testing-library/react'
import { useAtom } from 'jotai/react'
import { atomsWithMutation } from '../src/index'

it('atomsWithMutation should be refreshed on unmount (#2060)', async () => {
  let resolve: (() => void) | undefined
  const [, testAtom] = atomsWithMutation<number, number, number, number>(
    () => ({
      mutationKey: ['test-atom'],
      mutationFn: async (a) => {
        await new Promise<void>((r) => {
          resolve = r
        })
        return a
      },
    })
  )

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
    const [state, mutate] = useAtom(testAtom)
    return (
      <div>
        <p>status: {state.status}</p>
        <button disabled={state.isLoading} onClick={() => mutate([1])}>
          mutate
        </button>
      </div>
    )
  }

  const { findByText, getByText } = render(<App />)

  await findByText('status: idle')

  fireEvent.click(getByText('mutate'))
  await findByText('status: loading')
  resolve?.()
  await findByText('status: success')

  fireEvent.click(getByText('mutate'))
  await findByText('status: loading')
  fireEvent.click(getByText('unmount'))
  fireEvent.click(getByText('mount'))
  await findByText('status: idle')
  resolve?.()
})
