import { Suspense } from 'react'
import { atom, useAtom, useSetAtom } from 'jotai'
import { atomWithSuspenseQuery } from 'jotai-tanstack-query'
import { ErrorBoundary, type FallbackProps } from 'react-error-boundary'

const idAtom = atom(1)
const userAtom = atomWithSuspenseQuery<User>((get) => ({
  queryKey: ['user', get(idAtom)],
  queryFn: async ({ queryKey: [, id] }) => {
    const randomNumber = Math.floor(Math.random() * 10)
    if (randomNumber % 3 === 0) {
      await fetch(`https://jsonplaceholder.typicode.com/users/error`)
      return await Promise.reject('fetch failed')
    }

    const res = await fetch(`https://jsonplaceholder.typicode.com/users/${id}`)
    return res.json()
  },
  retry: false,
}))

const UserData = () => {
  const [{ data }] = useAtom(userAtom)

  return (
    <>
      <UserDisplay user={data} />
    </>
  )
}

interface User {
  id: number
  name: string
  email: string
}

const UserDisplay = ({ user }: { user: User }) => {
  return (
    <div>
      <div>ID: {user.id}</div>
      <strong>{user.name}</strong> - {user.email}
    </div>
  )
}

const Controls = () => {
  const [id, setId] = useAtom(idAtom)
  return (
    <>
      <div>
        ID: {id}{' '}
        <button type="button" onClick={() => setId((c) => c - 1)}>
          Prev
        </button>{' '}
        <button type="button" onClick={() => setId((c) => c + 1)}>
          Next
        </button>
      </div>
    </>
  )
}

const Fallback = ({ error, resetErrorBoundary }: FallbackProps) => {
  const reset = useSetAtom(userAtom)
  const retry = () => {
    reset()
    resetErrorBoundary()
  }
  return (
    <div role="alert">
      <p>Something went wrong:</p>
      <pre>{error.message}</pre>
      <button onClick={retry}>Try again</button>
    </div>
  )
}

const App = () => {
  return (
    <ErrorBoundary FallbackComponent={Fallback}>
      <Suspense fallback="Loading...">
        <Controls />
        <UserData />
      </Suspense>
    </ErrorBoundary>
  )
}

export default App
