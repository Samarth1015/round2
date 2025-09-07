import { useState, FormEvent } from 'react';
import { CreateCommentDto } from '../types/announcements';

interface CommentFormProps {
  onSubmit: (comment: CreateCommentDto) => Promise<void>;
  isSubmitting?: boolean;
}

export function CommentForm({ onSubmit, isSubmitting = false }: CommentFormProps) {
  const [formData, setFormData] = useState<CreateCommentDto>({
    authorName: '',
    text: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.authorName.trim()) {
      newErrors.authorName = 'Name is required';
    }

    if (!formData.text.trim()) {
      newErrors.text = 'Comment is required';
    } else if (formData.text.trim().length > 500) {
      newErrors.text = 'Comment must be 500 characters or less';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      await onSubmit({
        authorName: formData.authorName.trim(),
        text: formData.text.trim(),
      });
      
      // Clear form on success
      setFormData({ authorName: '', text: '' });
      setErrors({});
    } catch (error) {
      // Error handling is done by parent component
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 bg-gray-50 rounded-lg">
      <div>
        <label htmlFor="authorName" className="block text-sm font-medium text-gray-700 mb-1">
          Your Name
        </label>
        <input
          type="text"
          id="authorName"
          value={formData.authorName}
          onChange={(e) => setFormData(prev => ({ ...prev, authorName: e.target.value }))}
          className={`
            w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500
            ${errors.authorName ? 'border-red-500' : 'border-gray-300'}
          `}
          placeholder="Enter your name"
          disabled={isSubmitting}
        />
        {errors.authorName && (
          <p className="mt-1 text-sm text-red-600">{errors.authorName}</p>
        )}
      </div>

      <div>
        <label htmlFor="text" className="block text-sm font-medium text-gray-700 mb-1">
          Comment
        </label>
        <textarea
          id="text"
          value={formData.text}
          onChange={(e) => setFormData(prev => ({ ...prev, text: e.target.value }))}
          rows={3}
          className={`
            w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500
            ${errors.text ? 'border-red-500' : 'border-gray-300'}
          `}
          placeholder="Share your thoughts..."
          disabled={isSubmitting}
        />
        <div className="flex justify-between items-center mt-1">
          <div>
            {errors.text && (
              <p className="text-sm text-red-600">{errors.text}</p>
            )}
          </div>
          <span className={`text-sm ${formData.text.length > 500 ? 'text-red-600' : 'text-gray-500'}`}>
            {formData.text.length}/500
          </span>
        </div>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className={`
          w-full px-4 py-2 bg-blue-600 text-white rounded-md font-medium
          hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
          disabled:opacity-50 disabled:cursor-not-allowed
          transition-colors duration-200
        `}
      >
        {isSubmitting ? 'Posting...' : 'Post Comment'}
      </button>
    </form>
  );
}
