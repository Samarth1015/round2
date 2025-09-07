import { ReactionType } from '../types/announcements';

interface ReactionButtonProps {
  type: ReactionType;
  count: number;
  isActive?: boolean;
  isDisabled?: boolean;
  onClick: () => void;
}

const reactionEmojis: Record<ReactionType, string> = {
  up: '👍',
  down: '👎',
  heart: '❤️',
};

export function ReactionButton({ 
  type, 
  count, 
  isActive = false, 
  isDisabled = false, 
  onClick 
}: ReactionButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={isDisabled}
      className={`
        inline-flex items-center gap-1 px-2 py-1 rounded-md text-sm font-medium
        transition-colors duration-200 border
        ${isActive 
          ? 'bg-blue-100 border-blue-300 text-blue-800' 
          : 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200'
        }
        ${isDisabled 
          ? 'opacity-50 cursor-not-allowed' 
          : 'cursor-pointer'
        }
      `}
    >
      <span className="text-base">{reactionEmojis[type]}</span>
      <span>{count}</span>
    </button>
  );
}
