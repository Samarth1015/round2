import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ReactionButton } from '../../components/ReactionButton';

describe('ReactionButton', () => {
  const mockOnClick = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly with up reaction', () => {
    render(
      <ReactionButton
        type="up"
        count={5}
        onClick={mockOnClick}
      />
    );
    
    expect(screen.getByText('👍')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('renders correctly with down reaction', () => {
    render(
      <ReactionButton
        type="down"
        count={2}
        onClick={mockOnClick}
      />
    );
    
    expect(screen.getByText('👎')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('renders correctly with heart reaction', () => {
    render(
      <ReactionButton
        type="heart"
        count={10}
        onClick={mockOnClick}
      />
    );
    
    expect(screen.getByText('❤️')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
  });

  it('applies active styling when isActive is true', () => {
    render(
      <ReactionButton
        type="up"
        count={5}
        isActive={true}
        onClick={mockOnClick}
      />
    );
    
    const button = screen.getByRole('button');
    expect(button).toHaveClass('bg-blue-100', 'border-blue-300', 'text-blue-800');
  });

  it('applies disabled styling when isDisabled is true', () => {
    render(
      <ReactionButton
        type="up"
        count={5}
        isDisabled={true}
        onClick={mockOnClick}
      />
    );
    
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    expect(button).toHaveClass('opacity-50', 'cursor-not-allowed');
  });

  it('calls onClick when clicked', async () => {
    const user = userEvent.setup();
    render(
      <ReactionButton
        type="up"
        count={5}
        onClick={mockOnClick}
      />
    );
    
    const button = screen.getByRole('button');
    await user.click(button);
    
    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });

  it('does not call onClick when disabled', async () => {
    const user = userEvent.setup();
    render(
      <ReactionButton
        type="up"
        count={5}
        isDisabled={true}
        onClick={mockOnClick}
      />
    );
    
    const button = screen.getByRole('button');
    await user.click(button);
    
    expect(mockOnClick).not.toHaveBeenCalled();
  });
});
