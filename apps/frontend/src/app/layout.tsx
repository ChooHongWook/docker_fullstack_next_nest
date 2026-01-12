import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { QueryProvider } from '@/providers/QueryProvider';
import Navbar from '@/components/Navbar';
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
          <Navbar />
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
