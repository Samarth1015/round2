export type ReactionType = "up" | "down" | "heart";

export interface Announcement {
  id: string;
  title: string;
  commentCount: number;
  reactions: {
    up: number;
    down: number;
    heart: number;
  };
  lastActivityAt?: string;
}

export interface Comment {
  id: string;
  announcementId: string;
  authorName: string;
  text: string;
  createdAt: string;
}

export interface PaginatedComments {
  items: Comment[];
  nextCursor: string | null;
}

export interface CreateCommentDto {
  authorName: string;
  text: string;
}

export interface CreateReactionDto {
  type: ReactionType;
  userId?: string;
}

export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
}

export interface CreateAnnouncementDto {
  title: string;
}