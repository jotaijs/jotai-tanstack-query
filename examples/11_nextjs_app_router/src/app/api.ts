export async function getPost(postId: string) {
  console.debug('getPost called with postId:', postId)
  const res = await fetch(
    `https://jsonplaceholder.typicode.com/posts/${postId}`
  )
  return res.json()
}
