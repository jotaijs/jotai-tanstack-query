// app/posts/[postId]/page.tsx
import {
  HydrationBoundary,
  QueryClient,
  dehydrate,
} from '@tanstack/react-query'
import { Post } from './_components/post'
import { getPost } from '@/app/api'

export default async function PostPage({
  params,
}: {
  params: Promise<{ postId: string }>
}) {
  const { postId } = await params
  const queryClient = new QueryClient()

  await queryClient.prefetchQuery({
    queryKey: ['posts', postId],
    queryFn: ({ queryKey: [, postId] }) => getPost(postId as string),
  })

  return (
    // Neat! Serialization is now as easy as passing props.
    // HydrationBoundary is a Client Component, so hydration will happen there.
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Post postId={postId} />
    </HydrationBoundary>
  )
}
