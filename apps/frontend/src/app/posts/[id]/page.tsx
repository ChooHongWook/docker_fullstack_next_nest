'use client';

import { useParams } from 'next/navigation';

import { PostContent } from './component/post-content';

/**
 * View Post Page - Page-level component with proper boundary structure
 */
export default function ViewPostPage() {
  const params = useParams();
  const id = params.id as string;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <PostContent id={id} />
    </div>
  );
}
