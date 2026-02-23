'use client'

import { useAtom } from 'jotai'
import { userAtom } from '../atoms/userAtom'

export default function UserClient() {
  const [{data}] = useAtom(userAtom)

  return (
    <div style={{ padding: 20 }}>
      <h1>SSR with Jotai + TanStack Query</h1>
      <p>
        <strong>Name:</strong> {data?.name}
      </p>
      <p>
        <strong>Email:</strong> {data?.email}
      </p>
      <p>
        <strong>Website:</strong> {data?.website}
      </p>
    </div>
  )
}

