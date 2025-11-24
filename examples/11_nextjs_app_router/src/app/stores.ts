import { atom } from 'jotai'
import { atomWithQuery } from 'jotai-tanstack-query'
import { getPost } from './api'

export const postIdAtom = atom<string>('1')
export const postQueryAtom = atomWithQuery((get) => ({
  queryKey: ['posts', get(postIdAtom)],
  queryFn: ({ queryKey: [, postId] }) => getPost(postId as string),
  staleTime: Infinity,
  refetchOnMount: false,
  refetchOnWindowFocus: false,
}))
