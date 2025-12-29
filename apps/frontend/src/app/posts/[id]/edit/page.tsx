'use client';

import { Suspense } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useSuspensePost } from '@/hooks/usePosts';
import PostForm from '@/components/PostForm';
import {
  ErrorBoundary,
  PostDetailErrorFallback,
} from '@/components/ErrorBoundary';

/**
 * Edit Form Skeleton - Loading fallback for Suspense
 */
function EditFormSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
      <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>

      {/* Breadcrumbs skeleton */}
      <div className="h-4 bg-gray-200 rounded w-1/3 mb-6"></div>

      {/* Form skeleton */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-8">
        <div className="space-y-6">
          <div>
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
          </div>
          <div>
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
          <div>
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>

      {/* Info section skeleton */}
      <div className="mt-6 bg-gray-100 rounded-md p-4">
        <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
      </div>
    </div>
  );
}

/**
 * Edit Post Content - Data fetching component
 * MUST be wrapped with ErrorBoundary > Suspense
 */
function EditPostContent({ id }: { id: string }) {
  const { post, handleSubmit } = useSuspensePost(id);

  return (
    <>
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Edit Post</h1>
        <p className="text-gray-600">
          Update your post content, title, or author information.
        </p>
      </div>

      {/* Breadcrumbs */}
      <nav className="mb-6 flex items-center space-x-2 text-sm text-gray-500">
        <Link href="/" className="hover:text-primary-600">
          Home
        </Link>
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5l7 7-7 7"
          />
        </svg>
        <Link href="/posts" className="hover:text-primary-600">
          Posts
        </Link>
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5l7 7-7 7"
          />
        </svg>
        <Link
          href={`/posts/${post.id}`}
          className="hover:text-primary-600 truncate max-w-xs"
        >
          {post.title}
        </Link>
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5l7 7-7 7"
          />
        </svg>
        <span className="text-gray-900 font-medium">Edit</span>
      </nav>

      {/* Form Card */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-8">
        <PostForm
          initialData={{
            title: post.title,
            content: post.content,
            author: post.author || '',
          }}
          onSubmit={handleSubmit}
          submitLabel="Update Post"
        />
      </div>

      {/* Info Section */}
      <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-md p-4">
        <div className="flex items-start">
          <svg
            className="w-5 h-5 text-yellow-600 mt-0.5 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <div className="text-sm text-yellow-700">
            <p className="font-medium mb-1">Note:</p>
            <p>
              Changes will be saved immediately when you click &quot;Update
              Post&quot;. Make sure to review your changes before submitting.
            </p>
          </div>
        </div>
      </div>

      {/* Post Metadata */}
      <div className="mt-6 bg-gray-50 border border-gray-200 rounded-md p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-2">
          Post Information
        </h3>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
          <div>
            <dt className="text-gray-500">Post ID:</dt>
            <dd className="text-gray-900 font-medium">{post.id}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Created:</dt>
            <dd className="text-gray-900 font-medium">
              {new Date(post.createdAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
            </dd>
          </div>
          <div>
            <dt className="text-gray-500">Last Updated:</dt>
            <dd className="text-gray-900 font-medium">
              {new Date(post.updatedAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
            </dd>
          </div>
        </dl>
      </div>
    </>
  );
}

/**
 * Edit Post Page - Page-level component with proper boundary structure
 */
export default function EditPostPage() {
  const params = useParams();
  const id = params.id as string;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <ErrorBoundary fallback={<PostDetailErrorFallback />}>
        <Suspense fallback={<EditFormSkeleton />}>
          <EditPostContent id={id} />
        </Suspense>
      </ErrorBoundary>
    </div>
  );
}
