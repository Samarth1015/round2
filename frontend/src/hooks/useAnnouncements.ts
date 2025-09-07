import { useState, useEffect, useCallback, useRef } from 'react';
import { Announcement } from '../types/announcements';
import { apiClient } from '../lib/api-client';

interface UseAnnouncementsState {
  announcements: Announcement[];
  loading: boolean;
  error: string | null;
}

export function useAnnouncements() {
  const [state, setState] = useState<UseAnnouncementsState>({
    announcements: [],
    loading: true,
    error: null,
  });

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchAnnouncements = useCallback(async (forceRefresh: boolean = false) => {
    try {
      const announcements = await apiClient.getAnnouncements(forceRefresh);
      setState(prev => ({
        ...prev,
        announcements,
        loading: false,
        error: null,
      }));
    } catch (error: unknown) {
      const message =
        typeof error === 'object' && error !== null && 'message' in error
          ? String((error as { message?: unknown }).message)
          : undefined;
      if (message === 'NOT_MODIFIED') {
        // Just update loading state, keep existing data
        setState(prev => ({ ...prev, loading: false }));
        return;
      }
      
      setState(prev => ({
        ...prev,
        loading: false,
        error: message || 'Failed to fetch announcements',
      }));
    }
  }, []);

  const refresh = useCallback(() => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    fetchAnnouncements(true); // Force refresh bypassing cache
  }, [fetchAnnouncements]);

  useEffect(() => {
    fetchAnnouncements(false); // Initial load without force refresh

    // Poll every 5 seconds for real-time updates
    intervalRef.current = setInterval(() => fetchAnnouncements(false), 5000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [fetchAnnouncements]);

  return {
    ...state,
    refresh,
  };
}
