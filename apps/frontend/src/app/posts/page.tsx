'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { useSuspensePosts, useDeletePost } from '@/hooks/usePosts';
import PostList from '@/components/PostList';
import { ErrorBoundary, PostsErrorFallback } from '@/components/ErrorBoundary';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from '@/components/ui/card';

/**
 * Posts List Skeleton - Loading fallback for Suspense
 */
function PostsListSkeleton() {
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

/**
 * Posts Content - Data fetching component
 * MUST be wrapped with ErrorBoundary > Suspense
 */
function PostsContent() {
  const { posts } = useSuspensePosts();
  const deletePostMutation = useDeletePost();

  /**
   * Handle post deletion
   */
  const handleDelete = async (id: number) => {
    deletePostMutation.mutate(id);
  };

  return (
    <>
      {/* Delete Error Message */}
      {deletePostMutation.isError && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <svg
                className="w-5 h-5 text-red-600 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="text-sm text-red-600">
                {deletePostMutation.error?.message || 'Failed to delete post'}
              </p>
            </div>
            <button
              onClick={() => deletePostMutation.reset()}
              className="text-red-600 hover:text-red-800"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Posts List */}
      <PostList posts={posts} onDelete={handleDelete} />
    </>
  );
}

/**
 * Posts Page - Page-level component with proper boundary structure
 */
export default function PostsPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">All Posts</h1>
            <p className="text-gray-600 mt-1">Browse all posts</p>
          </div>
          <Link
            href="/posts/new"
            className="bg-primary-600 text-white hover:bg-primary-700 px-6 py-3 rounded-md font-medium transition-colors shadow-md hover:shadow-lg flex items-center gap-2"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Create New Post
          </Link>
        </div>
      </div>

      {/* ErrorBoundary > Suspense > Data Component */}
      <ErrorBoundary fallback={<PostsErrorFallback />}>
        <Suspense fallback={<PostsListSkeleton />}>
          <PostsContent />
        </Suspense>
      </ErrorBoundary>
    </div>
  );
}
