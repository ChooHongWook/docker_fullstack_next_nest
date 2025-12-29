'use client';

import { useRouter } from 'next/navigation';
import { postsApi } from '@/lib/api';
import PostForm from '@/components/PostForm';
import { PostFormData } from '@/lib/types';

export default function NewPostPage() {
  const router = useRouter();

  /**
   * Handle post creation
   */
  const handleSubmit = async (data: PostFormData) => {
    // Convert form data to CreatePostDto
    const createData = {
      title: data.title,
      content: data.content,
      author: data.author || undefined,
    };

    // Create post via API
    await postsApi.create(createData);

    // Navigate to posts list on success
    router.push('/posts');
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Create New Post
        </h1>
        <p className="text-gray-600">
          Share your thoughts, ideas, and stories with the world.
        </p>
      </div>

      {/* Breadcrumbs */}
      <nav className="mb-6 flex items-center space-x-2 text-sm text-gray-500">
        <a href="/" className="hover:text-primary-600">
          Home
        </a>
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
        <a href="/posts" className="hover:text-primary-600">
          Posts
        </a>
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
        <span className="text-gray-900 font-medium">New</span>
      </nav>

      {/* Form Card */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-8">
        <PostForm onSubmit={handleSubmit} submitLabel="Create Post" />
      </div>

      {/* Help Text */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-md p-4">
        <div className="flex items-start">
          <svg
            className="w-5 h-5 text-blue-600 mt-0.5 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div className="text-sm text-blue-700">
            <p className="font-medium mb-1">Tips for creating a great post:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Use a clear and descriptive title</li>
              <li>Write engaging and well-structured content</li>
              <li>Add your name as the author to get credit</li>
              <li>Review your post before submitting</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
