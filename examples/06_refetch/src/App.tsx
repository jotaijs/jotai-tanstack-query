import React from 'react'
import { useAtom } from 'jotai/react'
import { atom } from 'jotai/vanilla'
import { atomWithQuery } from 'jotai-tanstack-query'
import { ErrorBoundary } from 'react-error-boundary'
import type { FallbackProps } from 'react-error-boundary'

const idAtom = atom(1)

const userAtom = atomWithQuery((get) => ({
  queryKey: ['users', get(idAtom)],
  queryFn: async ({ queryKey: [, id] }) => {
    const res = await fetch(`https://jsonplaceholder.typicode.com/users/${id}`)
    return res.json()
  },
}))

const UserData = () => {
  const [{ data, refetch, isPending }] = useAtom(userAtom)
  if (isPending) return <div>Loading...</div>
  return (
    <div>
      <ul>
        <li>ID: {data.id}</li>
        <li>Username: {data.username}</li>
        <li>Email: {data.email}</li>
      </ul>
      <button onClick={() => refetch()}>refetch</button>
    </div>
  )
}

const Controls = () => {
  const [_id, setId] = useAtom(idAtom)
  return (
    <div>
      <button type="button" onClick={() => setId((c) => c - 1)}>
        Prev
      </button>{' '}
      <button type="button" onClick={() => setId((c) => c + 1)}>
        Next
      </button>
    </div>
  )
}

const Fallback = ({ error, resetErrorBoundary }: FallbackProps) => {
  return (
    <div role="alert">
      <p>Something went wrong:</p>
      <pre>{error.message}</pre>
      <button type="button" onClick={resetErrorBoundary}>
        Try again
      </button>
    </div>
  )
}

const App = () => (
  <ErrorBoundary FallbackComponent={Fallback}>
    <Controls />
    <UserData />
  </ErrorBoundary>
)

export default App
