'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { PostFormData, ValidationError } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';

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
      <div className="space-y-2">
        <Label htmlFor="title">
          Title <span className="text-destructive">*</span>
        </Label>
        <Input
          type="text"
          id="title"
          name="title"
          value={formData.title}
          onChange={handleChange}
          className={getFieldError('title') ? 'border-destructive' : ''}
          placeholder="Enter post title"
          disabled={isSubmitting}
          aria-invalid={!!getFieldError('title')}
          aria-describedby={getFieldError('title') ? 'title-error' : undefined}
        />
        {getFieldError('title') && (
          <p id="title-error" className="text-sm text-destructive">
            {getFieldError('title')}
          </p>
        )}
      </div>

      {/* Content Field */}
      <div className="space-y-2">
        <Label htmlFor="content">
          Content <span className="text-destructive">*</span>
        </Label>
        <Textarea
          id="content"
          name="content"
          value={formData.content}
          onChange={handleChange}
          rows={8}
          className={getFieldError('content') ? 'border-destructive' : ''}
          placeholder="Enter post content"
          disabled={isSubmitting}
          aria-invalid={!!getFieldError('content')}
          aria-describedby={getFieldError('content') ? 'content-error' : undefined}
        />
        {getFieldError('content') && (
          <p id="content-error" className="text-sm text-destructive">
            {getFieldError('content')}
          </p>
        )}
      </div>

      {/* Author Field */}
      <div className="space-y-2">
        <Label htmlFor="author">Author</Label>
        <Input
          type="text"
          id="author"
          name="author"
          value={formData.author}
          onChange={handleChange}
          className={getFieldError('author') ? 'border-destructive' : ''}
          placeholder="Enter author name (optional)"
          disabled={isSubmitting}
          aria-invalid={!!getFieldError('author')}
          aria-describedby={getFieldError('author') ? 'author-error' : undefined}
        />
        {getFieldError('author') && (
          <p id="author-error" className="text-sm text-destructive">
            {getFieldError('author')}
          </p>
        )}
      </div>

      {/* Submit Error */}
      {submitError && (
        <Alert variant="destructive">
          <AlertDescription>{submitError}</AlertDescription>
        </Alert>
      )}

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-4 pt-4 border-t">
        <Button
          type="button"
          onClick={handleCancel}
          disabled={isSubmitting}
          variant="outline"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isSubmitting ? 'Submitting...' : submitLabel}
        </Button>
      </div>
    </form>
  );
}
