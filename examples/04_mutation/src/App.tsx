import React from 'react'
import { useAtom } from 'jotai'
import { atomsWithTanstackMutation } from 'jotai-tanstack-query'

const [, statusAtom] = atomsWithTanstackMutation(() => ({
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
  const [status, dispatch] = useAtom(statusAtom)
  return (
    <div>
      <button onClick={() => dispatch([{ title: 'foo' }])}>Click me</button>
      <pre>{JSON.stringify(status, null, 2)}</pre>
    </div>
  )
}

const App = () => (
  <>
    <Posts />
  </>
)

export default App
