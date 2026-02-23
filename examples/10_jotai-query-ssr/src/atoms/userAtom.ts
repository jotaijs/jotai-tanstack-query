import { atomWithQuery } from 'jotai-tanstack-query'

export const userAtom = atomWithQuery(() => ({
  queryKey: ['user'],
  queryFn: async () => {
    const res = await fetch(
      'https://jsonplaceholder.typicode.com/users/1'
    )
    return res.json()
  },
}))


