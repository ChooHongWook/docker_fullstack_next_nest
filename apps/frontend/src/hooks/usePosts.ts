import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Post, ApiError } from '@/lib/types';
import { postsApi } from '@/lib/api';

/**
 * Hook to fetch all posts with React Query
 * Provides automatic caching, revalidation, and optimistic updates
 */
export function usePosts() {
  const { data, error, isLoading } = useQuery<Post[], ApiError>({
    queryKey: ['posts'],
    queryFn: () => postsApi.getAll(),
  });

  return {
    posts: data,
    isLoading,
    isError: error,
  };
}

/**
 * Hook to fetch a single post by ID with React Query
 */
export function usePost(id: number | string | null) {
  const shouldFetch = id !== null && id !== undefined;

  const { data, error, isLoading } = useQuery<Post, ApiError>({
    queryKey: ['posts', id],
    queryFn: () => postsApi.getById(id!),
    enabled: shouldFetch,
  });

  return {
    post: data,
    isLoading,
    isError: error,
  };
}

/**
 * Hook to delete a post with optimistic updates
 */
export function useDeletePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => postsApi.delete(id),
    onMutate: async (deletedId) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['posts'] });

      // Snapshot the previous value
      const previousPosts = queryClient.getQueryData<Post[]>(['posts']);

      // Optimistically update to the new value
      if (previousPosts) {
        queryClient.setQueryData<Post[]>(
          ['posts'],
          previousPosts.filter((post) => post.id !== deletedId)
        );
      }

      // Return context with the snapshotted value
      return { previousPosts };
    },
    onError: (err, deletedId, context) => {
      // Rollback on error
      if (context?.previousPosts) {
        queryClient.setQueryData(['posts'], context.previousPosts);
      }
    },
    onSettled: () => {
      // Refetch after error or success
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });
}

/**
 * Return type for usePosts hook
 */
export interface UsePostsReturn {
  posts: Post[] | undefined;
  isLoading: boolean;
  isError: ApiError | undefined;
}

/**
 * Return type for usePost hook
 */
export interface UsePostReturn {
  post: Post | undefined;
  isLoading: boolean;
  isError: ApiError | undefined;
}
