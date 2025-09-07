import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CommentForm } from '../../components/CommentForm';

describe('CommentForm', () => {
  const mockOnSubmit = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders form fields correctly', () => {
    render(<CommentForm onSubmit={mockOnSubmit} />);
    
    expect(screen.getByLabelText('Your Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Comment')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Post Comment' })).toBeInTheDocument();
  });

  it('shows validation errors for empty fields', async () => {
    const user = userEvent.setup();
    render(<CommentForm onSubmit={mockOnSubmit} />);
    
    const submitButton = screen.getByRole('button', { name: 'Post Comment' });
    await user.click(submitButton);
    
    expect(screen.getByText('Name is required')).toBeInTheDocument();
    expect(screen.getByText('Comment is required')).toBeInTheDocument();
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('shows validation error for comment too long', async () => {
    const user = userEvent.setup();
    render(<CommentForm onSubmit={mockOnSubmit} />);
    
    const nameInput = screen.getByLabelText('Your Name');
    const commentInput = screen.getByLabelText('Comment');
    const submitButton = screen.getByRole('button', { name: 'Post Comment' });
    
    await user.type(nameInput, 'John Doe');
    await user.type(commentInput, 'a'.repeat(501)); // 501 characters
    await user.click(submitButton);
    
    expect(screen.getByText('Comment must be 500 characters or less')).toBeInTheDocument();
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('shows character count', async () => {
    const user = userEvent.setup();
    render(<CommentForm onSubmit={mockOnSubmit} />);
    
    const commentInput = screen.getByLabelText('Comment');
    await user.type(commentInput, 'Hello world');
    
    expect(screen.getByText('11/500')).toBeInTheDocument();
  });

  it('submits form with valid data', async () => {
    const user = userEvent.setup();
    mockOnSubmit.mockResolvedValue(undefined);
    
    render(<CommentForm onSubmit={mockOnSubmit} />);
    
    const nameInput = screen.getByLabelText('Your Name');
    const commentInput = screen.getByLabelText('Comment');
    const submitButton = screen.getByRole('button', { name: 'Post Comment' });
    
    await user.type(nameInput, 'John Doe');
    await user.type(commentInput, 'This is a test comment');
    await user.click(submitButton);
    
    expect(mockOnSubmit).toHaveBeenCalledWith({
      authorName: 'John Doe',
      text: 'This is a test comment',
    });
  });

  it('clears form after successful submission', async () => {
    const user = userEvent.setup();
    mockOnSubmit.mockResolvedValue(undefined);
    
    render(<CommentForm onSubmit={mockOnSubmit} />);
    
    const nameInput = screen.getByLabelText('Your Name') as HTMLInputElement;
    const commentInput = screen.getByLabelText('Comment') as HTMLTextAreaElement;
    const submitButton = screen.getByRole('button', { name: 'Post Comment' });
    
    await user.type(nameInput, 'John Doe');
    await user.type(commentInput, 'This is a test comment');
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(nameInput.value).toBe('');
      expect(commentInput.value).toBe('');
    });
  });

  it('shows submitting state', async () => {
    const user = userEvent.setup();
    let resolveSubmit: () => void;
    const submitPromise = new Promise<void>((resolve) => {
      resolveSubmit = resolve;
    });
    mockOnSubmit.mockReturnValue(submitPromise);
    
    render(<CommentForm onSubmit={mockOnSubmit} />);
    
    const nameInput = screen.getByLabelText('Your Name');
    const commentInput = screen.getByLabelText('Comment');
    const submitButton = screen.getByRole('button');
    
    await user.type(nameInput, 'John Doe');
    await user.type(commentInput, 'This is a test comment');
    await user.click(submitButton);
    
    expect(screen.getByText('Posting...')).toBeInTheDocument();
    expect(submitButton).toBeDisabled();
    
    resolveSubmit!();
    await waitFor(() => {
      expect(screen.getByText('Post Comment')).toBeInTheDocument();
    });
  });
});
