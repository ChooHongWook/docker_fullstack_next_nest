'use client';

import { FileText } from 'lucide-react';
import { Post } from '@/lib/types';
import PostCard from './PostCard';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';

interface PostListProps {
  posts: Post[];
  isLoading?: boolean;
  onDelete?: (id: number) => void;
}

/**
 * PostList Component
 * Displays a responsive grid of PostCard components
 */
export default function PostList({ posts, isLoading, onDelete }: PostListProps) {
  // Loading skeleton
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, index) => (
          <Card key={index} className="animate-pulse">
            <CardHeader>
              <div className="h-6 bg-muted rounded mb-4"></div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="h-4 bg-muted rounded"></div>
                <div className="h-4 bg-muted rounded"></div>
                <div className="h-4 bg-muted rounded w-2/3"></div>
              </div>
              <div className="flex justify-between">
                <div className="h-4 bg-muted rounded w-1/4"></div>
                <div className="h-4 bg-muted rounded w-1/4"></div>
              </div>
            </CardContent>
            <CardFooter className="flex gap-2 pt-4 border-t">
              <div className="flex-1 h-10 bg-muted rounded"></div>
              <div className="flex-1 h-10 bg-muted rounded"></div>
              <div className="flex-1 h-10 bg-muted rounded"></div>
            </CardFooter>
          </Card>
        ))}
      </div>
    );
  }

  // Empty state
  if (!posts || posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <FileText className="w-24 h-24 text-muted-foreground/50 mb-4" strokeWidth={1.5} />
        <h3 className="text-xl font-semibold mb-2">No posts yet</h3>
        <p className="text-muted-foreground text-center max-w-md">
          Get started by creating your first post. Share your thoughts, ideas, and stories with the world!
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
