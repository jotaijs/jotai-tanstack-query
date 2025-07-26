# Jotai Query 🚀 👻

[jotai-tanstack-query](https://github.com/jotai-labs/jotai-tanstack-query) is a Jotai extension library for TanStack Query. It provides a wonderful interface with all of the TanStack Query features, providing you the ability to use those features in combination with your existing Jotai state.

# Table of contents

- [Support](#support)
- [Install](#install)
- [Incremental Adoption](#incremental-adoption)
- [Exported Functions](#exported-functions)
  - [atomWithQuery](#atomwithquery-usage)
  - [atomWithQueries](#atomwithqueries-usage)
  - [atomWithInfiniteQuery](#atomwithinfinitequery-usage)
  - [atomWithMutation](#atomwithmutation-usage)
  - [atomWithMutationState](#atomwithmutationstate-usage)
  - [Suspense](#suspense)
    - [atomWithSuspenseQuery](#atomwithsuspensequery-usage)
    - [atomWithSuspenseInfiniteQuery](#atomwithsuspenseinfinitequery-usage)
- [QueryClient Instance](#referencing-the-same-instance-of-query-client)
- [SSR Support](#ssr-support)
- [Error Handling](#error-handling)
- [Dev Tools](#devtools)
- [Migrate to v0.8.0](#migrate-to-v080)

### Support

jotai-tanstack-query currently supports TanStack Query v5.

### Install

In addition to `jotai`, you have to install `jotai-tanstack-query` and `@tanstack/query-core` to use the extension.

```bash
npm i jotai-tanstack-query @tanstack/query-core
```

### Incremental Adoption

You can incrementally adopt `jotai-tanstack-query` in your app. It's not an all or nothing solution. You just have to ensure you are using the same QueryClient instance. [same QueryClient](#referencing-the-same-instance-of-query-client).

```jsx
// existing useQueryHook
const { data, isPending, isError } = useQuery({
  queryKey: ['todos'],
  queryFn: fetchTodoList,
})

// jotai-tanstack-query
const todosAtom = atomWithQuery(() => ({
  queryKey: ['todos'],
}))

const [{ data, isPending, isError }] = useAtom(todosAtom)
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
import { atom, useAtom } from 'jotai'
import { atomWithQueries } from 'jotai-tanstack-query'

const userIdsAtom = atom([1, 2, 3])

const UsersData = () => {
  const [userIds] = useAtom(userIdsAtom)

  const userQueryAtoms = atomWithQueries({
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

  return (
    <div>
      {userQueryAtoms.map((queryAtom, index) => (
        <UserData key={index} queryAtom={queryAtom} />
      ))}
    </div>
  )
}

const UserData = ({ queryAtom }) => {
  const [{ data, isPending, isError }] = useAtom(queryAtom)

  if (isPending) return <div>Loading...</div>
  if (isError) return <div>Error</div>

  return (
    <div>
      {data.name} - {data.email}
    </div>
  )
}
```

#### Advanced usage - Combine multiple query results

```jsx
import { atom, useAtom } from 'jotai'
import { atomWithQueries } from 'jotai-tanstack-query'

const userIdsAtom = atom([1, 2, 3])

const CombinedUsersData = () => {
  const [userIds] = useAtom(userIdsAtom)

  const combinedUsersDataAtom = atomWithQueries({
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

  const [{ data, isPending, isError }] = useAtom(combinedUsersDataAtom)

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

```tsx
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
  const [{ mutate, status }] = useAtom(postAtom)
  return (
    <div>
      <button onClick={() => mutate({ title: 'foo' })}>Click me</button>
      <pre>{JSON.stringify(status, null, 2)}</pre>
    </div>
  )
}
```

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

### Referencing the same instance of Query Client

Perhaps you have some custom hooks in your project that utilizes the `useQueryClient()` hook to obtain the `QueryClient` object and call its methods.

To ensure that you reference the same `QueryClient` object, be sure to wrap the root of your project in a `<Provider>` and initialize `queryClientAtom` with the same `queryClient` value you provided to `QueryClientProvider`.

Without this step, `useQueryAtom` will reference a separate `QueryClient` from any hooks that utilize the `useQueryClient()` hook to get the queryClient.

Alternatively, you can specify your `queryClient` with `getQueryClient` parameter.

#### Example

In the example below, we have a mutation hook, `useTodoMutation` and a query `todosAtom`.

We included an initialization step in our root `<App>` node.

Although they reference methods same query key (`'todos'`), the `onSuccess` invalidation in `useTodoMutation` will not trigger **if the `Provider` initialization step was not done.**

This will result in `todosAtom` showing stale data as it was not prompted to refetch.

```jsx
import { Provider } from 'jotai/react'
import {
  useMutation,
  useQueryClient,
  QueryClient,
} from '@tanstack/react-query'
import { atomWithQuery, queryClientAtom } from 'jotai-tanstack-query'
import { QueryClientProvider } from 'jotai-tanstack-query/react'

const queryClient = new QueryClient()

export const Root = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <Provider>
        <App />
      </Provider>
    </QueryClientProvider>
  )
}

export const todosAtom = atomWithQuery(
  (get) => {
    return {
      queryKey: ["todos"],
      queryFn: () => fetch("/todos"),
    }
  },
  () => queryClient
)


export const useTodoMutation = () => {
  const queryClient = useQueryClient()

  return useMutation(
    async (body: todo) => {
      await fetch('/todo', { Method: 'POST', Body: body })
    },
    {
      onSuccess: () => {
        void queryClient.invalidateQueries(['todos'])
      },
      onError,
    }
  )
}
```

### SSR support

All atoms can be used within the context of a server side rendered app, such as a next.js app or Gatsby app. You can [use both options](https://tanstack.com/query/v5/docs/guides/ssr) that React Query supports for use within SSR apps, [hydration](https://tanstack.com/query/v5/docs/react/guides/ssr#using-the-hydration-apis) or [`initialData`](https://tanstack.com/query/v5/docs/react/guides/ssr#get-started-fast-with-initialdata).

### Error handling

Fetch error will be thrown and can be caught with ErrorBoundary.
Refetching may recover from a temporary error.

See [a working example](https://stackblitz.com/github/jotaijs/jotai-tanstack-query/tree/main/examples/09_error_boundary) to learn more.

### Devtools

In order to use the Devtools, you need to install it additionally.

```bash
$ npm i @tanstack/react-query-devtools --save-dev
```

All you have to do is put the `<ReactQueryDevtools />` within `<QueryClientProvider />`.

```tsx
import { QueryClient, QueryCache } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { QueryClientProvider } from 'jotai-tanstack-query/react'
import { queryClientAtom } from 'jotai-tanstack-query'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: Infinity,
    },
  },
})

export const Root = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <Provider>
        <App />
      </Provider>
      <ReactQueryDevtools />
    </QueryClientProvider>
  )
}
```

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
