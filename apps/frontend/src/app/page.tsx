import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Hero Section */}
      <div className="text-center mb-16">
        <h1 className="text-5xl font-bold text-gray-900 mb-4">
          Welcome to Posts App
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
          A modern, full-stack CRUD application built with Next.js 14,
          TypeScript, and NestJS. Create, read, update, and delete posts with
          ease.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link
            href="/posts"
            className="bg-primary-600 text-white hover:bg-primary-700 px-8 py-3 rounded-lg text-lg font-medium transition-colors shadow-md hover:shadow-lg"
          >
            View All Posts
          </Link>
          <Link
            href="/posts/new"
            className="bg-white text-primary-600 border-2 border-primary-600 hover:bg-primary-50 px-8 py-3 rounded-lg text-lg font-medium transition-colors shadow-md hover:shadow-lg"
          >
            Create New Post
          </Link>
        </div>
      </div>

      {/* Features Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mt-12">
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
            <svg
              className="w-6 h-6 text-primary-600"
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
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Create Posts
          </h3>
          <p className="text-gray-600">
            Easily create new posts with a user-friendly form and real-time
            validation.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
            <svg
              className="w-6 h-6 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            View Posts
          </h3>
          <p className="text-gray-600">
            Browse through all posts in a beautiful, responsive grid layout.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mb-4">
            <svg
              className="w-6 h-6 text-yellow-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Edit Posts
          </h3>
          <p className="text-gray-600">
            Update your posts anytime with an intuitive editing interface.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4">
            <svg
              className="w-6 h-6 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Delete Posts
          </h3>
          <p className="text-gray-600">
            Remove posts with confirmation to keep your content organized.
          </p>
        </div>
      </div>

      {/* Tech Stack Section */}
      <div className="mt-16 bg-gradient-to-r from-primary-50 to-blue-50 rounded-xl p-8 border border-primary-100">
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">
          Built with Modern Technologies
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div>
            <div className="text-3xl font-bold text-primary-600 mb-1">
              Next.js 14
            </div>
            <div className="text-sm text-gray-600">App Router</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-primary-600 mb-1">
              TypeScript
            </div>
            <div className="text-sm text-gray-600">Type Safety</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-primary-600 mb-1">
              Tailwind CSS
            </div>
            <div className="text-sm text-gray-600">Styling</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-primary-600 mb-1">
              NestJS
            </div>
            <div className="text-sm text-gray-600">Backend API</div>
          </div>
        </div>
      </div>
    </div>
  );
}
