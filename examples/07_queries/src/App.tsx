import React from 'react'
import { Atom, atom } from 'jotai'
import { useAtom } from 'jotai/react'
import { atomWithQueries } from 'jotai-tanstack-query'

const userIdsAtom = atom([1, 2, 3])

const UsersData = () => {
  const [userIds] = useAtom(userIdsAtom)

  const userQueryAtoms = atomWithQueries({
    queries: userIds.map((id) => () => ({
      queryKey: ['user', id],
      queryFn: async ({ queryKey: [, userId] }) => {
        const res = await fetch(
          `https://jsonplaceholder.typicode.com/users/${userId}`
        )
        return res.json()
      },
    })),
  })
  return (
    <div>
      <h3>Users: </h3>
      <div>
        {userQueryAtoms.map((queryAtom, index) => (
          <Data key={index} queryAtom={queryAtom} />
        ))}
      </div>
    </div>
  )
}

const CombinedUsersData = () => {
  const [userIds] = useAtom(userIdsAtom)

  const combinedUsersDataAtom = atomWithQueries({
    queries: userIds.map((id) => () => ({
      queryKey: ['user', id],
      queryFn: async ({ queryKey: [, userId] }) => {
        const res = await fetch(
          `https://jsonplaceholder.typicode.com/users/${userId}`
        )
        return res.json()
      },
    })),
    combine: (results) => {
      return {
        data: results.map((result) => result.data),
        isPending: results.some((result) => result.isPending),
        isError: results.some((result) => result.isError),
      }
    },
  })

  return (
    <div>
      <h3>Users: (combinedQueries)</h3>
      <div>
        <CombinedData queryAtom={combinedUsersDataAtom} />
      </div>
    </div>
  )
}

const CombinedData = ({ queryAtom }: { queryAtom: Atom<any> }) => {
  const [{ data, isPending, isError }] = useAtom(queryAtom)

  if (isPending) return <div>Loading...</div>
  if (isError) return <div>Error</div>

  return (
    <div>
      {data.map((user: any) => (
        <UserDisplay key={user.id} user={user} />
      ))}
    </div>
  )
}

const Data = ({ queryAtom }: { queryAtom: Atom<any> }) => {
  const [{ data, isPending, isError }] = useAtom(queryAtom)

  if (isPending) return <div>Loading...</div>
  if (isError) return <div>Error</div>

  return <UserDisplay user={data} />
}

const UserDisplay = ({ user }: { user: any }) => {
  return (
    <div>
      <div>ID: {user.id}</div>
      <strong>{user.name}</strong> - {user.email}
    </div>
  )
}

const Controls = () => {
  const [userIds, setUserIds] = useAtom(userIdsAtom)

  return (
    <div>
      <div>User IDs: {userIds.join(', ')} </div>
      <button
        onClick={() =>
          setUserIds(
            Array.from({ length: 3 }, () => Math.floor(Math.random() * 10) + 1)
          )
        }>
        Random
      </button>
    </div>
  )
}

const App = () => {
  return (
    <div>
      <Controls />
      <UsersData />
      <hr />
      <CombinedUsersData />
    </div>
  )
}

export default App
