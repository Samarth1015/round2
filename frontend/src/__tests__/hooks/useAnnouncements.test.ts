import { renderHook, waitFor } from '@testing-library/react';
import { useAnnouncements } from '../../hooks/useAnnouncements';
import { apiClient } from '../../lib/api-client';
import { mockAnnouncements } from '../mocks/api';

// Mock the API client
jest.mock('../../lib/api-client');
const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;

// Mock timers
jest.useFakeTimers();

describe('useAnnouncements', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('fetches announcements on mount', async () => {
    mockApiClient.getAnnouncements.mockResolvedValue(mockAnnouncements);

    const { result } = renderHook(() => useAnnouncements());

    expect(result.current.loading).toBe(true);
    expect(result.current.announcements).toEqual([]);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.announcements).toEqual(mockAnnouncements);
    expect(result.current.error).toBe(null);
    expect(mockApiClient.getAnnouncements).toHaveBeenCalledTimes(1);
  });

  it('handles fetch errors', async () => {
    const errorMessage = 'Network error';
    mockApiClient.getAnnouncements.mockRejectedValue(new Error(errorMessage));

    const { result } = renderHook(() => useAnnouncements());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe(errorMessage);
    expect(result.current.announcements).toEqual([]);
  });

  it('handles NOT_MODIFIED responses', async () => {
    // First successful fetch
    mockApiClient.getAnnouncements.mockResolvedValueOnce(mockAnnouncements);
    
    const { result } = renderHook(() => useAnnouncements());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.announcements).toEqual(mockAnnouncements);
    });

    // Second fetch returns NOT_MODIFIED
    const notModifiedError = new Error('NOT_MODIFIED');
    mockApiClient.getAnnouncements.mockRejectedValueOnce(notModifiedError);

    // Trigger polling
    jest.advanceTimersByTime(5000);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Should keep existing data and no error
    expect(result.current.announcements).toEqual(mockAnnouncements);
    expect(result.current.error).toBe(null);
  });

  it('polls every 5 seconds', async () => {
    mockApiClient.getAnnouncements.mockResolvedValue(mockAnnouncements);

    renderHook(() => useAnnouncements());

    // Initial call
    expect(mockApiClient.getAnnouncements).toHaveBeenCalledTimes(1);

    // Advance by 5 seconds
    jest.advanceTimersByTime(5000);
    await waitFor(() => {
      expect(mockApiClient.getAnnouncements).toHaveBeenCalledTimes(2);
    });

    // Advance by another 5 seconds
    jest.advanceTimersByTime(5000);
    await waitFor(() => {
      expect(mockApiClient.getAnnouncements).toHaveBeenCalledTimes(3);
    });
  });

  it('refresh function works correctly', async () => {
    mockApiClient.getAnnouncements.mockResolvedValue(mockAnnouncements);

    const { result } = renderHook(() => useAnnouncements());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Reset mock to track refresh call
    mockApiClient.getAnnouncements.mockClear();

    // Call refresh
    result.current.refresh();

    expect(result.current.loading).toBe(true);
    expect(mockApiClient.getAnnouncements).toHaveBeenCalledTimes(1);
  });
});
