import React from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  usePosts,
  useSuspensePosts,
  usePost,
  useDeletePost,
} from '../usePosts';
import { postsApi } from '@/lib/api';
import { Post } from '@/lib/types';

// Mock the API
jest.mock('@/lib/api', () => ({
  postsApi: {
    getAll: jest.fn(),
    getById: jest.fn(),
    delete: jest.fn(),
  },
}));

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
  })),
}));

const mockPosts: Post[] = [
  {
    id: 1,
    title: 'Test Post 1',
    content: 'Content 1',
    author: 'Author 1',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: 2,
    title: 'Test Post 2',
    content: 'Content 2',
    author: 'Author 2',
    createdAt: new Date('2024-01-02'),
    updatedAt: new Date('2024-01-02'),
  },
];

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe('usePosts', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('fetches all posts successfully', async () => {
    (postsApi.getAll as jest.Mock).mockResolvedValue(mockPosts);

    const { result } = renderHook(() => usePosts(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.posts).toEqual(mockPosts);
    expect(result.current.isError).toBeFalsy();
  });

  it('handles fetch error', async () => {
    const error = new Error('Failed to fetch');
    (postsApi.getAll as jest.Mock).mockRejectedValue(error);

    const { result } = renderHook(() => usePosts(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.posts).toBeUndefined();
    expect(result.current.isError).toBeTruthy();
  });
});

describe('usePost', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('fetches a single post by id', async () => {
    const mockPost = mockPosts[0];
    (postsApi.getById as jest.Mock).mockResolvedValue(mockPost);

    const { result } = renderHook(() => usePost(1), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.post).toEqual(mockPost);
    expect(result.current.isError).toBeFalsy();
  });

  it('does not fetch when id is null', () => {
    const { result } = renderHook(() => usePost(null), {
      wrapper: createWrapper(),
    });

    expect(result.current.post).toBeUndefined();
    expect(postsApi.getById).not.toHaveBeenCalled();
  });

  it('handles fetch error', async () => {
    const error = new Error('Post not found');
    (postsApi.getById as jest.Mock).mockRejectedValue(error);

    const { result } = renderHook(() => usePost(999), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.post).toBeUndefined();
    expect(result.current.isError).toBeTruthy();
  });
});

describe('useDeletePost', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deletes a post successfully', async () => {
    (postsApi.delete as jest.Mock).mockResolvedValue({});

    const queryClient = new QueryClient();
    queryClient.setQueryData(['posts'], mockPosts);

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(() => useDeletePost(), { wrapper });

    result.current.mutate(1);

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(postsApi.delete).toHaveBeenCalledWith(1);
  });

  it('handles delete error and rolls back optimistic update', async () => {
    const error = new Error('Failed to delete');
    (postsApi.delete as jest.Mock).mockRejectedValue(error);

    const queryClient = new QueryClient();
    queryClient.setQueryData(['posts'], mockPosts);

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(() => useDeletePost(), { wrapper });

    result.current.mutate(1);

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    // Should rollback to original data
    const posts = queryClient.getQueryData<Post[]>(['posts']);
    expect(posts).toEqual(mockPosts);
  });
});
