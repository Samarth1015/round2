import { useState, useEffect } from 'react';
import { Announcement, ReactionType } from '../types/announcements';
import { ReactionButton } from './ReactionButton';
import { apiClient } from '../lib/api-client';

interface AnnouncementCardProps {
  announcement: Announcement;
  onClick: () => void;
  onReactionUpdate?: () => void;
}

export function AnnouncementCard({ announcement, onClick, onReactionUpdate }: AnnouncementCardProps) {
  const [optimisticReactions, setOptimisticReactions] = useState(announcement.reactions);
  const [pendingReactions, setPendingReactions] = useState<Set<ReactionType>>(new Set());

  // Sync optimistic state with server data when announcement changes
  useEffect(() => {
    setOptimisticReactions(announcement.reactions);
  }, [announcement.reactions]);

  const formatLastActivity = (dateString?: string) => {
    if (!dateString) return null;
    
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const handleReactionClick = async (type: ReactionType) => {
    if (pendingReactions.has(type)) return;
    
    setPendingReactions(prev => new Set(prev).add(type));

    try {
      // Optimistically update the count
      setOptimisticReactions(prev => ({
        ...prev,
        [type]: prev[type] + 1,
      }));
      
      // Make API call
      await apiClient.addReaction(announcement.id, { type });
      
      if (onReactionUpdate) {
        onReactionUpdate();
      }
    } catch (error) {
      console.error('Failed to update reaction:', error);
      // Revert optimistic update on error - use the original server data
      setOptimisticReactions(announcement.reactions);
    } finally {
      setPendingReactions(prev => {
        const next = new Set(prev);
        next.delete(type);
        return next;
      });
    }
  };

  const lastActivity = formatLastActivity(announcement.lastActivityAt);

  return (
    <div 
      className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200 cursor-pointer"
      onClick={onClick}
    >
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          {announcement.title}
        </h2>
        
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <span className="flex items-center gap-1">
            💬 {announcement.commentCount} comment{announcement.commentCount !== 1 ? 's' : ''}
          </span>
          
          {lastActivity && (
            <span className="flex items-center gap-1">
              🕒 {lastActivity}
            </span>
          )}
        </div>
      </div>

      <div 
        className="flex items-center gap-2"
        onClick={(e) => e.stopPropagation()} // Prevent card click when interacting with reactions
      >
        <ReactionButton
          type="up"
          count={optimisticReactions.up}
          isActive={false}
          isDisabled={pendingReactions.has('up')}
          onClick={() => handleReactionClick('up')}
        />
        <ReactionButton
          type="down"
          count={optimisticReactions.down}
          isActive={false}
          isDisabled={pendingReactions.has('down')}
          onClick={() => handleReactionClick('down')}
        />
        <ReactionButton
          type="heart"
          count={optimisticReactions.heart}
          isActive={false}
          isDisabled={pendingReactions.has('heart')}
          onClick={() => handleReactionClick('heart')}
        />
      </div>
    </div>
  );
}
