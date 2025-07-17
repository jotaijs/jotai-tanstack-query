import React, { Suspense } from 'react'
import { useAtom } from 'jotai/react'
import { atom } from 'jotai/vanilla'
import { atomWithQuery } from 'jotai-tanstack-query'

const idAtom = atom(1)

const asyncIdAtom = atom(async (get) => {
  return get(idAtom)
})

const userAtom = atomWithQuery((get) => ({
  queryKey: ['users', get(idAtom)],
  queryFn: async ({ queryKey: [, id] }) => {
    const res = await fetch(`https://jsonplaceholder.typicode.com/users/${id}`)
    return res.json()
  },
}))

const asyncUserAtom = atomWithQuery(async (get) => {
  return {
    queryKey: ['users', await get(asyncIdAtom)],
    queryFn: async ({ queryKey: [, id] }) => {
      const res = await fetch(
        `https://jsonplaceholder.typicode.com/users/${id}`
      )
      return res.json()
    },
  }
})

const UserData = () => {
  const [{ data, isPending, isError }] = useAtom(userAtom)

  if (isPending) return <div>Loading...</div>
  if (isError) return <div>Error</div>

  return <div>{JSON.stringify(data)}</div>
}

const UserDataAsync = () => {
  const [{ data, isPending, isError }] = useAtom(asyncUserAtom)

  if (isPending) return <div>Loading...</div>
  if (isError) return <div>Error</div>

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
    <UserData />
    <Suspense fallback={<div>Loading user id...</div>}>
      <UserDataAsync />
    </Suspense>
  </>
)

export default App
