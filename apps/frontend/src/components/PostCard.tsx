'use client';

import Link from 'next/link';
import { User, Calendar } from 'lucide-react';
import { Post } from '@/lib/types';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface PostCardProps {
  post: Post;
  onDelete?: (id: number) => void;
}

/**
 * PostCard Component
 * Displays a single post in a card format with actions
 */
export default function PostCard({ post, onDelete }: PostCardProps) {
  const handleDelete = () => {
    if (onDelete && confirm('Are you sure you want to delete this post?')) {
      onDelete(post.id);
    }
  };

  // Truncate content for preview (max 150 characters)
  const truncateContent = (content: string, maxLength: number = 150) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength).trim() + '...';
  };

  // Format date to readable string
  const formatDate = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <Card className="hover:shadow-lg transition-shadow duration-300">
      <CardHeader>
        <CardTitle className="line-clamp-2">{post.title}</CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Post Content Preview */}
        <p className="text-muted-foreground line-clamp-3">
          {truncateContent(post.content)}
        </p>

        {/* Post Metadata */}
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center space-x-2">
            <User className="w-4 h-4" />
            <span>{post.author || 'Anonymous'}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4" />
            <span>{formatDate(post.createdAt)}</span>
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex gap-2 pt-4 border-t">
        <Button asChild variant="default" className="flex-1">
          <Link href={`/posts/${post.id}`}>View</Link>
        </Button>
        <Button asChild variant="secondary" className="flex-1">
          <Link href={`/posts/${post.id}/edit`}>Edit</Link>
        </Button>
        {onDelete && (
          <Button
            onClick={handleDelete}
            variant="destructive"
            className="flex-1"
            aria-label="Delete post"
          >
            Delete
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
