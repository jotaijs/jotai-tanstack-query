# Jotai Query 🚀 👻

[jotai-tanstack-query](https://github.com/jotai-labs/jotai-tanstack-query) is a Jotai extension library for TanStack Query. It provides a wonderful interface with all of the TanStack Query features, providing you the ability to use those features in combination with your existing Jotai state.

# Table of contents

- [Support](#support)
- [Install](#install)
- [Usage](#usage)
- [Incremental Adoption](#incremental-adoption)
- [Exported Provider](#exported-provider)
- [Exported Functions](#exported-functions)
  - [atomWithQuery](#atomwithquery-usage)
  - [atomWithQueries](#atomwithqueries-usage)
  - [atomWithInfiniteQuery](#atomwithinfinitequery-usage)
  - [atomWithMutation](#atomwithmutation-usage)
  - [atomWithMutationState](#atomwithmutationstate-usage)
  - [Suspense](#suspense)
    - [atomWithSuspenseQuery](#atomwithsuspensequery-usage)
    - [atomWithSuspenseInfiniteQuery](#atomwithsuspenseinfinitequery-usage)
- [SSR Support](#ssr-support)
  - [Next.js App Router Example](#nextjs-app-router-example)
- [Error Handling](#error-handling)
- [Dev Tools](#devtools)
- [FAQ](#faq)
- [Migrate to v0.8.0](#migrate-to-v080)

### Support

jotai-tanstack-query currently supports [Jotai v2](https://jotai.org) and [TanStack Query v5](https://tanstack.com/query/v5).

### Install

```bash
npm i jotai jotai-tanstack-query @tanstack/react-query
```

### Usage

```jsx
import { QueryClient } from '@tanstack/react-query'
import { useAtomValue } from 'jotai'
import { atomWithQuery } from 'jotai-tanstack-query'
import { QueryClientAtomProvider } from 'jotai-tanstack-query/react'

const queryClient = new QueryClient()

export const Root = () => {
  return (
    <QueryClientAtomProvider client={queryClient}>
      <App />
    </QueryClientAtomProvider>
  )
}

const todosAtom = atomWithQuery(() => ({
  queryKey: ['todos'],
  queryFn: fetchTodoList,
}))

const App = () => {
  const { data, isPending, isError } = useAtomValue(todosAtom)

  if (isPending) return <div>Loading...</div>
  if (isError) return <div>Error</div>

  return <div>{JSON.stringify(data)}</div>
}
```

### Incremental Adoption

You can incrementally adopt `jotai-tanstack-query` in your app. It's not an all or nothing solution. You just have to ensure you are using the [same QueryClient instance](#exported-provider).

```jsx
// TanStack/Query
const { data, isPending, isError } = useQuery({
  queryKey: ['todos'],
  queryFn: fetchTodoList,
})

// jotai-tanstack-query
const todosAtom = atomWithQuery(() => ({
  queryKey: ['todos'],
}))

const { data, isPending, isError } = useAtomValue(todosAtom)
```

### Exported provider

[![Open in StackBlitz](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/github/jotaijs/jotai-tanstack-query/tree/main/examples/08_query_client_atom_provider)

`QueryClientAtomProvider` is a ready-to-use wrapper that combines Jotai Provider and TanStack Query QueryClientProvider.

```jsx
import { QueryClient } from '@tanstack/react-query'
import { QueryClientAtomProvider } from 'jotai-tanstack-query/react'

const queryClient = new QueryClient()

export const Root = () => {
  return (
    <QueryClientAtomProvider client={queryClient}>
      <App />
    </QueryClientAtomProvider>
  )
}
```

Yes, you can absolutely combine them yourself.

```js
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Provider } from 'jotai/react'
import { queryClientAtom } from 'jotai-tanstack-query'
import { useHydrateAtoms } from 'jotai/react/utils'

const queryClient = new QueryClient()

const HydrateAtoms = ({ children }) => {
  useHydrateAtoms([[queryClientAtom, queryClient]])
  return children
}

export const Root = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <Provider>
        <HydrateAtoms>
          <App />
        </HydrateAtoms>
      </Provider>
    </QueryClientProvider>
  )
}
```

### Exported functions

- `atomWithQuery` for [useQuery](https://tanstack.com/query/v5/docs/react/reference/useQuery)
- `atomWithQueries` for [useQueries](https://tanstack.com/query/v5/docs/react/reference/useQueries)
- `atomWithInfiniteQuery` for [useInfiniteQuery](https://tanstack.com/query/v5/docs/react/reference/useInfiniteQuery)
- `atomWithMutation` for [useMutation](https://tanstack.com/query/v5/docs/react/reference/useMutation)
- `atomWithSuspenseQuery` for [useSuspenseQuery](https://tanstack.com/query/v5/docs/react/reference/useSuspenseQuery)
- `atomWithSuspenseInfiniteQuery` for [useSuspenseInfiniteQuery](https://tanstack.com/query/v5/docs/react/reference/useSuspenseInfiniteQuery)
- `atomWithMutationState` for [useMutationState](https://tanstack.com/query/v5/docs/react/reference/useMutationState)

All functions follow the same signature.

```ts
const dataAtom = atomWithSomething(getOptions, getQueryClient)
```

The first `getOptions` parameter is a function that returns an input to the observer.
The second optional `getQueryClient` parameter is a function that return [QueryClient](https://tanstack.com/query/v5/docs/reference/QueryClient).

### atomWithQuery usage

[![Open in StackBlitz](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/github/jotaijs/jotai-tanstack-query/tree/main/examples/01_query)

`atomWithQuery` creates a new atom that implements a standard [`Query`](https://tanstack.com/query/v5/docs/react/guides/queries) from TanStack Query.

```jsx
import { atom, useAtom } from 'jotai'
import { atomWithQuery } from 'jotai-tanstack-query'

const idAtom = atom(1)
const userAtom = atomWithQuery((get) => ({
  queryKey: ['users', get(idAtom)],
  queryFn: async ({ queryKey: [, id] }) => {
    const res = await fetch(`https://jsonplaceholder.typicode.com/users/${id}`)
    return res.json()
  },
}))

const UserData = () => {
  const [{ data, isPending, isError }] = useAtom(userAtom)

  if (isPending) return <div>Loading...</div>
  if (isError) return <div>Error</div>

  return <div>{JSON.stringify(data)}</div>
}
```

### atomWithQueries usage

[![Open in StackBlitz](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/github/jotaijs/jotai-tanstack-query/tree/main/examples/07_queries)

`atomWithQueries` creates a new atom that implements `Dynamic Parallel Queries` from TanStack Query. It allows you to run multiple queries concurrently and optionally combine their results. You can [read more about Dynamic Parallel Queries here](https://tanstack.com/query/v5/docs/framework/react/guides/parallel-queries#dynamic-parallel-queries-with-usequeries).

There are two ways to use `atomWithQueries`:

#### Basic usage - Returns an array of query atoms

```jsx
import { Atom, atom, useAtom } from 'jotai'
import { type AtomWithQueryResult, atomWithQueries } from 'jotai-tanstack-query'

const userIdsAtom = atom([1, 2, 3])

// Independent atom - encapsulates query logic
const userQueryAtomsAtom = atom((get) => {
  const userIds = get(userIdsAtom)
  return atomWithQueries({
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

// Independent UI component
const UserData = ({ queryAtom }: { queryAtom: Atom<AtomWithQueryResult> }) => {
  const [{ data, isPending, isError }] = useAtom(queryAtom)

  if (isPending) return <div>Loading...</div>
  if (isError) return <div>Error</div>
  if (!data) return null

  return (
    <div>
      {data.name} - {data.email}
    </div>
  )
}

// Component only needs one useAtom call
const UsersData = () => {
  const [userQueryAtoms] = useAtom(userQueryAtomsAtom)
  return (
    <div>
      {userQueryAtoms.map((queryAtom, index) => (
        <UserData key={index} queryAtom={queryAtom} />
      ))}
    </div>
  )
}
```

#### Advanced usage - Combine multiple query results

```jsx
import { Atom, atom, useAtom } from 'jotai'
import { atomWithQueries } from 'jotai-tanstack-query'

const userIdsAtom = atom([1, 2, 3])

// Independent atom - encapsulates combined query logic
const combinedUsersDataAtom = atom((get) => {
  const userIds = get(userIdsAtom)
  return atomWithQueries({
    queries: userIds.map((id) => () => ({
      queryKey: ['user', id],
      queryFn: async ({ queryKey: [, userId] }) => {
        const res = await fetch(
          `https://jsonplaceholder.typicode.com/users/${userId}`
        )
        return res.json()
      },
    })),
    combine: (results) => ({
      data: results.map((result) => result.data),
      isPending: results.some((result) => result.isPending),
      isError: results.some((result) => result.isError),
    }),
  })
})

// Component only needs one useAtom call
const CombinedUsersData = () => {
  const [combinedUsersDataAtomValue] = useAtom(combinedUsersDataAtom)
  const [{ data, isPending, isError }] = useAtom(combinedUsersDataAtomValue)

  if (isPending) return <div>Loading...</div>
  if (isError) return <div>Error</div>

  return (
    <div>
      {data.map((user) => (
        <div key={user.id}>
          {user.name} - {user.email}
        </div>
      ))}
    </div>
  )
}
```

### atomWithInfiniteQuery usage

[![Open in StackBlitz](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/github/jotaijs/jotai-tanstack-query/tree/main/examples/03_infinite)

`atomWithInfiniteQuery` is very similar to `atomWithQuery`, however it is for an `InfiniteQuery`, which is used for data that is meant to be paginated. You can [read more about Infinite Queries here](https://tanstack.com/query/v5/docs/guides/infinite-queries).

> Rendering lists that can additively "load more" data onto an existing set of data or "infinite scroll" is also a very common UI pattern. React Query supports a useful version of useQuery called useInfiniteQuery for querying these types of lists.

A notable difference between a standard query atom is the additional option `getNextPageParam` and `getPreviousPageParam`, which is what you'll use to instruct the query on how to fetch any additional pages.

```jsx
import { atom, useAtom } from 'jotai'
import { atomWithInfiniteQuery } from 'jotai-tanstack-query'

const postsAtom = atomWithInfiniteQuery(() => ({
  queryKey: ['posts'],
  queryFn: async ({ pageParam }) => {
    const res = await fetch(`https://jsonplaceholder.typicode.com/posts?_page=${pageParam}`)
    return res.json()
  },
  getNextPageParam: (lastPage, allPages, lastPageParam) => lastPageParam + 1,
  initialPageParam: 1,
}))

const Posts = () => {
  const [{ data, fetchNextPage, isPending, isError, isFetching }] =
    useAtom(postsAtom)

  if (isPending) return <div>Loading...</div>
  if (isError) return <div>Error</div>

  return (
    <>
      {data.pages.map((page, index) => (
        <div key={index}>
          {page.map((post: any) => (
            <div key={post.id}>{post.title}</div>
          ))}
        </div>
      ))}
      <button onClick={() => fetchNextPage()}>Next</button>
    </>
  )
}
```

### atomWithMutation usage

[![Open in StackBlitz](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/github/jotaijs/jotai-tanstack-query/tree/main/examples/05_mutation)

`atomWithMutation` creates a new atom that implements a standard [`Mutation`](https://tanstack.com/query/v5/docs/guides/mutations) from TanStack Query.

> Unlike queries, mutations are typically used to create/update/delete data or perform server side-effects.

`atomWithMutation` supports all options from TanStack Query's [`useMutation`](https://tanstack.com/query/v5/docs/react/reference/useMutation), including:

- `mutationKey` - A unique key for the mutation
- `mutationFn` - The function that performs the mutation
- `onMutate` - Called before the mutation is executed (useful for optimistic updates)
- `onSuccess` - Called when the mutation succeeds
- `onError` - Called when the mutation fails
- `onSettled` - Called when the mutation is settled (either success or error)
- `retry` - Number of retry attempts
- `retryDelay` - Delay between retries
- `gcTime` - Time until inactive mutations are garbage collected
- And all other [MutationOptions](https://tanstack.com/query/v5/docs/react/reference/useMutation#options)

#### Basic usage

```tsx
import { useAtom } from 'jotai/react'
import { atomWithMutation } from 'jotai-tanstack-query'

const postAtom = atomWithMutation(() => ({
  mutationKey: ['posts'],
  mutationFn: async ({ title }: { title: string }) => {
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
    return data
  },
}))

const Posts = () => {
  const [{ mutate, isPending, status }] = useAtom(postAtom)
  return (
    <div>
      <button onClick={() => mutate({ title: 'foo' })} disabled={isPending}>
        {isPending ? 'Creating...' : 'Create Post'}
      </button>
      <pre>{JSON.stringify(status, null, 2)}</pre>
    </div>
  )
}
```

#### Optimistic Updates

`atomWithMutation` fully supports optimistic updates through the `onMutate`, `onError`, and `onSettled` callbacks. This allows you to update the UI immediately before the server responds, and roll back if the mutation fails.

```tsx
import { Getter } from 'jotai'
import { useAtom } from 'jotai/react'
import {
  atomWithMutation,
  atomWithQuery,
  queryClientAtom,
} from 'jotai-tanstack-query'

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
    const res = await fetch(
      'https://jsonplaceholder.typicode.com/posts?_limit=5'
    )
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
  const [{ mutate, isPending }] = useAtom(postAtom)
  const [title, setTitle] = React.useState('')

  return (
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
        disabled={isPending}>
        {isPending ? 'Adding...' : 'Add Post'}
      </button>
    </div>
  )
}
```

For more details on optimistic updates, see the [TanStack Query Optimistic Updates guide](https://tanstack.com/query/v5/docs/framework/react/guides/optimistic-updates).

### atomWithMutationState usage

`atomWithMutationState` creates a new atom that gives you access to all mutations in the [`MutationCache`](https://tanstack.com/query/v5/docs/react/reference/useMutationState).

```jsx
const mutationStateAtom = atomWithMutationState((get) => ({
  filters: {
    mutationKey: ['posts'],
  },
}))
```

### Suspense

jotai-tanstack-query can also be used with React's Suspense.

### atomWithSuspenseQuery usage

[![Open in StackBlitz](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/github/jotaijs/jotai-tanstack-query/tree/main/examples/02_suspense)

```jsx
import { atom, useAtom } from 'jotai'
import { atomWithSuspenseQuery } from 'jotai-tanstack-query'

const idAtom = atom(1)
const userAtom = atomWithSuspenseQuery((get) => ({
  queryKey: ['users', get(idAtom)],
  queryFn: async ({ queryKey: [, id] }) => {
    const res = await fetch(`https://jsonplaceholder.typicode.com/users/${id}`)
    return res.json()
  },
}))

const UserData = () => {
  const [{ data }] = useAtom(userAtom)

  return <div>{JSON.stringify(data)}</div>
}
```

### atomWithSuspenseInfiniteQuery usage

[![Open in StackBlitz](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/github/jotaijs/jotai-tanstack-query/tree/main/examples/04_infinite_suspense)

```jsx
import { atom, useAtom } from 'jotai'
import { atomWithSuspenseInfiniteQuery } from 'jotai-tanstack-query'

const postsAtom = atomWithSuspenseInfiniteQuery(() => ({
  queryKey: ['posts'],
  queryFn: async ({ pageParam }) => {
    const res = await fetch(`https://jsonplaceholder.typicode.com/posts?_page=${pageParam}`)
    return res.json()
  },
  getNextPageParam: (lastPage, allPages, lastPageParam) => lastPageParam + 1,
  initialPageParam: 1,
}))

const Posts = () => {
  const [{ data, fetchNextPage, isPending, isError, isFetching }] =
    useAtom(postsAtom)

  return (
    <>
      {data.pages.map((page, index) => (
        <div key={index}>
          {page.map((post: any) => (
            <div key={post.id}>{post.title}</div>
          ))}
        </div>
      ))}
      <button onClick={() => fetchNextPage()}>Next</button>
    </>
  )
}
```

### SSR support

To understand if your application can benefit from React Query when also using Server Components, see the article [You Might Not Need React Query](https://tkdodo.eu/blog/you-might-not-need-react-query).

All atoms can be used within the context of a server side rendered app, such as a next.js app or Gatsby app. You can [use both options](https://tanstack.com/query/v5/docs/framework/react/guides/ssr) that React Query supports for use within SSR apps, [hydration](https://tanstack.com/query/v5/docs/framework/react/guides/ssr#using-the-hydration-apis) or [`initialData`](https://tanstack.com/query/v5/docs/framework/react/guides/ssr#get-started-fast-with-initialdata).

#### Next.js App Router Example

[![Open in StackBlitz](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/github/jotaijs/jotai-tanstack-query/tree/main/examples/11_nextjs_app_router)

### Error handling

Fetch error will be thrown and can be caught with ErrorBoundary.
Refetching may recover from a temporary error.

See [a working example](https://stackblitz.com/github/jotaijs/jotai-tanstack-query/tree/main/examples/09_error_boundary) to learn more.

### Devtools

In order to use the Devtools, you need to install it additionally.

```bash
$ npm i @tanstack/react-query-devtools --save-dev
```

All you have to do is put the `<ReactQueryDevtools />` within `<QueryClientAtomProvider />`.

```tsx
import { QueryClient, QueryCache } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { QueryClientAtomProvider } from 'jotai-tanstack-query/react'

const queryClient = new QueryClient()

export const Root = () => {
  return (
    <QueryClientAtomProvider client={queryClient}>
      <App />
      <ReactQueryDevtools />
    </QueryClientAtomProvider>
  )
}
```

## FAQ

### atomsWithQuery `queryKey` type is always `unknown`?

Explicitly declare the `get:Getter` to get proper type inference for `queryKey`.

```tsx
import { Getter } from 'jotai'

// ❌ Without explicit Getter type, queryKey type might be unknown
const userAtom = atomWithQuery((get) => ({
  queryKey: ['users', get(idAtom).toString()],
  queryFn: async ({ queryKey: [, id] }) => {
    // typeof id = unknown
  },
}))

// ✅ With explicit Getter type, queryKey gets proper type inference
const userAtom = atomWithQuery((get: Getter) => ({
  queryKey: ['users', get(idAtom).toString()],
  queryFn: async ({ queryKey: [, id] }) => {
    // typeof id = string
  },
}))
```

### Why “tracked properties” are not supported

TanStack Query provides a feature called [tracked properties](https://tanstack.com/query/v5/docs/framework/react/guides/render-optimizations#tracked-properties), which only triggers a re-render when a property that was actually accessed changes.

For example:

```tsx
const { data } = useQuery(...)
```

If only data is accessed, changes to isFetching or status will not cause a re-render.

However, atomWithQuery intentionally does **not** implement this behavior.

The atom approach is to create derived atoms rather than automatic tracking.

```js
const queryAtom = atomWithQuery(...)

const dataAtom = atom((get) => get(queryAtom).data)

const Component = () => {
  const data = useAtomValue(dataAtom)
  ...
}
```

The component only subscribes to data, changes to other properties (e.g. isFetching) won’t trigger re-renders


## Migrate to v0.8.0

### Change in atom signature

All atom signatures have changed to be more consistent with TanStack Query.
v0.8.0 returns only a single atom, instead of a tuple of atoms, and hence the name change from `atomsWithSomething` to`atomWithSomething`.

```diff

- const [dataAtom, statusAtom] = atomsWithSomething(getOptions, getQueryClient)
+ const dataAtom = atomWithSomething(getOptions, getQueryClient)

```

### Simplified Return Structure

In the previous version of `jotai-tanstack-query`, the query atoms `atomsWithQuery` and `atomsWithInfiniteQuery` returned a tuple of atoms: `[dataAtom, statusAtom]`. This design separated the data and its status into two different atoms.

#### atomWithQuery and atomWithInfiniteQuery

- `dataAtom` was used to access the actual data (`TData`).
- `statusAtom` provided the status object (`QueryObserverResult<TData, TError>`), which included additional attributes like `isPending`, `isError`, etc.

In v0.8.0, they have been replaced by `atomWithQuery` and `atomWithInfiniteQuery` to return only a single `dataAtom`. This `dataAtom` now directly provides the `QueryObserverResult<TData, TError>`, aligning it closely with the behavior of Tanstack Query's bindings.

To migrate to the new version, replace the separate `dataAtom` and `statusAtom` usage with the unified `dataAtom` that now contains both data and status information.

```diff
- const [dataAtom, statusAtom] = atomsWithQuery(/* ... */);
- const [data] = useAtom(dataAtom);
- const [status] = useAtom(statusAtom);

+ const dataAtom = atomWithQuery(/* ... */);
+ const [{ data, isPending, isError }] = useAtom(dataAtom);
```

#### atomWithMutation

Similar to `atomsWithQuery` and `atomsWithInfiniteQuery`, `atomWithMutation` also returns a single atom instead of a tuple of atoms. The return type of the atom value is `MutationObserverResult<TData, TError, TVariables, TContext>`.

```diff

- const [, postAtom] = atomsWithMutation(/* ... */);
- const [post, mutate] = useAtom(postAtom); // Accessing mutation status from post; and mutate() to execute the mutation

+ const postAtom = atomWithMutation(/* ... */);
+ const [{ data, error, mutate }] = useAtom(postAtom); // Accessing mutation result and mutate method from the same atom

```
