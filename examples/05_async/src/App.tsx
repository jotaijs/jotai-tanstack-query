import React from 'react'
import { atom, useAtomValue } from 'jotai'
import { atomsWithQueryAsync } from 'jotai-tanstack-query'

const idAtom = atom(async () => {
  await new Promise((resolve) => setTimeout(resolve, 2000))
  return 2
})

const [userAtom] = atomsWithQueryAsync(async (get) => {
  const id = await get(idAtom)
  return {
    queryKey: ['getUser', id],
    queryFn: async () => {
      const res = await fetch('https://reqres.in/api/users/' + id)
      return res.json() as Promise<{ data: unknown }>
    },
  }
})

const UserData = () => {
  const data = useAtomValue(userAtom)
  return <div>{JSON.stringify(data)}</div>
}

const App = () => (
  <React.Suspense fallback="Loading...">
    <UserData />
  </React.Suspense>
)

export default App
