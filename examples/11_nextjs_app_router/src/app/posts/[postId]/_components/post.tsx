'use client'

import Link from 'next/link'
import { useAtomValue, useSetAtom } from 'jotai'
import { postIdAtom, postQueryAtom } from '../../../stores'
import { useEffect } from 'react'

export const Post = ({ postId }: { postId: string }) => {
  const setPostIdValue = useSetAtom(postIdAtom)
  useEffect(() => {
    setPostIdValue(postId)
  }, [postId, setPostIdValue])

  const { data, isPending, isError, refetch } = useAtomValue(postQueryAtom)
  if (isPending) return <div>Loading...</div>
  if (isError) return <div>Error</div>
  return (
    <div>
      <Link href="/posts">Back to posts</Link>
      <div>ID: {data?.id}</div>
      <h1>Title: {data?.title}</h1>
      <div>Body: {data?.body}</div>

      <div style={{ marginTop: '1rem' }}>
        <button onClick={() => refetch()}>
          Refetch post - only client-side
        </button>
      </div>

      <div style={{ marginTop: '1rem' }}>
        <Link href={`/posts/${Number(postId) + 1}`}>
          Next post - only server-side
        </Link>
      </div>
    </div>
  )
}
