import { Atom, atom } from 'jotai'
import { useAtom } from 'jotai/react'
import { type AtomWithQueryResult, atomWithQueries } from 'jotai-tanstack-query'

const userIdsAtom = atom([1, 2, 3])

interface User {
  id: number
  name: string
  email: string
}

const userQueryAtomsAtom = atom((get) => {
  const userIds = get(userIdsAtom)
  return atomWithQueries<User>({
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
})

const UsersData = () => {
  const [userQueryAtoms] = useAtom(userQueryAtomsAtom)
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

const combinedUsersDataAtom = atom((get) => {
  const userIds = get(userIdsAtom)
  return atomWithQueries<{
    data: User[]
    isPending: boolean
    isError: boolean
  }>({
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
        data: results.map((result) => result.data as User),
        isPending: results.some((result) => result.isPending),
        isError: results.some((result) => result.isError),
      }
    },
  })
})

const CombinedUsersData = () => {
  const [combinedUsersDataAtomValue] = useAtom(combinedUsersDataAtom)
  const [{ data, isPending, isError }] = useAtom(combinedUsersDataAtomValue)

  return (
    <div>
      <h3>Users: (combinedQueries)</h3>
      {isPending && <div>Loading...</div>}
      {isError && <div>Error</div>}
      {!isPending && !isError && (
        <div>
          {data.map((user) => (
            <UserDisplay key={user.id} user={user} />
          ))}
        </div>
      )}
    </div>
  )
}

const Data = ({
  queryAtom,
}: {
  queryAtom: Atom<AtomWithQueryResult<User>>
}) => {
  const [{ data, isPending, isError }] = useAtom(queryAtom)

  if (isPending) return <div>Loading...</div>
  if (isError) return <div>Error</div>
  if (!data) return null

  return <UserDisplay user={data} />
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
  const [userIds, setUserIds] = useAtom(userIdsAtom)

  return (
    <div>
      <div>User IDs: {userIds.join(', ')} </div>
      <button
        onClick={() => {
          const n = Math.floor(Math.random() * 8)
          setUserIds([n + 1, n + 2, n + 3])
        }}>
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
