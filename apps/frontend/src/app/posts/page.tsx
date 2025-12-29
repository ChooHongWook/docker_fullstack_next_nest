'use client';

import Link from 'next/link';
import { usePosts, useDeletePost } from '@/hooks/usePosts';
import PostList from '@/components/PostList';

export default function PostsPage() {
  const { posts, isLoading, isError } = usePosts();
  const deletePostMutation = useDeletePost();

  /**
   * Handle post deletion
   */
  const handleDelete = async (id: number) => {
    deletePostMutation.mutate(id);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">All Posts</h1>
            <p className="text-gray-600 mt-1">
              {posts && posts.length > 0
                ? `Showing ${posts.length} ${posts.length === 1 ? 'post' : 'posts'}`
                : 'No posts available'}
            </p>
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

        {/* Error Messages */}
        {isError && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
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
                {isError.message || 'Failed to load posts. Please try again.'}
              </p>
            </div>
          </div>
        )}

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
      </div>

      {/* Posts List */}
      <PostList
        posts={posts || []}
        isLoading={isLoading}
        onDelete={handleDelete}
      />
    </div>
  );
}
