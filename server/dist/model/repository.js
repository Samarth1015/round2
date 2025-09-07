"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InMemoryAnnouncementsRepository = void 0;
class InMemoryAnnouncementsRepository {
    static getInstance() {
        if (!this.instance)
            this.instance = new InMemoryAnnouncementsRepository();
        return this.instance;
    }
    constructor() {
        this.announcements = [
            { id: "1", title: "Water supply maintenance on Friday", createdAt: new Date().toISOString() },
            { id: "2", title: "Gym closed for cleaning", createdAt: new Date().toISOString() },
        ];
        this.comments = [];
        this.reactions = [];
        this.idempotencyStore = new Map();
    }
    computeAggregates() {
        const now = Date.now();
        // cleanup old idempotency keys (>5min)
        for (const [k, v] of this.idempotencyStore.entries()) {
            if (now - v.at > 5 * 60 * 1000)
                this.idempotencyStore.delete(k);
        }
        const aggregates = this.announcements.map((a) => {
            const commentCount = this.comments.filter((c) => c.announcementId === a.id).length;
            const r = this.reactions.filter((x) => x.announcementId === a.id);
            const reactions = {
                up: r.filter((x) => x.type === "up").length,
                down: r.filter((x) => x.type === "down").length,
                heart: r.filter((x) => x.type === "heart").length,
            };
            const lastFromComments = this.comments
                .filter((c) => c.announcementId === a.id)
                .map((c) => c.createdAt)
                .sort()
                .at(-1);
            const lastFromReactions = r
                .map((x) => x.createdAt)
                .sort()
                .at(-1);
            const lastActivityAt = [a.createdAt, lastFromComments, lastFromReactions]
                .filter(Boolean)
                .sort()
                .at(-1);
            return { id: a.id, title: a.title, commentCount, reactions, lastActivityAt };
        });
        return aggregates;
    }
    getAnnouncementsWithAggregates() {
        const list = this.computeAggregates();
        const etag = `W/"${Buffer.from(JSON.stringify(list)).toString("base64").slice(0, 16)}"`;
        return { list, etag };
    }
    addComment(announcementId, dto) {
        const exists = this.announcements.some((a) => a.id === announcementId);
        if (!exists) {
            const err = new Error("Announcement not found");
            err.status = 404;
            err.code = "not_found";
            throw err;
        }
        const now = new Date().toISOString();
        const created = {
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            announcementId,
            authorName: dto.authorName,
            text: dto.text,
            createdAt: now,
        };
        this.comments.push(created);
        return created;
    }
    getComments(announcementId, query) {
        const all = this.comments
            .filter((c) => c.announcementId === announcementId)
            .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
        let startIndex = 0;
        if (query.cursor) {
            const idx = all.findIndex((c) => c.id === query.cursor);
            if (idx >= 0)
                startIndex = idx + 1;
        }
        const page = all.slice(startIndex, startIndex + query.limit);
        const nextCursor = page.length === query.limit ? page[page.length - 1].id : null;
        return { items: page, nextCursor };
    }
    addReaction(announcementId, dto, idempotencyKey) {
        const exists = this.announcements.some((a) => a.id === announcementId);
        if (!exists) {
            const err = new Error("Announcement not found");
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
        if (existingIdx >= 0)
            this.reactions.splice(existingIdx, 1);
        this.reactions.push({ announcementId, userId, type: dto.type, createdAt: new Date().toISOString() });
        if (idempotencyKey)
            this.idempotencyStore.set(idempotencyKey, { at: Date.now() });
        return { ok: true };
    }
    removeReaction(announcementId, userId) {
        const before = this.reactions.length;
        this.reactions = this.reactions.filter((r) => !(r.announcementId === announcementId && r.userId === userId));
        if (before === this.reactions.length) {
            // not found is fine for idempotent delete
        }
    }
}
exports.InMemoryAnnouncementsRepository = InMemoryAnnouncementsRepository;
InMemoryAnnouncementsRepository.instance = null;
