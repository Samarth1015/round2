import { useState, useEffect, useCallback } from 'react';
import { Comment, PaginatedComments } from '../types/announcements';
import { apiClient } from '../lib/api-client';

interface UseCommentsState {
  comments: Comment[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  nextCursor: string | null;
}

export function useComments(announcementId: string) {
  const [state, setState] = useState<UseCommentsState>({
    comments: [],
    loading: true,
    error: null,
    hasMore: false,
    nextCursor: null,
  });

  const fetchComments = useCallback(async (cursor?: string | null, append = false) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      const result: PaginatedComments = await apiClient.getComments(announcementId, cursor);
      
      setState(prev => ({
        ...prev,
        comments: append ? [...prev.comments, ...result.items] : result.items,
        loading: false,
        hasMore: result.nextCursor !== null,
        nextCursor: result.nextCursor,
      }));
    } catch (err: unknown) {
      const message = typeof err === 'object' && err !== null && 'message' in err ? String((err as any).message) : 'Failed to fetch comments';
      setState(prev => ({
        ...prev,
        loading: false,
        error: message,
      }));
    }
  }, [announcementId]);

  const loadMore = useCallback(() => {
    if (state.nextCursor && !state.loading) {
      fetchComments(state.nextCursor, true);
    }
  }, [state.nextCursor, state.loading, fetchComments]);

  const refresh = useCallback(() => {
    fetchComments(null, false);
  }, [fetchComments]);

  const addOptimisticComment = useCallback((comment: Comment) => {
    setState(prev => ({
      ...prev,
      comments: [...prev.comments, comment],
    }));
  }, []);

  const removeOptimisticComment = useCallback((commentId: string) => {
    setState(prev => ({
      ...prev,
      comments: prev.comments.filter(c => c.id !== commentId),
    }));
  }, []);

  useEffect(() => {
    if (announcementId) {
      fetchComments();
    }
  }, [announcementId, fetchComments]);

  return {
    ...state,
    loadMore,
    refresh,
    addOptimisticComment,
    removeOptimisticComment,
  };
}
