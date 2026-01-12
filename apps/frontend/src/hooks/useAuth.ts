import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authApi } from '@/lib/api';
import { LoginDto, RegisterDto, User } from '@/lib/types';
import { useRouter } from 'next/navigation';

/**
 * Auth query keys for React Query cache management
 */
export const authKeys = {
  currentUser: ['auth', 'currentUser'] as const,
};

/**
 * Hook to get current authenticated user
 * Returns null if not authenticated
 */
export function useCurrentUser() {
  return useQuery({
    queryKey: authKeys.currentUser,
    queryFn: authApi.getCurrentUser,
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook for user login
 */
export function useLogin() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: (data: LoginDto) => authApi.login(data),
    onSuccess: (response) => {
      // Set user in cache
      queryClient.setQueryData(authKeys.currentUser, response.user);
      // Redirect to home
      router.push('/');
    },
  });
}

/**
 * Hook for user registration
 */
export function useRegister() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: (data: RegisterDto) => authApi.register(data),
    onSuccess: (user) => {
      // Set user in cache
      queryClient.setQueryData(authKeys.currentUser, user);
      // Redirect to login
      router.push('/login');
    },
  });
}

/**
 * Hook for user logout
 */
export function useLogout() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: authApi.logout,
    onSuccess: () => {
      // Clear user from cache
      queryClient.setQueryData(authKeys.currentUser, null);
      queryClient.clear();
      // Redirect to login
      router.push('/login');
    },
  });
}

/**
 * Check if user has a specific role
 */
export function useHasRole(roleName: string) {
  const { data: user } = useCurrentUser();

  if (!user) return false;

  return user.roles.some((userRole) => userRole.role.name === roleName);
}

/**
 * Check if user has a specific permission
 */
export function useHasPermission(permissionName: string) {
  const { data: user } = useCurrentUser();

  if (!user) return false;

  return user.roles.some((userRole) =>
    userRole.role.permissions.some(
      (rolePermission) => rolePermission.permission.name === permissionName
    )
  );
}

/**
 * Get all user permissions
 */
export function useUserPermissions() {
  const { data: user } = useCurrentUser();

  if (!user) return [];

  const permissions = user.roles.flatMap((userRole) =>
    userRole.role.permissions.map((rp) => rp.permission.name)
  );

  // Remove duplicates
  return Array.from(new Set(permissions));
}

/**
 * Get all user roles
 */
export function useUserRoles() {
  const { data: user } = useCurrentUser();

  if (!user) return [];

  return user.roles.map((userRole) => userRole.role.name);
}
