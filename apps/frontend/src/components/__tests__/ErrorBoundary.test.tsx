import { render, screen } from '@testing-library/react';
import {
  ErrorBoundary,
  PostsErrorFallback,
  PostDetailErrorFallback,
} from '../ErrorBoundary';
import { ApiErrorException } from '@/lib/api';

// Component that throws an error
function ThrowError({ message }: { message: string }) {
  throw new Error(message);
}

// Component that throws API error
function ThrowApiError() {
  throw new ApiErrorException('Not Found', {
    statusCode: 404,
    message: 'Post not found',
    error: 'Not Found',
  });
}

describe('ErrorBoundary', () => {
  // Suppress console.error for these tests
  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders children when there is no error', () => {
    render(
      <ErrorBoundary>
        <div>Test content</div>
      </ErrorBoundary>,
    );

    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  it('renders default error fallback when error occurs', () => {
    render(
      <ErrorBoundary>
        <ThrowError message="Test error" />
      </ErrorBoundary>,
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText('Test error')).toBeInTheDocument();
    expect(screen.getByText('Retry')).toBeInTheDocument();
    expect(screen.getByText('Go Home')).toBeInTheDocument();
  });

  it('renders custom fallback when provided', () => {
    render(
      <ErrorBoundary fallback={<div>Custom error message</div>}>
        <ThrowError message="Test error" />
      </ErrorBoundary>,
    );

    expect(screen.getByText('Custom error message')).toBeInTheDocument();
    expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument();
  });

  it('handles ApiErrorException', () => {
    render(
      <ErrorBoundary>
        <ThrowApiError />
      </ErrorBoundary>,
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(console.error).toHaveBeenCalled();
  });
});

describe('PostsErrorFallback', () => {
  it('renders posts error fallback UI', () => {
    render(<PostsErrorFallback />);

    expect(screen.getByText('Failed to load posts')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Unable to fetch posts from the server. Please try again.',
      ),
    ).toBeInTheDocument();
    expect(screen.getByText('Retry')).toBeInTheDocument();
  });
});

describe('PostDetailErrorFallback', () => {
  it('renders post detail error fallback UI', () => {
    render(<PostDetailErrorFallback />);

    expect(screen.getByText('Post Not Found')).toBeInTheDocument();
    expect(
      screen.getByText(
        'The post you are looking for does not exist or has been deleted.',
      ),
    ).toBeInTheDocument();
    expect(screen.getByText('Back to Posts')).toBeInTheDocument();
  });
});
