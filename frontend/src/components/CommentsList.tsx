import { useComments } from '../hooks/useComments';
import { CommentItem } from './CommentItem';

interface CommentsListProps {
  announcementId: string;
}

export function CommentsList({ announcementId }: CommentsListProps) {
  const { comments, loading, error, hasMore, loadMore } = useComments(announcementId);

  if (loading && comments.length === 0) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 mb-4">Failed to load comments</p>
        <p className="text-sm text-gray-600">{error}</p>
      </div>
    );
  }

  if (comments.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">No comments yet</p>
        <p className="text-sm text-gray-500 mt-1">Be the first to share your thoughts!</p>
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {comments.map((comment) => (
        <CommentItem key={comment.id} comment={comment} />
      ))}
      
      {hasMore && (
        <div className="text-center pt-4">
          <button
            onClick={loadMore}
            disabled={loading}
            className={`
              px-4 py-2 bg-gray-100 text-gray-700 rounded-md font-medium
              hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-colors duration-200
            `}
          >
            {loading ? 'Loading...' : 'Load More Comments'}
          </button>
        </div>
      )}
    </div>
  );
}
