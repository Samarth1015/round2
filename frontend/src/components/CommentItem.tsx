import { Comment } from '../types/announcements';

interface CommentItemProps {
  comment: Comment;
}

export function CommentItem({ comment }: CommentItemProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="border-b border-gray-200 py-4 last:border-b-0">
      <div className="flex justify-between items-start mb-2">
        <h4 className="font-medium text-gray-900">{comment.authorName}</h4>
        <time className="text-sm text-gray-500" dateTime={comment.createdAt}>
          {formatDate(comment.createdAt)}
        </time>
      </div>
      <p className="text-gray-700 whitespace-pre-wrap">{comment.text}</p>
    </div>
  );
}
