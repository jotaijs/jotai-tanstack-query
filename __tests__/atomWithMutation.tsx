import React, { useState } from 'react'
import { fireEvent, render } from '@testing-library/react'
import { useAtom } from 'jotai/react'
import { atomsWithMutation } from '../src/index'

// it('status should change', async () => {
//   const idAtom = atom(undefined as number | undefined)

//   let resolve: (() => void) | undefined
//   const [, statusAtom] = atomsWithQuery((get) => ({
//     queryKey: ['users', get(idAtom)],
//     queryFn: async ({ queryKey: [, id] }) => {
//       await new Promise<void>((r) => {
//         resolve = r
//       })
//       return { id }
//     },
//     // using as a dependent query
//     enabled: Boolean(get(idAtom)),
//   }))

//   const DataFromStatusAtom = () => {
//     const [status] = useAtom(statusAtom)
//     const statusMessage = status.isInitialLoading
//       ? 'initial loading'
//       : status.status
//     return (
//       <div>
//         <div>status: {statusMessage}</div>
//         <div>data: {JSON.stringify(status.data)}</div>
//       </div>
//     )
//   }

//   const Controls = () => {
//     const [id, setId] = useAtom(idAtom)
//     return (
//       <div>
//         ID: {id}{' '}
//         <button type="button" onClick={() => setId((c = 0) => c + 1)}>
//           Next
//         </button>
//       </div>
//     )
//   }

//   const App = () => (
//     <>
//       <Controls />
//       <DataFromStatusAtom />
//     </>
//   )

//   const { findByText, getByText } = render(<App />)

//   await findByText('status: loading')

//   fireEvent.click(getByText('Next'))
//   await findByText('status: initial loading')
//   resolve?.()
//   await findByText('status: success')

//   fireEvent.click(getByText('Next'))
//   await findByText('status: initial loading')
//   resolve?.()
//   await findByText('status: success')
// })

it('the mutation atom should be refreshed on unmount (#2060)', async () => {
  let resolve: (() => void) | undefined
  const [, testAtom] = atomsWithMutation<number, number, number, number>(
    () => ({
      mutationKey: ["test-atom"],
      mutationFn: async (a) => {
        await new Promise<void>((r) => {
          resolve = r
        })
        return a;
      },
    })
  );

  function App() {
    const [mount, setMount] = useState<boolean>(true);
    return (
      <div
      >
        <button onClick={() => setMount(false)}>
          unmount
        </button>
        <button onClick={() => setMount(true)}>
          mount
        </button>
        {mount && <TestView />}
      </div>
    );
  }

  function TestView() {
    const [state, mutate] = useAtom(testAtom);
    return (
      <div>
        <p>status: {state.status}</p>
        <button disabled={state.isLoading} onClick={() => mutate([1])}>
          mutate
        </button>
      </div>
    );
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
