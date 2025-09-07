import { apiClient } from '../../lib/api-client';
import { mockAnnouncements, mockPaginatedComments, resetMocks } from '../mocks/api';

// Mock fetch
global.fetch = jest.fn();
const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

describe('ApiClient', () => {
  beforeEach(() => {
    resetMocks();
    mockFetch.mockClear();
  });

  describe('getAnnouncements', () => {
    it('fetches announcements successfully', async () => {
      const mockResponse = {
        ok: true,
        json: () => Promise.resolve(mockAnnouncements),
        headers: new Headers({ 'ETag': 'W/"abc123"' }),
      };
      mockFetch.mockResolvedValue(mockResponse as Response);

      const result = await apiClient.getAnnouncements();

      expect(result).toEqual(mockAnnouncements);
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8080/announcements',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );
    });

    it('sends If-None-Match header on subsequent requests', async () => {
      // First request
      const mockResponse1 = {
        ok: true,
        json: () => Promise.resolve(mockAnnouncements),
        headers: new Headers({ 'ETag': 'W/"abc123"' }),
      };
      mockFetch.mockResolvedValueOnce(mockResponse1 as Response);

      await apiClient.getAnnouncements();

      // Second request should include If-None-Match
      const mockResponse2 = {
        ok: true,
        json: () => Promise.resolve(mockAnnouncements),
        headers: new Headers({ 'ETag': 'W/"def456"' }),
      };
      mockFetch.mockResolvedValueOnce(mockResponse2 as Response);

      await apiClient.getAnnouncements();

      expect(mockFetch).toHaveBeenLastCalledWith(
        'http://localhost:8080/announcements',
        expect.objectContaining({
          headers: expect.objectContaining({
            'If-None-Match': 'W/"abc123"',
          }),
        })
      );
    });

    it('throws NOT_MODIFIED error for 304 responses', async () => {
      const mockResponse = {
        status: 304,
        ok: false,
      };
      mockFetch.mockResolvedValue(mockResponse as Response);

      await expect(apiClient.getAnnouncements()).rejects.toThrow('NOT_MODIFIED');
    });

    it('handles API errors', async () => {
      const mockError = { code: 'server_error', message: 'Internal error' };
      const mockResponse = {
        ok: false,
        status: 500,
        json: () => Promise.resolve(mockError),
      };
      mockFetch.mockResolvedValue(mockResponse as Response);

      await expect(apiClient.getAnnouncements()).rejects.toEqual(mockError);
    });

    it('handles network errors', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      await expect(apiClient.getAnnouncements()).rejects.toEqual({
        code: 'network_error',
        message: 'Failed to connect to server',
      });
    });
  });

  describe('addComment', () => {
    it('adds comment successfully', async () => {
      const newComment = {
        id: 'new-comment',
        announcementId: '1',
        authorName: 'Test User',
        text: 'Test comment',
        createdAt: '2025-09-07T12:00:00Z',
      };

      const mockResponse = {
        ok: true,
        json: () => Promise.resolve(newComment),
        headers: new Headers(),
      };
      mockFetch.mockResolvedValue(mockResponse as Response);

      const result = await apiClient.addComment('1', {
        authorName: 'Test User',
        text: 'Test comment',
      });

      expect(result).toEqual(newComment);
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8080/announcements/1/comments',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            authorName: 'Test User',
            text: 'Test comment',
          }),
        })
      );
    });
  });

  describe('addReaction', () => {
    it('adds reaction with idempotency key', async () => {
      const mockResponse = {
        ok: true,
        json: () => Promise.resolve({ ok: true }),
        headers: new Headers(),
      };
      mockFetch.mockResolvedValue(mockResponse as Response);

      const result = await apiClient.addReaction(
        '1',
        { type: 'up', userId: 'user-123' },
        'idempotency-key-123'
      );

      expect(result).toEqual({ ok: true });
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8080/announcements/1/reactions',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Idempotency-Key': 'idempotency-key-123',
          }),
          body: JSON.stringify({ type: 'up', userId: 'user-123' }),
        })
      );
    });
  });

  describe('removeReaction', () => {
    it('removes reaction successfully', async () => {
      const mockResponse = {
        ok: true,
        json: () => Promise.resolve(),
        headers: new Headers(),
      };
      mockFetch.mockResolvedValue(mockResponse as Response);

      await apiClient.removeReaction('1', 'user-123');

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8080/announcements/1/reactions',
        expect.objectContaining({
          method: 'DELETE',
          headers: expect.objectContaining({
            'x-user-id': 'user-123',
          }),
        })
      );
    });
  });
});
