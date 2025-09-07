export type ReactionType = "up" | "down" | "heart";

export interface Announcement {
    id: string;
    title: string;
    createdAt: string; // ISO
}

export interface Comment {
    id: string;
    announcementId: string;
    authorName: string;
    text: string;
    createdAt: string; // ISO
}

export interface Reaction {
    announcementId: string;
    userId: string;
    type: ReactionType;
    createdAt: string; // ISO
}

export interface PaginationQuery {
    cursor?: string | null;
    limit: number;
}

export interface PaginatedComments {
    items: Comment[];
    nextCursor: string | null;
}

interface AnnouncementsRepository {
    getAnnouncementsWithAggregates(): { list: any[]; etag: string };
    addAnnouncement(dto: { title: string }): Announcement;
    addComment(announcementId: string, dto: { authorName: string; text: string }): Comment;
    getComments(announcementId: string, query: PaginationQuery): PaginatedComments;
    addReaction(
        announcementId: string,
        dto: { type: ReactionType; userId?: string },
        idempotencyKey?: string
    ): { ok: true };
    removeReaction(announcementId: string, userId: string): void;
}

export class InMemoryAnnouncementsRepository implements AnnouncementsRepository {
    private static instance: InMemoryAnnouncementsRepository | null = null;

    static getInstance(): InMemoryAnnouncementsRepository {
        if (!this.instance) this.instance = new InMemoryAnnouncementsRepository();
        return this.instance;
    }

    private announcements: Announcement[] = [
        { id: "1", title: "Water supply maintenance on Friday", createdAt: new Date().toISOString() },
        { id: "2", title: "Gym closed for cleaning", createdAt: new Date().toISOString() },
    ];
    private comments: Comment[] = [];
    private reactions: Reaction[] = [];
    private idempotencyStore: Map<string, { at: number }> = new Map();

    private constructor() {}

    private computeAggregates() {
        const now = Date.now();
        // cleanup old idempotency keys (>5min)
        for (const [k, v] of this.idempotencyStore.entries()) {
            if (now - v.at > 5 * 60 * 1000) this.idempotencyStore.delete(k);
        }

        const aggregates = this.announcements.map((a) => {
            const commentCount = this.comments.filter((c) => c.announcementId === a.id).length;
            const r = this.reactions.filter((x) => x.announcementId === a.id);
            const reactions = {
                up: r.filter((x) => x.type === "up").length,
                down: r.filter((x) => x.type === "down").length,
                heart: r.filter((x) => x.type === "heart").length,
            };
            const sortedCommentTimes = this.comments
                .filter((c) => c.announcementId === a.id)
                .map((c) => c.createdAt)
                .sort();
            const lastFromComments = sortedCommentTimes.length
                ? sortedCommentTimes[sortedCommentTimes.length - 1]
                : undefined;
            const sortedReactionTimes = r.map((x) => x.createdAt).sort();
            const lastFromReactions = sortedReactionTimes.length
                ? sortedReactionTimes[sortedReactionTimes.length - 1]
                : undefined;
            const activity = [a.createdAt, lastFromComments, lastFromReactions].filter(Boolean) as string[];
            const lastActivityAt = activity.length ? activity.sort()[activity.length - 1] : undefined;
            return { id: a.id, title: a.title, commentCount, reactions, lastActivityAt };
        });
        return aggregates;
    }

    getAnnouncementsWithAggregates(): { list: any[]; etag: string } {
        const list = this.computeAggregates();
        const etag = `W/"${Buffer.from(JSON.stringify(list)).toString("base64").slice(0, 16)}"`;
        return { list, etag };
    }

    addAnnouncement(dto: { title: string }): Announcement {
        const created: Announcement = {
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            title: dto.title,
            createdAt: new Date().toISOString(),
        };
        this.announcements.unshift(created);
        return created;
    }

    addComment(announcementId: string, dto: { authorName: string; text: string }): Comment {
        const exists = this.announcements.some((a) => a.id === announcementId);
        if (!exists) {
            const err: any = new Error("Announcement not found");
            err.status = 404;
            err.code = "not_found";
            throw err;
        }
        const now = new Date().toISOString();
        const created: Comment = {
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            announcementId,
            authorName: dto.authorName,
            text: dto.text,
            createdAt: now,
        };
        this.comments.push(created);
        return created;
    }

    getComments(announcementId: string, query: PaginationQuery): PaginatedComments {
        const all = this.comments
            .filter((c) => c.announcementId === announcementId)
            .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
        let startIndex = 0;
        if (query.cursor) {
            const idx = all.findIndex((c) => c.id === query.cursor);
            if (idx >= 0) startIndex = idx + 1;
        }
        const page = all.slice(startIndex, startIndex + query.limit);
        const nextCursor = page.length === query.limit ? page[page.length - 1].id : null;
        return { items: page, nextCursor };
    }

    addReaction(
        announcementId: string,
        dto: { type: ReactionType; userId?: string },
        idempotencyKey?: string
    ): { ok: true } {
        const exists = this.announcements.some((a) => a.id === announcementId);
        if (!exists) {
            const err: any = new Error("Announcement not found");
            err.status = 404;
            err.code = "not_found";
            throw err;
        }
        const userId = dto.userId || "anonymous";

        if (idempotencyKey) {
            if (this.idempotencyStore.has(idempotencyKey)) {
                return { ok: true };
            }
        }

        // ensure single reaction per user per announcement
        const existingIdx = this.reactions.findIndex((r) => r.announcementId === announcementId && r.userId === userId);
        if (existingIdx >= 0) this.reactions.splice(existingIdx, 1);
        this.reactions.push({ announcementId, userId, type: dto.type, createdAt: new Date().toISOString() });

        if (idempotencyKey) this.idempotencyStore.set(idempotencyKey, { at: Date.now() });
        return { ok: true };
    }

    removeReaction(announcementId: string, userId: string): void {
        const before = this.reactions.length;
        this.reactions = this.reactions.filter((r) => !(r.announcementId === announcementId && r.userId === userId));
        if (before === this.reactions.length) {
            // not found is fine for idempotent delete
        }
    }
}


