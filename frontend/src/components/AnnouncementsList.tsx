import { useState } from 'react';
import { useAnnouncements } from '../hooks/useAnnouncements';
import { AnnouncementCard } from './AnnouncementCard';
import { apiClient } from '../lib/api-client';

interface AnnouncementsListProps {
  onAnnouncementClick: (announcementId: string) => void;
}

export function AnnouncementsList({ onAnnouncementClick }: AnnouncementsListProps) {
  const { announcements, loading, error, refresh } = useAnnouncements();
  const [newTitle, setNewTitle] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const handleCreate = async () => {
    const title = newTitle.trim();
    if (!title) return;
    setCreating(true);
    setCreateError(null);
    try {
      await apiClient.createAnnouncement({ title });
      setNewTitle('');
      refresh();
    } catch (e: any) {
      setCreateError(e?.message || 'Failed to create announcement');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex gap-2 items-center">
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Announcement title"
            className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={creating}
          />
          <button
            onClick={handleCreate}
            disabled={creating || newTitle.trim().length === 0}
            className="px-4 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {creating ? 'Adding...' : 'Add Announcement'}
          </button>
        </div>
        {createError && (
          <p className="text-sm text-red-600 mt-2">{createError}</p>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-red-800 mb-2">Failed to load announcements</h3>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={refresh}
            className="px-4 py-2 bg-red-600 text-white rounded-md font-medium hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors duration-200"
          >
            Try Again
          </button>
        </div>
      )}

      {loading && announcements.length === 0 && (
        <div className="flex justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading announcements...</p>
          </div>
        </div>
      )}

      {!loading && announcements.length === 0 && !error && (
        <div className="text-center py-12">
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 max-w-md mx-auto">
            <h3 className="text-lg font-medium text-gray-900 mb-2">No announcements</h3>
            <p className="text-gray-600">Add the first announcement using the form above.</p>
          </div>
        </div>
      )}

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
