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
    addReaction(announcementId: string, dto: { type: string }): { ok: true };
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
    private reactionCounts: Map<string, { up: number; down: number; heart: number }> = new Map([
        ["1", { up: 0, down: 0, heart: 0 }],
        ["2", { up: 0, down: 0, heart: 0 }],
    ]);

    private constructor() {}

    private computeAggregates() {
        const aggregates = this.announcements.map((a) => {
            const commentCount = this.comments.filter((c) => c.announcementId === a.id).length;
            const reactions = this.reactionCounts.get(a.id) || { up: 0, down: 0, heart: 0 };
            
            console.log(`Computing aggregates for ${a.id}:`, reactions);
            
            const sortedCommentTimes = this.comments
                .filter((c) => c.announcementId === a.id)
                .map((c) => c.createdAt)
                .sort();
            const lastFromComments = sortedCommentTimes.length
                ? sortedCommentTimes[sortedCommentTimes.length - 1]
                : undefined;
            
            const activity = [a.createdAt, lastFromComments].filter(Boolean) as string[];
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

    addReaction(announcementId: string, dto: { type: string }): { ok: true } {
        const exists = this.announcements.some((a) => a.id === announcementId);
        if (!exists) {
            const err: any = new Error("Announcement not found");
            err.status = 404;
            err.code = "not_found";
            throw err;
        }

        // Ensure reaction counts exist for this announcement
        if (!this.reactionCounts.has(announcementId)) {
            this.reactionCounts.set(announcementId, { up: 0, down: 0, heart: 0 });
        }
        
        const current = this.reactionCounts.get(announcementId)!;
        
        // Map any type to our standard types, default to 'up' if not recognized
        const type = dto.type.toLowerCase();
        if (type === 'up' || type === 'down' || type === 'heart') {
            current[type] += 1;
        } else {
            // For any other type, just increment 'up' as default
            current.up += 1;
        }
        
        // Update the map with the modified counts
        this.reactionCounts.set(announcementId, current);
        
        console.log(`Reaction added: ${announcementId} - ${type} = ${current[type as keyof typeof current]}`);
        
        return { ok: true };
    }
}


