import { Announcement, Comment, PaginatedComments, CreateCommentDto, CreateReactionDto, ApiError } from '../types/announcements';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

class ApiClient {
  private etagCache: Map<string, string> = new Map();

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      // Handle 304 Not Modified for ETag
      if (response.status === 304) {
        throw new Error('NOT_MODIFIED');
      }

      if (!response.ok) {
        const error: ApiError = await response.json().catch(() => ({
          code: 'network_error',
          message: `HTTP ${response.status}`,
        }));
        throw error;
      }

      // Store ETag if present
      const etag = response.headers.get('ETag');
      if (etag) {
        this.etagCache.set(endpoint, etag);
      }

      return response.json();
    } catch (error) {
      if (error instanceof Error && error.message === 'NOT_MODIFIED') {
        throw error;
      }
      
      if (typeof error === 'object' && error !== null && 'code' in error) {
        throw error;
      }
      
      throw {
        code: 'network_error',
        message: 'Failed to connect to server',
      } as ApiError;
    }
  }

  async getAnnouncements(forceRefresh: boolean = false): Promise<Announcement[]> {
    const endpoint = '/announcements';
    const etag = forceRefresh ? null : this.etagCache.get(endpoint);
    
    const headers: Record<string, string> = {};
    if (etag) {
      headers['If-None-Match'] = etag;
    }

    try {
      return await this.request<Announcement[]>(endpoint, { headers });
    } catch (error) {
      if (error instanceof Error && error.message === 'NOT_MODIFIED') {
        // Return cached data - in a real app you'd have actual cache
        throw error;
      }
      throw error;
    }
  }

  async getComments(
    announcementId: string,
    cursor?: string | null,
    limit: number = 10
  ): Promise<PaginatedComments> {
    const params = new URLSearchParams();
    if (cursor) params.append('cursor', cursor);
    params.append('limit', limit.toString());
    
    const endpoint = `/announcements/${announcementId}/comments?${params}`;
    return this.request<PaginatedComments>(endpoint);
  }

  async addComment(
    announcementId: string,
    comment: CreateCommentDto
  ): Promise<Comment> {
    const endpoint = `/announcements/${announcementId}/comments`;
    
    // Clear the announcements ETag cache BEFORE making the request
    this.etagCache.delete('/announcements');
    
    const result = await this.request<Comment>(endpoint, {
      method: 'POST',
      body: JSON.stringify(comment),
    });
    
    return result;
  }

  async addReaction(
    announcementId: string,
    reaction: CreateReactionDto,
    idempotencyKey?: string
  ): Promise<{ ok: true }> {
    const endpoint = `/announcements/${announcementId}/reactions`;
    const headers: Record<string, string> = {};
    
    if (idempotencyKey) {
      headers['Idempotency-Key'] = idempotencyKey;
    }

    // Clear the announcements ETag cache BEFORE making the request
    this.etagCache.delete('/announcements');

    const result = await this.request<{ ok: true }>(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(reaction),
    });
    
    return result;
  }

  async removeReaction(
    announcementId: string,
    userId: string
  ): Promise<void> {
    const endpoint = `/announcements/${announcementId}/reactions`;
    
    // Clear the announcements ETag cache BEFORE making the request
    this.etagCache.delete('/announcements');
    
    await this.request(endpoint, {
      method: 'DELETE',
      headers: {
        'x-user-id': userId,
      },
    });
  }
}

export const apiClient = new ApiClient();
