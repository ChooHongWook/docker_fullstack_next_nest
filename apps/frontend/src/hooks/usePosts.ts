import useSWR, { KeyedMutator } from 'swr';
import { Post, ApiError } from '@/lib/types';
import { postsApi } from '@/lib/api';

/**
 * SWR fetcher function for posts
 */
const fetcher = async (url: string): Promise<Post[]> => {
  return postsApi.getAll();
};

/**
 * SWR fetcher function for a single post
 */
const postFetcher = async (url: string, id: number | string): Promise<Post> => {
  return postsApi.getById(id);
};

/**
 * Hook to fetch all posts with SWR
 * Provides automatic caching, revalidation, and optimistic updates
 */
export function usePosts() {
  const { data, error, isLoading, mutate } = useSWR<Post[], ApiError>(
    '/api/posts',
    fetcher,
    {
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      dedupingInterval: 2000,
    }
  );

  return {
    posts: data,
    isLoading,
    isError: error,
    mutate,
  };
}

/**
 * Hook to fetch a single post by ID with SWR
 */
export function usePost(id: number | string | null) {
  const shouldFetch = id !== null && id !== undefined;

  const { data, error, isLoading, mutate } = useSWR<Post, ApiError>(
    shouldFetch ? ['/api/posts', id] : null,
    ([url, postId]) => postFetcher(url, postId),
    {
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      dedupingInterval: 2000,
    }
  );

  return {
    post: data,
    isLoading,
    isError: error,
    mutate,
  };
}

/**
 * Return type for usePosts hook
 */
export interface UsePostsReturn {
  posts: Post[] | undefined;
  isLoading: boolean;
  isError: ApiError | undefined;
  mutate: KeyedMutator<Post[]>;
}

/**
 * Return type for usePost hook
 */
export interface UsePostReturn {
  post: Post | undefined;
  isLoading: boolean;
  isError: ApiError | undefined;
  mutate: KeyedMutator<Post>;
}
