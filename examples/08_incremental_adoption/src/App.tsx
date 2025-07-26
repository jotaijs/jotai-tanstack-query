import { QueryClient, useQuery } from '@tanstack/react-query'
import { Provider, useAtom } from 'jotai/react'
import { atom } from 'jotai/vanilla'
import { atomWithQuery } from 'jotai-tanstack-query'
import { QueryClientProvider } from 'jotai-tanstack-query/react'

const queryClient = new QueryClient()

const idAtom = atom(1)

const userAtom = atomWithQuery(
  (get) => ({
    queryKey: ['users', get(idAtom)],
  }),
  () => queryClient
)

const UserDataRawFetch = () => {
  const [id] = useAtom(idAtom)
  const { data, isPending, isError } = useQuery({
    queryKey: ['users', id],
    queryFn: async ({ queryKey: [, id] }) => {
      const res = await fetch(
        `https://jsonplaceholder.typicode.com/users/${id}`
      )
      return res.json()
    },
  })

  if (isPending) return <div>Loading...</div>
  if (isError) return <div>Error</div>

  return (
    <>
      <h2>Tanstack Query</h2>
      <div>{JSON.stringify(data)}</div>
    </>
  )
}

const UserData = () => {
  const [{ data, isPending, isError }] = useAtom(userAtom)

  if (isPending) return <div>Loading...</div>
  if (isError) return <div>Error</div>

  return (
    <>
      <h2>Jotai-Tanstack-Query</h2>
      <div>{JSON.stringify(data)}</div>
    </>
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
      <div>
        <button
          type="button"
          onClick={() =>
            queryClient.setQueryData(['users', id], (old: any) => {
              return {
                ...old,
                name: old.name + '🔄',
              }
            })
          }>
          Update User Data
        </button>
      </div>
    </>
  )
}

const App = () => (
  <>
    <QueryClientProvider client={queryClient}>
      <Provider>
        <Controls />
        <UserDataRawFetch />
        <UserData />
      </Provider>
    </QueryClientProvider>
  </>
)

export default App
