import { Suspense } from 'react'
import { useAtom } from 'jotai/react'
import { atom } from 'jotai/vanilla'
import { atomWithSuspenseQuery } from 'jotai-tanstack-query'

const idAtom = atom(1)

const userAtom = atomWithSuspenseQuery<object>((get) => ({
  queryKey: ['users', get(idAtom)],
  queryFn: async ({ queryKey: [, id] }) => {
    const res = await fetch(`https://jsonplaceholder.typicode.com/users/${id}`)
    return res.json()
  },
}))

const UserData = () => {
  const [{ data }] = useAtom(userAtom)

  return <div>{JSON.stringify(data)}</div>
}

const Controls = () => {
  const [id, setId] = useAtom(idAtom)
  return (
    <div>
      ID: {id}{' '}
      <button type="button" onClick={() => setId((c) => c - 1)}>
        Prev
      </button>{' '}
      <button type="button" onClick={() => setId((c) => c + 1)}>
        Next
      </button>
    </div>
  )
}

const App = () => (
  <>
    <Controls />
    <Suspense fallback="loading">
      <UserData />
    </Suspense>
  </>
)

export default App
