'use client';

import React from 'react';
import Link from 'next/link';
import { ApiErrorException } from '@/lib/api';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | ApiErrorException | null;
}

/**
 * ErrorBoundary Component
 * Catches errors from child components and displays fallback UI
 * Must be used as outer wrapper with Suspense as inner wrapper
 */
export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(
    error: Error | ApiErrorException,
  ): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(
    error: Error | ApiErrorException,
    errorInfo: React.ErrorInfo,
  ) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    if (error instanceof ApiErrorException) {
      console.error('API Error Details:', {
        statusCode: error.statusCode,
        errorType: error.error,
      });
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return <DefaultErrorFallback error={this.state.error} />;
    }

    return this.props.children;
  }
}

/**
 * Default Error Fallback Component
 */
function DefaultErrorFallback({
  error,
}: {
  error: Error | ApiErrorException | null;
}) {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-red-50 border border-red-200 rounded-md p-8 text-center">
        <svg
          className="w-16 h-16 text-red-400 mx-auto mb-4"
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
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Something went wrong
        </h2>
        <p className="text-gray-600 mb-6">
          {error?.message || 'An unexpected error occurred. Please try again.'}
        </p>
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => window.location.reload()}
            className="bg-primary-600 text-white hover:bg-primary-700 px-6 py-2 rounded-md font-medium transition-colors"
          >
            Retry
          </button>
          <Link
            href="/"
            className="bg-white text-primary-600 border-2 border-primary-600 hover:bg-primary-50 px-6 py-2 rounded-md font-medium transition-colors"
          >
            Go Home
          </Link>
        </div>
      </div>
    </div>
  );
}

/**
 * Posts List Error Fallback
 */
export function PostsErrorFallback() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-red-50 border border-red-200 rounded-md p-8 text-center">
        <svg
          className="w-16 h-16 text-red-400 mx-auto mb-4"
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
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Failed to load posts
        </h2>
        <p className="text-gray-600 mb-6">
          Unable to fetch posts from the server. Please try again.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="bg-primary-600 text-white hover:bg-primary-700 px-6 py-2 rounded-md font-medium transition-colors"
        >
          Retry
        </button>
      </div>
    </div>
  );
}

/**
 * Post Detail Error Fallback
 */
export function PostDetailErrorFallback() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-red-50 border border-red-200 rounded-md p-8 text-center">
        <svg
          className="w-16 h-16 text-red-400 mx-auto mb-4"
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
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Post Not Found
        </h2>
        <p className="text-gray-600 mb-6">
          The post you are looking for does not exist or has been deleted.
        </p>
        <Link
          href="/posts"
          className="inline-block bg-primary-600 text-white hover:bg-primary-700 px-6 py-2 rounded-md font-medium transition-colors"
        >
          Back to Posts
        </Link>
      </div>
    </div>
  );
}
