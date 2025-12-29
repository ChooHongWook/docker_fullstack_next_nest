/**
 * Post Detail Skeleton - Loading fallback for Suspense
 */
export function PostDetailSkeleton() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="animate-pulse">
        {/* Breadcrumbs skeleton */}
        <div className="h-4 bg-gray-200 rounded w-1/3 mb-6"></div>

        {/* Post card skeleton */}
        <article className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
          <div className="px-8 py-6 border-b border-gray-200 bg-gradient-to-r from-primary-50 to-blue-50">
            <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div className="flex items-center space-x-4">
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            </div>
          </div>
          <div className="px-8 py-6">
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-full"></div>
              <div className="h-4 bg-gray-200 rounded w-full"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            </div>
          </div>
          <div className="px-8 py-6 bg-gray-50 border-t border-gray-200">
            <div className="flex justify-between">
              <div className="h-10 bg-gray-200 rounded w-32"></div>
              <div className="flex gap-4">
                <div className="h-10 bg-gray-200 rounded w-24"></div>
                <div className="h-10 bg-gray-200 rounded w-24"></div>
              </div>
            </div>
          </div>
        </article>
      </div>
    </div>
  );
}
