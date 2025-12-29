'use client';

import { FileText } from 'lucide-react';
import { Post } from '@/lib/types';
import PostCard from './PostCard';

interface PostListProps {
  posts: Post[];
  onDelete?: (id: number) => void;
}

/**
 * PostList Component
 * Pure presentational component - displays a responsive grid of PostCard components
 * Assumes data is always available (used within Suspense boundary)
 */
export default function PostList({ posts, onDelete }: PostListProps) {
  // Empty state
  if (!posts || posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <FileText
          className="w-24 h-24 text-muted-foreground/50 mb-4"
          strokeWidth={1.5}
        />
        <h3 className="text-xl font-semibold mb-2">No posts yet</h3>
        <p className="text-muted-foreground text-center max-w-md">
          Get started by creating your first post. Share your thoughts, ideas,
          and stories with the world!
        </p>
      </div>
    );
  }

  // Posts grid
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {posts.map((post) => (
        <PostCard key={post.id} post={post} onDelete={onDelete} />
      ))}
    </div>
  );
}
