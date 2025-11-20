# Jotai + TanStack Query SSR Example

This example demonstrates how to use [Jotai](https://jotai.org/) with [TanStack Query](https://tanstack.com/query) for Server-Side Rendering (SSR) in a Next.js App Router application.


## Getting Started

### Installation

```bash
npm install
# or
yarn install
# or
pnpm install
```

### Run Development Server

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### Build for Production

```bash
npm run build
npm start
```

## How It Works

### 1. Server Component Prefetching (`app/page.tsx`)

The server component prefetches data using TanStack Query's `QueryClient`:

```typescript
async function getDehydratedState() {
  const queryClient = new QueryClient()
  
  await queryClient.prefetchQuery({
    queryKey: ['user'],
    queryFn: async () => {
      const res = await fetch('https://jsonplaceholder.typicode.com/users/1')
      return res.json()
    },
  })
  
  return dehydrate(queryClient)
}
```

### 2. Jotai Atom with TanStack Query (`atoms/userAtom.ts`)

The atom is created using `atomWithQuery` from `jotai-tanstack-query`:

```typescript
export const userAtom = atomWithQuery(() => ({
  queryKey: ['user'],
  queryFn: async () => {
    const res = await fetch('https://jsonplaceholder.typicode.com/users/1')
    return res.json()
  },
}))
```

### 3. Provider Setup (`app/providers.tsx`)

Both QueryClientProvider and JotaiProvider wrap the application:

```typescript
<QueryClientProvider client={queryClient}>
  <JotaiProvider>{children}</JotaiProvider>
</QueryClientProvider>
```

### 4. Client Component Consumption (`app/user-client.tsx`)

The client component reads from the Jotai atom, which automatically uses the hydrated TanStack Query data:

```typescript
const [{data}] = useAtom(userAtom)
```
For additional parameters
```typescript
const [{ data, isLoading, error}] = useAtom(userAtom)
```


### SSR Flow

1. **Server**: Next.js server component prefetches data using TanStack Query
2. **Server**: Data is dehydrated and passed to `HydrationBoundary`
3. **Client**: QueryClient hydrates the prefetched data
4. **Client**: Jotai atom (via `atomWithQuery`) reads from the hydrated TanStack Query cache
5. **Result**: No loading state, data is immediately available on first render


