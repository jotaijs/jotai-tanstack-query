import Link from 'next/link'

export default function PostsPage() {
  return (
    <div>
      Posts
      <div>
        <Link href="/posts/1">Post 1</Link>
        <br />
        <Link href="/posts/2">Post 2</Link>
        <br />
        <Link href="/posts/3">Post 3</Link>
        <br />
        <Link href="/posts/4">Post 4</Link>
        <br />
        <Link href="/posts/5">Post 5</Link>
        <br />
        <Link href="/posts/6">Post 6</Link>
        <br />
        <Link href="/posts/7">Post 7</Link>
        <br />
        <Link href="/posts/8">Post 8</Link>
        <br />
        <Link href="/posts/9">Post 9</Link>
        <br />
        <Link href="/posts/10">Post 10</Link>
      </div>
    </div>
  )
}
