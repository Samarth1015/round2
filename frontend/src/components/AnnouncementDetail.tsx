import { useState, useEffect } from 'react';
import { useComments } from '../hooks/useComments';
import { CommentsList } from './CommentsList';
import { CommentForm } from './CommentForm';
import { ReactionButton } from './ReactionButton';
import { Announcement, CreateCommentDto, ReactionType } from '../types/announcements';
import { apiClient } from '../lib/api-client';

interface AnnouncementDetailProps {
  announcementId: string;
  onBack: () => void;
  onRefreshList?: () => void;
}

export function AnnouncementDetail({ announcementId, onBack, onRefreshList }: AnnouncementDetailProps) {
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [pendingReactions, setPendingReactions] = useState<Set<ReactionType>>(new Set());
  
  const { addOptimisticComment, removeOptimisticComment, refresh: refreshComments } = useComments(announcementId);

  // Fetch announcement details
  useEffect(() => {
    const fetchAnnouncement = async () => {
      try {
        setLoading(true);
        const announcements = await apiClient.getAnnouncements();
        const found = announcements.find(a => a.id === announcementId);
        
        if (!found) {
          setError('Announcement not found');
          return;
        }
        
        setAnnouncement(found);
        setError(null);
      } catch (err: unknown) {
        const message =
          typeof err === 'object' && err !== null && 'message' in err
            ? String((err as { message?: unknown }).message)
            : 'Failed to load announcement';
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    fetchAnnouncement();
  }, [announcementId]);

  const handleCommentSubmit = async (commentData: CreateCommentDto) => {
    if (!announcement) return;

    setIsSubmittingComment(true);
    
    // Create optimistic comment
    const optimisticComment = {
      id: `temp-${Date.now()}`,
      announcementId: announcement.id,
      authorName: commentData.authorName,
      text: commentData.text,
      createdAt: new Date().toISOString(),
    };

    try {
      // Add optimistic update
      addOptimisticComment(optimisticComment);
      
      // Make API call
      await apiClient.addComment(announcement.id, commentData);
      
      // Remove optimistic comment and refresh to get real data
      removeOptimisticComment(optimisticComment.id);
      refreshComments();
      
      // Update announcement comment count
      setAnnouncement(prev => prev ? {
        ...prev,
        commentCount: prev.commentCount + 1,
      } : null);
      
      // Refresh the announcements list to show updated comment count
      if (onRefreshList) {
        // Small delay to ensure backend has processed the request
        setTimeout(() => {
          onRefreshList();
        }, 100);
      }
      
    } catch (error: unknown) {
      // Remove optimistic comment on error
      removeOptimisticComment(optimisticComment.id);
      throw error; // Re-throw so CommentForm can handle it
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleReactionClick = async (type: ReactionType) => {
    if (!announcement || pendingReactions.has(type)) return;
    
    setPendingReactions(prev => new Set(prev).add(type));

    try {
      // Optimistically update the count
      const newReactions = { ...announcement.reactions };
      newReactions[type] = newReactions[type] + 1;
      setAnnouncement(prev => prev ? { ...prev, reactions: newReactions } : null);
      
      // Make API call
      await apiClient.addReaction(announcement.id, { type });
      
      // Refresh the announcements list to show updated reaction count
      if (onRefreshList) {
        setTimeout(() => {
          onRefreshList();
        }, 100);
      }
    } catch (error) {
      console.error('Failed to update reaction:', error);
      // Revert optimistic update on error
      const revertedReactions = { ...announcement.reactions };
      revertedReactions[type] = Math.max(0, revertedReactions[type] - 1);
      setAnnouncement(prev => prev ? { ...prev, reactions: revertedReactions } : null);
    } finally {
      setPendingReactions(prev => {
        const next = new Set(prev);
        next.delete(type);
        return next;
      });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading announcement...</p>
        </div>
      </div>
    );
  }

  if (error || !announcement) {
    return (
      <div className="text-center py-12">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
          <h3 className="text-lg font-medium text-red-800 mb-2">Error</h3>
          <p className="text-red-600 mb-4">{error || 'Announcement not found'}</p>
          <button
            onClick={onBack}
            className="px-4 py-2 bg-gray-600 text-white rounded-md font-medium hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors duration-200"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors duration-200"
          >
            ← Back to announcements
          </button>
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          {announcement.title}
        </h1>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <span>💬 {announcement.commentCount} comment{announcement.commentCount !== 1 ? 's' : ''}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <ReactionButton
              type="up"
              count={announcement.reactions.up}
              isActive={false}
              isDisabled={pendingReactions.has('up')}
              onClick={() => handleReactionClick('up')}
            />
            <ReactionButton
              type="down"
              count={announcement.reactions.down}
              isActive={false}
              isDisabled={pendingReactions.has('down')}
              onClick={() => handleReactionClick('down')}
            />
            <ReactionButton
              type="heart"
              count={announcement.reactions.heart}
              isActive={false}
              isDisabled={pendingReactions.has('heart')}
              onClick={() => handleReactionClick('heart')}
            />
          </div>
        </div>
      </div>

      {/* Add Comment Form */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Add a Comment</h2>
        </div>
        <div className="p-6">
          <CommentForm
            onSubmit={handleCommentSubmit}
            isSubmitting={isSubmittingComment}
          />
        </div>
      </div>

      {/* Comments List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Comments</h2>
        </div>
        <div className="p-6">
          <CommentsList announcementId={announcementId} />
        </div>
      </div>
    </div>
  );
}
