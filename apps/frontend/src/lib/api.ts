import axios, { AxiosError, AxiosInstance } from 'axios';
import { Post, CreatePostDto, UpdatePostDto, ApiError } from './types';

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
});

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
