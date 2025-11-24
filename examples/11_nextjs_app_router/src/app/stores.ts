import { atom } from 'jotai'
import { getPost } from './posts/[postId]/page'
import { atomWithQuery } from 'jotai-tanstack-query'

export const postIdAtom = atom<string>('1')
export const postQueryAtom = atomWithQuery((get) => ({
  queryKey: ['posts', get(postIdAtom)],
  queryFn: ({ queryKey: [, postId] }) => getPost(postId as string),
  staleTime: Infinity,
  refetchOnMount: false,
  refetchOnWindowFocus: false,
}))
