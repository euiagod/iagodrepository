import { TopBar } from '../components/TopBar'
import { PostCard } from '../components/PostCard'
import { posts, profiles, cars } from '../data/mock'

export function Feed() {
  return (
    <div className="mx-auto max-w-md">
      <TopBar title="Garagem+" right={<span className="text-2xl">🔔</span>} />
      <div>
        {posts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            author={profiles.find((p) => p.id === post.authorId)!}
            car={cars.find((c) => c.id === post.carId)}
          />
        ))}
      </div>
    </div>
  )
}
