import { useState } from 'react';
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
  const [userReaction, setUserReaction] = useState<ReactionType | null>(null);

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

    const userId = 'user-123'; // In real app, get from auth context
    const idempotencyKey = `${announcement.id}-${userId}-${type}-${Date.now()}`;
    
    setPendingReactions(prev => new Set(prev).add(type));

    try {
      if (userReaction === type) {
        // Remove reaction
        setOptimisticReactions(prev => ({
          ...prev,
          [type]: Math.max(0, prev[type] - 1),
        }));
        setUserReaction(null);
        
        await apiClient.removeReaction(announcement.id, userId);
      } else {
        // Add/change reaction
        const newReactions = { ...optimisticReactions };
        
        // Remove previous reaction if exists
        if (userReaction) {
          newReactions[userReaction] = Math.max(0, newReactions[userReaction] - 1);
        }
        
        // Add new reaction
        newReactions[type] = newReactions[type] + 1;
        
        setOptimisticReactions(newReactions);
        setUserReaction(type);
        
        await apiClient.addReaction(announcement.id, { type, userId }, idempotencyKey);
      }
      
      // Refresh parent data
      onReactionUpdate?.();
    } catch (error) {
      // Rollback optimistic update
      setOptimisticReactions(announcement.reactions);
      setUserReaction(null);
      console.error('Failed to update reaction:', error);
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
          isActive={userReaction === 'up'}
          isDisabled={pendingReactions.has('up')}
          onClick={() => handleReactionClick('up')}
        />
        <ReactionButton
          type="down"
          count={optimisticReactions.down}
          isActive={userReaction === 'down'}
          isDisabled={pendingReactions.has('down')}
          onClick={() => handleReactionClick('down')}
        />
        <ReactionButton
          type="heart"
          count={optimisticReactions.heart}
          isActive={userReaction === 'heart'}
          isDisabled={pendingReactions.has('heart')}
          onClick={() => handleReactionClick('heart')}
        />
      </div>
    </div>
  );
}
