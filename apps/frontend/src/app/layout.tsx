import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Link from 'next/link';
import { QueryProvider } from '@/providers/QueryProvider';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Posts CRUD App',
  description:
    'A modern Next.js application for managing posts with full CRUD functionality',
  keywords: ['posts', 'blog', 'crud', 'nextjs', 'react'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <QueryProvider>
          {/* Navigation Bar */}
          <nav className="bg-white shadow-sm border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center h-16">
                <div className="flex items-center">
                  <Link href="/" className="flex items-center space-x-2">
                    <svg
                      className="w-8 h-8 text-primary-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    <span className="text-xl font-bold text-gray-900">
                      Posts App
                    </span>
                  </Link>
                </div>
                <div className="flex items-center space-x-4">
                  <Link
                    href="/posts"
                    className="text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                  >
                    All Posts
                  </Link>
                  <Link
                    href="/posts/new"
                    className="bg-primary-600 text-white hover:bg-primary-700 px-4 py-2 rounded-md text-sm font-medium transition-colors"
                  >
                    Create Post
                  </Link>
                </div>
              </div>
            </div>
          </nav>

          {/* Main Content */}
          <main className="min-h-screen">{children}</main>

          {/* Footer */}
          <footer className="bg-white border-t border-gray-200 mt-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <div className="text-center text-gray-600">
                <p className="text-sm">
                  Built with Next.js 14, TypeScript, and Tailwind CSS
                </p>
                <p className="text-xs mt-2 text-gray-500">
                  Full-stack CRUD application with NestJS backend
                </p>
              </div>
            </div>
          </footer>
        </QueryProvider>
      </body>
    </html>
  );
}
