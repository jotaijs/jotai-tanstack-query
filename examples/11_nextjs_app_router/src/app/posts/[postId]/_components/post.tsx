'use client'

import { useQuery } from '@tanstack/react-query'
import { getPost } from '../page'
import Link from 'next/link'

export const Post = ({ postId }: { postId: string }) => {
  const { data, isPending, isError } = useQuery({
    queryKey: ['posts', postId],
    queryFn: ({ queryKey: [, postId] }) => getPost(postId as string),
  })
  if (isPending) return <div>Loading...</div>
  if (isError) return <div>Error</div>
  return (
    <div>
      <Link href="/posts">Back to posts</Link>
      <div>ID: {data?.id}</div>
      <h1>Title: {data?.title}</h1>
      <div>Body: {data?.body}</div>

      <div>
        <Link href={`/posts/${Number(postId) + 1}`}>Next post</Link>
      </div>
    </div>
  )
}
