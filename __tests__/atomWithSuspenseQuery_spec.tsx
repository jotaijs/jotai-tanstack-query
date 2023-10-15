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
import {
  QueryErrorResetBoundary,
  atomWithQuery,
  atomWithSuspenseQuery,
} from '../src'
beforeEach(() => {
  jest.useFakeTimers()
})
afterEach(() => {
  jest.runAllTimers()
  jest.useRealTimers()
})

// it('suspense basic, suspends', async () => {
//   let resolve = () => {}
//   const countAtom = atomWithSuspenseQuery(() => ({
//     queryKey: ['test1'],
//     queryFn: async () => {
//       await new Promise<void>((r) => (resolve = r))
//       return { response: { count: 0 } }
//     },
//   }))
//   const Counter = () => {
//     const [countData] = useAtom(countAtom)
//     console.log(JSON.stringify({ countData }, null, 2))
//     const { data } = countData
//     return (
//       <>
//         <div>count: {data?.response.count}</div>
//       </>
//     )
//   }

//   const { findByText } = render(
//     <StrictMode>
//       <Suspense fallback="loading">
//         <Counter />
//       </Suspense>
//     </StrictMode>
//   )

//   await findByText('loading')
//   resolve()
//   await findByText('count: 0')
// })

// it('query refetch', async () => {
//   const mockFetch = jest.fn<
//     { response: { message: string } },
//     { message: string }[]
//   >((response) => ({
//     response,
//   }))
//   let resolve = () => {}
//   const greetingAtom = atomWithSuspenseQuery(() => ({
//     queryKey: ['test3'],
//     queryFn: async () => {
//       await new Promise<void>((r) => (resolve = r))
//       const response = mockFetch({ message: 'helloWorld' })
//       return response
//     },
//   }))
//   const Greeting = () => {
//     const [{ data, refetch }] = useAtom(greetingAtom)

//     return (
//       <>
//         <div>message: {data?.response.message}</div>
//         <button onClick={() => refetch?.()}>refetch</button>
//       </>
//     )
//   }

//   const { findByText, getByText } = render(
//     <StrictMode>
//       <Suspense fallback="loading">
//         <Greeting />
//       </Suspense>
//     </StrictMode>
//   )

//   await findByText('loading')
//   resolve()
//   await findByText('message: helloWorld')
//   expect(mockFetch).toBeCalledTimes(1)

//   fireEvent.click(getByText('refetch'))
//   await expect(() => findByText('loading')).rejects.toThrow() //refetch implementation in tanstack doesn't trigger loading state
//   resolve()
//   await findByText('message: helloWorld')
//   expect(mockFetch).toBeCalledTimes(2) //this ensures we are actually running the query function again
// })

describe('intialData test', () => {
  // it('query with initialData test', async () => {
  //   const mockFetch = jest.fn((response) => ({ response }))
  //   let resolve = () => {}

  //   const countAtom = atomWithSuspenseQuery(() => ({
  //     queryKey: ['initialData_count1'],
  //     queryFn: async () => {
  //       await new Promise<void>((r) => (resolve = r))
  //       return mockFetch({ count: 10 })
  //     },
  //     initialData: { response: { count: 0 } },
  //     staleTime: 0,
  //   }))
  //   const Counter = () => {
  //     const [countData] = useAtom(countAtom)
  //     const { data, isError } = countData

  //     if (isError) {
  //       return <>errorred</>
  //     }

  //     const count = data?.response.count
  //     return (
  //       <>
  //         <div>count: {count}</div>
  //       </>
  //     )
  //   }

  //   const { findByText } = render(
  //     <StrictMode>
  //       <Suspense fallback="loading">
  //         <Counter />
  //       </Suspense>
  //     </StrictMode>
  //   )

  //   // NOTE: the atom is never loading
  //   await expect(() => findByText('loading')).rejects.toThrow()
  //   await findByText('count: 0')
  //   resolve()
  //   await findByText('count: 10')
  //   expect(mockFetch).toHaveBeenCalledTimes(1)
  // })

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
    fireEvent.click(await findByText('increment'))
    await findByText('count: 0')
  })
})
