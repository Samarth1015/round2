import { Router, Request, Response, NextFunction } from "express";
import { InMemoryAnnouncementsRepository } from "../model/repository";
import { validateAddCommentDto, validatePaginationDto } from "../validation/dto";
import rateLimit from "express-rate-limit";

const repo = InMemoryAnnouncementsRepository.getInstance();
const router = Router();

// Comments rate limit: 10/min/IP
const commentsLimiter = rateLimit({ windowMs: 60 * 1000, limit: 10, standardHeaders: true, legacyHeaders: false });

// Helper to enforce unknown field rejection
function rejectUnknownFields<T extends object>(allowed: (keyof T)[]) {
    return (req: Request, _res: Response, next: NextFunction) => {
        const keys = Object.keys(req.body || {});
        const extras = keys.filter((k) => !allowed.includes(k as keyof T));
        if (extras.length > 0) {
            return next({ status: 400, code: "unknown_fields", message: "Unknown fields", details: { fields: extras } });
        }
        next();
    };
}

// GET /announcements (list with aggregates)
router.get("/", async (_req: Request, res: Response) => {
    const { list, etag } = repo.getAnnouncementsWithAggregates();
    const ifNoneMatch = _req.headers["if-none-match"];
    if (ifNoneMatch && ifNoneMatch === etag) {
        return res.status(304).end();
    }
    res.setHeader("ETag", etag);
    return res.status(200).json(list);
});

// POST /announcements/:id/comments
router.post(
    "/:id/comments",
    commentsLimiter,
    rejectUnknownFields<{ authorName: string; text: string }>(["authorName", "text"]),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const id = String(req.params.id);
            const dto = validateAddCommentDto(req.body);
            const created = repo.addComment(id, dto);
            res.status(201).json(created);
        } catch (err) {
            next(err);
        }
    }
);

// GET /announcements/:id/comments?cursor&limit
router.get("/:id/comments", async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id = String(req.params.id);
        const { cursor, limit } = validatePaginationDto(req.query);
        const result = repo.getComments(id, { cursor, limit });
        res.status(200).json(result);
    } catch (err) {
        next(err);
    }
});

// POST /announcements/:id/reactions - simple counter increment (no validation)
router.post("/:id/reactions", async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id = String(req.params.id);
        const type = String(req.body?.type || "up").toLowerCase();
        const result = repo.addReaction(id, { type: type as any });
        res.status(201).json(result);
    } catch (err) {
        next(err);
    }
});

export default router;
