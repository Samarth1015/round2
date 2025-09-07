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

  const intervalRef = useRef<NodeJS.Timeout>();

  const fetchAnnouncements = useCallback(async () => {
    try {
      const announcements = await apiClient.getAnnouncements();
      setState(prev => ({
        ...prev,
        announcements,
        loading: false,
        error: null,
      }));
    } catch (err: unknown) {
      const message = typeof err === 'object' && err !== null && 'message' in err ? String((err as any).message) : 'Failed to fetch announcements';
      if (message === 'NOT_MODIFIED') {
        // Just update loading state, keep existing data
        setState(prev => ({ ...prev, loading: false }));
        return;
      }
      
      setState(prev => ({
        ...prev,
        loading: false,
        error: message,
      }));
    }
  }, []);

  const refresh = useCallback(() => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  useEffect(() => {
    fetchAnnouncements();

    // Poll every 5 seconds for real-time updates
    intervalRef.current = setInterval(fetchAnnouncements, 5000);

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
