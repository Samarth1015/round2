import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AnnouncementsList } from '../../components/AnnouncementsList';
import { useAnnouncements } from '../../hooks/useAnnouncements';
import { mockAnnouncements } from '../mocks/api';

// Mock the hook
jest.mock('../../hooks/useAnnouncements');
const mockUseAnnouncements = useAnnouncements as jest.MockedFunction<typeof useAnnouncements>;

// Mock the API client
jest.mock('../../lib/api-client');

describe('AnnouncementsList', () => {
  const mockOnAnnouncementClick = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows loading state initially', () => {
    mockUseAnnouncements.mockReturnValue({
      announcements: [],
      loading: true,
      error: null,
      refresh: jest.fn(),
    });

    render(<AnnouncementsList onAnnouncementClick={mockOnAnnouncementClick} />);
    
    expect(screen.getByText('Loading announcements...')).toBeInTheDocument();
  });

  it('shows error state when fetch fails', () => {
    const mockRefresh = jest.fn();
    mockUseAnnouncements.mockReturnValue({
      announcements: [],
      loading: false,
      error: 'Network error',
      refresh: mockRefresh,
    });

    render(<AnnouncementsList onAnnouncementClick={mockOnAnnouncementClick} />);
    
    expect(screen.getByText('Failed to load announcements')).toBeInTheDocument();
    expect(screen.getByText('Network error')).toBeInTheDocument();
    
    const retryButton = screen.getByText('Try Again');
    fireEvent.click(retryButton);
    expect(mockRefresh).toHaveBeenCalled();
  });

  it('shows empty state when no announcements', () => {
    mockUseAnnouncements.mockReturnValue({
      announcements: [],
      loading: false,
      error: null,
      refresh: jest.fn(),
    });

    render(<AnnouncementsList onAnnouncementClick={mockOnAnnouncementClick} />);
    
    expect(screen.getByText('No announcements')).toBeInTheDocument();
    expect(screen.getByText('Check back later for community updates!')).toBeInTheDocument();
  });

  it('renders announcements correctly', () => {
    mockUseAnnouncements.mockReturnValue({
      announcements: mockAnnouncements,
      loading: false,
      error: null,
      refresh: jest.fn(),
    });

    render(<AnnouncementsList onAnnouncementClick={mockOnAnnouncementClick} />);
    
    expect(screen.getByText('Water supply maintenance on Friday')).toBeInTheDocument();
    expect(screen.getByText('Gym closed for cleaning')).toBeInTheDocument();
    expect(screen.getByText('3 comments')).toBeInTheDocument();
    expect(screen.getByText('0 comments')).toBeInTheDocument();
  });

  it('calls onAnnouncementClick when announcement is clicked', async () => {
    const user = userEvent.setup();
    mockUseAnnouncements.mockReturnValue({
      announcements: mockAnnouncements,
      loading: false,
      error: null,
      refresh: jest.fn(),
    });

    render(<AnnouncementsList onAnnouncementClick={mockOnAnnouncementClick} />);
    
    const firstAnnouncement = screen.getByText('Water supply maintenance on Friday');
    await user.click(firstAnnouncement);
    
    expect(mockOnAnnouncementClick).toHaveBeenCalledWith('1');
  });
});
