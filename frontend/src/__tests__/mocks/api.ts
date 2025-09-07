// Mock API client for tests
export const mockApiClient = {
  getAnnouncements: jest.fn(),
  getComments: jest.fn(),
  addComment: jest.fn(),
  addReaction: jest.fn(),
  removeReaction: jest.fn(),
};

// Mock data for tests
export const mockAnnouncements = [
  {
    id: '1',
    title: 'Water supply maintenance on Friday',
    commentCount: 3,
    reactions: { up: 5, down: 1, heart: 2 },
    lastActivityAt: '2025-09-07T10:00:00Z',
  },
  {
    id: '2',
    title: 'Gym closed for cleaning',
    commentCount: 0,
    reactions: { up: 0, down: 0, heart: 0 },
    lastActivityAt: '2025-09-06T15:30:00Z',
  },
];

export const mockComments = [
  {
    id: 'comment-1',
    announcementId: '1',
    authorName: 'John Doe',
    text: 'Thanks for the update!',
    createdAt: '2025-09-07T09:00:00Z',
  },
  {
    id: 'comment-2',
    announcementId: '1',
    authorName: 'Jane Smith',
    text: 'What time will the maintenance start?',
    createdAt: '2025-09-07T09:30:00Z',
  },
];

export const mockPaginatedComments = {
  items: mockComments,
  nextCursor: null,
};

// Reset all mocks
export const resetMocks = () => {
  Object.values(mockApiClient).forEach(mock => mock.mockReset());
};
