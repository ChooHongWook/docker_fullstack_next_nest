import React from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  useCurrentUser,
  useLogin,
  useRegister,
  useLogout,
  useHasRole,
  useHasPermission,
  useUserPermissions,
  useUserRoles,
} from '../useAuth';
import { authApi, ApiErrorException } from '@/lib/api';
import { User, LoginDto, RegisterDto } from '@/lib/types';

// Mock the API
jest.mock('@/lib/api', () => ({
  authApi: {
    getCurrentUser: jest.fn(),
    login: jest.fn(),
    register: jest.fn(),
    logout: jest.fn(),
  },
  ApiErrorException: class ApiErrorException extends Error {
    statusCode: number;
    error: string;
    constructor(
      message: string,
      data: { statusCode: number; message: string; error: string },
    ) {
      super(message);
      this.statusCode = data.statusCode;
      this.error = data.error;
    }
  },
}));

// Mock next/navigation
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

const mockUser: User = {
  id: '1',
  email: 'test@example.com',
  name: 'Test User',
  avatar: null,
  bio: null,
  phone: null,
  provider: null,
  providerId: null,
  isActive: true,
  emailVerified: true,
  lastLoginAt: new Date('2024-01-01'),
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  roles: [
    {
      userId: '1',
      roleId: '1',
      assignedAt: new Date('2024-01-01'),
      role: {
        id: '1',
        name: 'USER',
        description: 'Regular user',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        permissions: [
          {
            roleId: '1',
            permissionId: '1',
            grantedAt: new Date('2024-01-01'),
            permission: {
              id: '1',
              name: 'posts:read',
              description: 'Read posts',
              resource: 'posts',
              action: 'read',
              createdAt: new Date('2024-01-01'),
              updatedAt: new Date('2024-01-01'),
            },
          },
        ],
      },
    },
  ],
};

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

describe('useCurrentUser', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('fetches current user successfully', async () => {
    (authApi.getCurrentUser as jest.Mock).mockResolvedValue(mockUser);

    const { result } = renderHook(() => useCurrentUser(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockUser);
  });

  it('returns null for 401 unauthorized', async () => {
    const error = new ApiErrorException('Unauthorized', {
      statusCode: 401,
      message: 'Unauthorized',
      error: 'Unauthorized',
    });
    (authApi.getCurrentUser as jest.Mock).mockRejectedValue(error);

    const { result } = renderHook(() => useCurrentUser(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toBeNull();
  });

  it('throws other errors', async () => {
    const error = new Error('Network error');
    (authApi.getCurrentUser as jest.Mock).mockRejectedValue(error);

    const { result } = renderHook(() => useCurrentUser(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.data).toBeUndefined();
  });
});

describe('useLogin', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('logs in successfully and redirects', async () => {
    const loginData: LoginDto = {
      email: 'test@example.com',
      password: 'Password123!',
    };

    const response = {
      user: mockUser,
      message: 'Login successful',
    };

    (authApi.login as jest.Mock).mockResolvedValue(response);

    const { result } = renderHook(() => useLogin(), {
      wrapper: createWrapper(),
    });

    result.current.mutate(loginData);

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(authApi.login).toHaveBeenCalledWith(loginData);
    expect(mockPush).toHaveBeenCalledWith('/');
  });
});

describe('useRegister', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('registers successfully and redirects to login', async () => {
    const registerData: RegisterDto = {
      email: 'newuser@example.com',
      password: 'Password123!',
      name: 'New User',
    };

    (authApi.register as jest.Mock).mockResolvedValue(mockUser);

    const { result } = renderHook(() => useRegister(), {
      wrapper: createWrapper(),
    });

    result.current.mutate(registerData);

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(authApi.register).toHaveBeenCalledWith(registerData);
    expect(mockPush).toHaveBeenCalledWith('/login');
  });
});

describe('useLogout', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('logs out successfully and redirects to login', async () => {
    (authApi.logout as jest.Mock).mockResolvedValue({});

    const { result } = renderHook(() => useLogout(), {
      wrapper: createWrapper(),
    });

    result.current.mutate();

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(authApi.logout).toHaveBeenCalled();
    expect(mockPush).toHaveBeenCalledWith('/login');
  });
});

describe('useHasRole', () => {
  it('returns true when user has the role', () => {
    const queryClient = new QueryClient();
    queryClient.setQueryData(['auth', 'currentUser'], mockUser);

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(() => useHasRole('USER'), { wrapper });

    expect(result.current).toBe(true);
  });

  it('returns false when user does not have the role', () => {
    const queryClient = new QueryClient();
    queryClient.setQueryData(['auth', 'currentUser'], mockUser);

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(() => useHasRole('ADMIN'), { wrapper });

    expect(result.current).toBe(false);
  });

  it('returns false when user is not logged in', () => {
    const queryClient = new QueryClient();
    queryClient.setQueryData(['auth', 'currentUser'], null);

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(() => useHasRole('USER'), { wrapper });

    expect(result.current).toBe(false);
  });
});

describe('useHasPermission', () => {
  it('returns true when user has the permission', () => {
    const queryClient = new QueryClient();
    queryClient.setQueryData(['auth', 'currentUser'], mockUser);

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(() => useHasPermission('posts:read'), {
      wrapper,
    });

    expect(result.current).toBe(true);
  });

  it('returns false when user does not have the permission', () => {
    const queryClient = new QueryClient();
    queryClient.setQueryData(['auth', 'currentUser'], mockUser);

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(() => useHasPermission('posts:delete'), {
      wrapper,
    });

    expect(result.current).toBe(false);
  });
});

describe('useUserPermissions', () => {
  it('returns all user permissions', () => {
    const queryClient = new QueryClient();
    queryClient.setQueryData(['auth', 'currentUser'], mockUser);

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(() => useUserPermissions(), { wrapper });

    expect(result.current).toEqual(['posts:read']);
  });

  it('returns empty array when user is not logged in', () => {
    const queryClient = new QueryClient();
    queryClient.setQueryData(['auth', 'currentUser'], null);

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(() => useUserPermissions(), { wrapper });

    expect(result.current).toEqual([]);
  });
});

describe('useUserRoles', () => {
  it('returns all user roles', () => {
    const queryClient = new QueryClient();
    queryClient.setQueryData(['auth', 'currentUser'], mockUser);

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(() => useUserRoles(), { wrapper });

    expect(result.current).toEqual(['USER']);
  });

  it('returns empty array when user is not logged in', () => {
    const queryClient = new QueryClient();
    queryClient.setQueryData(['auth', 'currentUser'], null);

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(() => useUserRoles(), { wrapper });

    expect(result.current).toEqual([]);
  });
});
