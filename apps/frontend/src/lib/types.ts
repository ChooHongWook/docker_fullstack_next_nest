/**
 * Core Post interface matching the backend model
 */
export interface Post {
  id: number;
  title: string;
  content: string;
  author?: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

/**
 * Data Transfer Object for creating a new post
 */
export interface CreatePostDto {
  title: string;
  content: string;
  author?: string;
}

/**
 * Data Transfer Object for updating an existing post
 * All fields are optional to support partial updates
 */
export interface UpdatePostDto {
  title?: string;
  content?: string;
  author?: string;
}

/**
 * Generic API response wrapper
 */
export interface ApiResponse<T> {
  data?: T;
  error?: ApiError;
  message?: string;
}

/**
 * API error structure
 */
export interface ApiError {
  message: string;
  statusCode?: number;
  error?: string;
}

/**
 * Form validation errors
 */
export interface ValidationError {
  field: string;
  message: string;
}

/**
 * Post form data (used in forms before submission)
 */
export interface PostFormData {
  title: string;
  content: string;
  author: string;
}
