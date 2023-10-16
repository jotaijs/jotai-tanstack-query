import React, { Suspense } from 'react'
import { useAtom } from 'jotai/react'
import { atom } from 'jotai/vanilla'
import { atomsWithQuery, queryClientAtom } from 'jotai-tanstack-query'

const idAtom = atom(1)

const [userAtom] = atomsWithQuery(() => ({
  queryKey: ['users', 1],
  queryFn: async ({ queryKey: [, id] }) => {
    const res = await fetch(`https://reqres.in/api/users/${id}`)
    return res.json()
  },
  // staleTime: 0,
  refetchOnMount: false,
}))

const UserData = () => {
  const [user, dispatch] = useAtom(userAtom)
  return (
    <div>
      <ul>
        <li>ID: {user.data.id}</li>
        <li>First Name: {user.data.first_name}</li>
        <li>Last Name: {user.data.last_name}</li>
      </ul>
      <button onClick={() => dispatch({ type: 'refetch' })}>refetch</button>
    </div>
  )
}

const Controls = () => {
  const [id, setId] = useAtom(idAtom)
  const [queryClient] = useAtom(queryClientAtom)

  const setQuery = () => {
    queryClient.setQueryData(['users', 1], {
      data: {
        avatar: 'https://reqres.in/img/faces/5-image.jpg',
        email: 'charles.morris@reqres.in',
        first_name: 'Charles',
        id: 5,
        last_name: 'Morris',
      },
    })
  }

  const clear = () => {
    queryClient.removeQueries()
  }

  return (
    <div>
      ID: {id}{' '}
      <button type="button" onClick={() => setId((c) => c - 1)}>
        Prev
      </button>{' '}
      <button type="button" onClick={() => setId((c) => c + 1)}>
        Next
      </button>
      <button onClick={setQuery}>Set user 5</button>
      <button onClick={clear}>clear</button>
    </div>
  )
}

const App = () => {
  const [id] = useAtom(idAtom)

  return (
    <>
      <Controls />
      <Suspense fallback="Loading...">{id === 1 && <UserData />}</Suspense>
    </>
  )
}

export default App
