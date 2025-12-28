'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { PostFormData, ValidationError } from '@/lib/types';

interface PostFormProps {
  initialData?: Partial<PostFormData>;
  onSubmit: (data: PostFormData) => Promise<void>;
  submitLabel?: string;
  isEdit?: boolean;
}

/**
 * PostForm Component
 * Reusable form for creating and editing posts
 */
export default function PostForm({
  initialData = {},
  onSubmit,
  submitLabel = 'Submit',
  isEdit = false,
}: PostFormProps) {
  const router = useRouter();
  const [formData, setFormData] = useState<PostFormData>({
    title: initialData.title || '',
    content: initialData.content || '',
    author: initialData.author || '',
  });

  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  /**
   * Validate form data
   */
  const validate = (): boolean => {
    const newErrors: ValidationError[] = [];

    if (!formData.title.trim()) {
      newErrors.push({ field: 'title', message: 'Title is required' });
    } else if (formData.title.length < 3) {
      newErrors.push({ field: 'title', message: 'Title must be at least 3 characters' });
    } else if (formData.title.length > 200) {
      newErrors.push({ field: 'title', message: 'Title must be less than 200 characters' });
    }

    if (!formData.content.trim()) {
      newErrors.push({ field: 'content', message: 'Content is required' });
    } else if (formData.content.length < 10) {
      newErrors.push({ field: 'content', message: 'Content must be at least 10 characters' });
    } else if (formData.content.length > 10000) {
      newErrors.push({ field: 'content', message: 'Content must be less than 10000 characters' });
    }

    if (formData.author && formData.author.length > 100) {
      newErrors.push({ field: 'author', message: 'Author name must be less than 100 characters' });
    }

    setErrors(newErrors);
    return newErrors.length === 0;
  };

  /**
   * Get error message for a specific field
   */
  const getFieldError = (field: string): string | undefined => {
    return errors.find((err) => err.field === field)?.message;
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitError(null);

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);

    try {
      await onSubmit(formData);
      // Success - parent component handles navigation
    } catch (error: any) {
      setSubmitError(error.message || 'An error occurred while submitting the form');
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Handle input change
   */
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error for this field when user starts typing
    setErrors((prev) => prev.filter((err) => err.field !== name));
  };

  /**
   * Handle cancel
   */
  const handleCancel = () => {
    router.back();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Title Field */}
      <div>
        <label
          htmlFor="title"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Title <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="title"
          name="title"
          value={formData.title}
          onChange={handleChange}
          className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-colors ${
            getFieldError('title')
              ? 'border-red-500 bg-red-50'
              : 'border-gray-300'
          }`}
          placeholder="Enter post title"
          disabled={isSubmitting}
          aria-invalid={!!getFieldError('title')}
          aria-describedby={getFieldError('title') ? 'title-error' : undefined}
        />
        {getFieldError('title') && (
          <p id="title-error" className="mt-1 text-sm text-red-600">
            {getFieldError('title')}
          </p>
        )}
      </div>

      {/* Content Field */}
      <div>
        <label
          htmlFor="content"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Content <span className="text-red-500">*</span>
        </label>
        <textarea
          id="content"
          name="content"
          value={formData.content}
          onChange={handleChange}
          rows={8}
          className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-colors resize-vertical ${
            getFieldError('content')
              ? 'border-red-500 bg-red-50'
              : 'border-gray-300'
          }`}
          placeholder="Enter post content"
          disabled={isSubmitting}
          aria-invalid={!!getFieldError('content')}
          aria-describedby={getFieldError('content') ? 'content-error' : undefined}
        />
        {getFieldError('content') && (
          <p id="content-error" className="mt-1 text-sm text-red-600">
            {getFieldError('content')}
          </p>
        )}
      </div>

      {/* Author Field */}
      <div>
        <label
          htmlFor="author"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Author
        </label>
        <input
          type="text"
          id="author"
          name="author"
          value={formData.author}
          onChange={handleChange}
          className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-colors ${
            getFieldError('author')
              ? 'border-red-500 bg-red-50'
              : 'border-gray-300'
          }`}
          placeholder="Enter author name (optional)"
          disabled={isSubmitting}
          aria-invalid={!!getFieldError('author')}
          aria-describedby={getFieldError('author') ? 'author-error' : undefined}
        />
        {getFieldError('author') && (
          <p id="author-error" className="mt-1 text-sm text-red-600">
            {getFieldError('author')}
          </p>
        )}
      </div>

      {/* Submit Error */}
      {submitError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{submitError}</p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-4 pt-4 border-t border-gray-200">
        <button
          type="button"
          onClick={handleCancel}
          disabled={isSubmitting}
          className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isSubmitting && (
            <svg
              className="animate-spin h-5 w-5"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
          )}
          {isSubmitting ? 'Submitting...' : submitLabel}
        </button>
      </div>
    </form>
  );
}
