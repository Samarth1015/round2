import { useAnnouncements } from '../hooks/useAnnouncements';
import { AnnouncementCard } from './AnnouncementCard';
import { useImperativeHandle, MutableRefObject } from 'react';

interface AnnouncementsListProps {
  onAnnouncementClick: (announcementId: string) => void;
  refreshRef?: MutableRefObject<(() => void) | undefined>;
}

export function AnnouncementsList({ onAnnouncementClick, refreshRef }: AnnouncementsListProps) {
  const { announcements, loading, error, refresh } = useAnnouncements();

  // Expose refresh function via ref
  useImperativeHandle(refreshRef, () => refresh, [refresh]);

  if (loading && announcements.length === 0) {
    return (
      <div className="flex justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading announcements...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
          <h3 className="text-lg font-medium text-red-800 mb-2">Failed to load announcements</h3>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={refresh}
            className="px-4 py-2 bg-red-600 text-white rounded-md font-medium hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors duration-200"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (announcements.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 max-w-md mx-auto">
          <h3 className="text-lg font-medium text-gray-900 mb-2">No announcements</h3>
          <p className="text-gray-600">Check back later for community updates!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {announcements.map((announcement) => (
        <AnnouncementCard
          key={announcement.id}
          announcement={announcement}
          onClick={() => onAnnouncementClick(announcement.id)}
          onReactionUpdate={refresh}
        />
      ))}
    </div>
  );
}
