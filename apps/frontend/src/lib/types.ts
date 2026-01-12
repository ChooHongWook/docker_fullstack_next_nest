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
 * API error structure (interface for plain objects)
 */
export interface ApiError {
  message: string;
  statusCode?: number;
  error?: string;
}

/**
 * API Error Exception (class for thrown errors)
 * Re-exported from api.ts for type imports
 */
export type { ApiErrorException } from './api';

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

/**
 * Authentication Types
 */

export type AuthProvider = 'LOCAL' | 'GOOGLE' | 'GITHUB' | 'KAKAO';

export interface Permission {
  id: string;
  name: string;
  description: string;
  resource: string;
  action: string;
  createdAt: Date | string;
}

export interface RolePermission {
  id: string;
  roleId: string;
  permissionId: string;
  grantedAt: Date | string;
  permission: Permission;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  createdAt: Date | string;
  updatedAt: Date | string;
  permissions: RolePermission[];
}

export interface UserRole {
  id: string;
  userId: string;
  roleId: string;
  assignedAt: Date | string;
  role: Role;
}

export interface User {
  id: string;
  email: string;
  name: string;
  avatar: string | null;
  bio: string | null;
  phone: string | null;
  provider: AuthProvider;
  providerId: string | null;
  isActive: boolean;
  emailVerified: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
  lastLoginAt: Date | string | null;
  roles: UserRole[];
}

export interface RegisterDto {
  email: string;
  password: string;
  name: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  message: string;
}

export interface AuthError {
  message: string;
  statusCode: number;
  error: string;
}
