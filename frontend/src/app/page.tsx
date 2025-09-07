'use client';

import { useState, useRef } from 'react';
import { AnnouncementsList } from '../components/AnnouncementsList';
import { AnnouncementDetail } from '../components/AnnouncementDetail';

export default function Home() {
  const [selectedAnnouncementId, setSelectedAnnouncementId] = useState<string | null>(null);
  const announcementsRefreshRef = useRef<() => void>(() => {});

  const handleAnnouncementClick = (announcementId: string) => {
    setSelectedAnnouncementId(announcementId);
  };

  const handleBackToList = () => {
    setSelectedAnnouncementId(null);
    // Refresh the announcements list when returning from detail view
    if (announcementsRefreshRef.current) {
      announcementsRefreshRef.current();
    }
  };

  const handleCommentAdded = () => {
    // Refresh the announcements list when a comment is added
    if (announcementsRefreshRef.current) {
      announcementsRefreshRef.current();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-2xl font-bold text-gray-900">
              Community Announcements
            </h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {selectedAnnouncementId ? (
          <AnnouncementDetail
            announcementId={selectedAnnouncementId}
            onBack={handleBackToList}
            onRefreshList={handleCommentAdded}
          />
        ) : (
          <AnnouncementsList 
            onAnnouncementClick={handleAnnouncementClick}
            refreshRef={announcementsRefreshRef}
          />
        )}
      </main>
    </div>
  );
}
