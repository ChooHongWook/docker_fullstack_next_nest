import axios, { AxiosError, AxiosInstance } from 'axios';
import {
  Post,
  CreatePostDto,
  UpdatePostDto,
  ApiError,
  User,
  RegisterDto,
  LoginDto,
  LoginResponse,
} from './types';

/**
 * API client configuration
 */
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

/**
 * Axios instance with default configuration
 */
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 second timeout
  withCredentials: true, // Enable cookies for JWT authentication
});

/**
 * Flag to prevent infinite refresh loops
 */
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: unknown = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve();
    }
  });

  failedQueue = [];
};

/**
 * Response interceptor for token refresh
 */
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as typeof error.config & {
      _retry?: boolean;
    };

    // If 401 and not already retried, try to refresh token
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Queue requests while refreshing
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => {
            return apiClient(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Attempt to refresh token
        await apiClient.post('/auth/refresh');
        processQueue();
        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError);
        // Redirect to login on refresh failure
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

/**
 * Custom API Error class for proper Error serialization
 * Extends Error to ensure compatibility with React Suspense boundaries
 */
export class ApiErrorException extends Error {
  public readonly statusCode?: number;
  public readonly error?: string;

  constructor(message: string, statusCode?: number, error?: string) {
    super(message);
    this.name = 'ApiErrorException';
    this.statusCode = statusCode;
    this.error = error;

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ApiErrorException);
    }
  }

  /**
   * Serialize to plain object for JSON responses
   * This ensures the error can be safely sent over the network
   */
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      statusCode: this.statusCode,
      error: this.error,
    };
  }
}

/**
 * Error handler to normalize API errors
 */
const handleApiError = (error: unknown): never => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<ApiError>;
    const message =
      axiosError.response?.data?.message ||
      axiosError.message ||
      'An unknown error occurred';
    const statusCode = axiosError.response?.status;
    const errorType = axiosError.response?.data?.error;

    throw new ApiErrorException(message, statusCode, errorType);
  }

  const message =
    error instanceof Error ? error.message : 'An unknown error occurred';
  throw new ApiErrorException(message, 500);
};

/**
 * Authentication API service
 */
export const authApi = {
  /**
   * Register a new user
   */
  async register(data: RegisterDto): Promise<User> {
    try {
      const response = await apiClient.post<User>('/auth/register', data);
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  /**
   * Login with email and password
   */
  async login(data: LoginDto): Promise<LoginResponse> {
    try {
      const response = await apiClient.post<LoginResponse>('/auth/login', data);
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  /**
   * Logout and clear tokens
   */
  async logout(): Promise<void> {
    try {
      await apiClient.post('/auth/logout');
    } catch (error) {
      return handleApiError(error);
    }
  },

  /**
   * Get current authenticated user
   */
  async getCurrentUser(): Promise<User> {
    try {
      const response = await apiClient.get<User>('/auth/me');
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  /**
   * Refresh access token
   */
  async refreshToken(): Promise<void> {
    try {
      await apiClient.post('/auth/refresh');
    } catch (error) {
      return handleApiError(error);
    }
  },
};

/**
 * Posts API service
 */
export const postsApi = {
  /**
   * Fetch all posts
   */
  async getAll(): Promise<Post[]> {
    try {
      const response = await apiClient.get<Post[]>('/posts');
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  /**
   * Fetch a single post by ID
   */
  async getById(id: number | string): Promise<Post> {
    try {
      const response = await apiClient.get<Post>(`/posts/${id}`);
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  /**
   * Create a new post
   */
  async create(data: CreatePostDto): Promise<Post> {
    try {
      const response = await apiClient.post<Post>('/posts', data);
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  /**
   * Update an existing post
   */
  async update(id: number | string, data: UpdatePostDto): Promise<Post> {
    try {
      const response = await apiClient.patch<Post>(`/posts/${id}`, data);
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  /**
   * Delete a post
   */
  async delete(id: number | string): Promise<void> {
    try {
      await apiClient.delete(`/posts/${id}`);
    } catch (error) {
      return handleApiError(error);
    }
  },
};

/**
 * Export default API client for custom requests
 */
export default apiClient;
