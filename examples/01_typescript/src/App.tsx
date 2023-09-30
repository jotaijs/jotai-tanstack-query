import React, { Suspense } from 'react'
import { useAtom } from 'jotai/react'
import { atom } from 'jotai/vanilla'
import { atomWithQuery } from 'jotai-tanstack-query'

const idAtom = atom(1)

const userAtom = atomWithQuery((get) => ({
  queryKey: ['users', get(idAtom)],
  queryFn: async ({ queryKey: [, id] }) => {
    const res = await fetch(`https://jsonplaceholder.typicode.com/users/${id}`)
    return res.json()
  },
  suspense: true,
  keepPreviousData: true,
}))

const UserData = () => {
  const [data] = useAtom(userAtom)
  console.log(data)
  return <pre>{JSON.stringify(data, null, 2)}</pre>
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
    <Suspense fallback="Loadings...">
      <UserData />
    </Suspense>
  </>
)

export default App
