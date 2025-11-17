import React from 'react'
import { useAtom } from 'jotai/react'
import { atomWithMutation, atomWithQuery, queryClientAtom } from 'jotai-tanstack-query'

interface Post {
  id: number
  title: string
  body: string
  userId: number
}

interface NewPost {
  title: string
}

interface OptimisticContext {
  previousPosts: Post[] | undefined
}

// Query to fetch posts list
const postsQueryAtom = atomWithQuery(() => ({
  queryKey: ['posts'],
  queryFn: async () => {
    const res = await fetch('https://jsonplaceholder.typicode.com/posts?_limit=5')
    return res.json() as Promise<Post[]>
  },
}))

// Mutation with optimistic updates
const postAtom = atomWithMutation<Post, NewPost, Error, OptimisticContext>(
  (get) => {
    const queryClient = get(queryClientAtom)
    return {
      mutationKey: ['addPost'],
      mutationFn: async ({ title }: NewPost) => {
        // Randomly fail for testing error handling (30% failure rate)
        if (Math.random() < 0.3) {
          throw new Error('Randomly simulated API error')
        }

        const res = await fetch(`https://jsonplaceholder.typicode.com/posts`, {
          method: 'POST',
          body: JSON.stringify({
            title,
            body: 'body',
            userId: 1,
          }),
          headers: {
            'Content-type': 'application/json; charset=UTF-8',
          },
        })
        const data = await res.json()
        return data as Post
      },
      // When mutate is called:
      onMutate: async (newPost: NewPost) => {
        // Cancel any outgoing refetches
        // (so they don't overwrite our optimistic update)
        await queryClient.cancelQueries({ queryKey: ['posts'] })

        // Snapshot the previous value
        const previousPosts = queryClient.getQueryData<Post[]>(['posts'])

        // Optimistically update to the new value
        queryClient.setQueryData<Post[]>(['posts'], (old) => {
          const optimisticPost: Post = {
            id: Date.now(), // Temporary ID
            title: newPost.title,
            body: 'body',
            userId: 1,
          }
          return old ? [...old, optimisticPost] : [optimisticPost]
        })

        // Return a result with the snapshotted value
        return { previousPosts }
      },
      // If the mutation fails, use the result returned from onMutate to roll back
      onError: (
        _err: Error,
        _newPost: NewPost,
        onMutateResult: OptimisticContext | undefined
      ) => {
        console.debug('onError', onMutateResult)
        if (onMutateResult?.previousPosts) {
          queryClient.setQueryData(['posts'], onMutateResult.previousPosts)
        }
      },
      // Always refetch after error or success:
      onSettled: (
        _data: Post | undefined,
        _error: Error | null,
        _variables: NewPost,
        _onMutateResult: OptimisticContext | undefined
      ) => {
        queryClient.invalidateQueries({ queryKey: ['posts'] })
      },
    }
  }
)

const PostsList = () => {
  const [{ data: posts, isPending }] = useAtom(postsQueryAtom)

  if (isPending) return <div>Loading posts...</div>

  return (
    <div>
      <h3>Posts:</h3>
      <ul>
        {posts?.map((post: Post) => (
          <li key={post.id}>{post.title}</li>
        ))}
      </ul>
    </div>
  )
}

const AddPost = () => {
  const [{ mutate, isPending, status }] = useAtom(postAtom)
  const [title, setTitle] = React.useState('')

  return (
    <div>
      <div>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter post title"
        />
        <button
          onClick={() => {
            if (title) {
              mutate({ title })
              setTitle('')
            }
          }}
          disabled={isPending}
        >
          {isPending ? 'Adding...' : 'Add Post'}
        </button>
      </div>
      <div>
        <strong>Status:</strong> {status}
      </div>
    </div>
  )
}

const App = () => (
  <>
    <h2>atomWithMutation with optimistic updates</h2>
    <PostsList />
    <AddPost />
  </>
)

export default App
