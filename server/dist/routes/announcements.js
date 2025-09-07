"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const repository_1 = require("../model/repository");
const dto_1 = require("../validation/dto");
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const repo = repository_1.InMemoryAnnouncementsRepository.getInstance();
const router = (0, express_1.Router)();
// Comments rate limit: 10/min/IP
const commentsLimiter = (0, express_rate_limit_1.default)({ windowMs: 60 * 1000, limit: 10, standardHeaders: true, legacyHeaders: false });
// Helper to enforce unknown field rejection
function rejectUnknownFields(allowed) {
    return (req, _res, next) => {
        const keys = Object.keys(req.body || {});
        const extras = keys.filter((k) => !allowed.includes(k));
        if (extras.length > 0) {
            return next({ status: 400, code: "unknown_fields", message: "Unknown fields", details: { fields: extras } });
        }
        next();
    };
}
// GET /announcements (list with aggregates)
router.get("/", async (_req, res) => {
    const { list, etag } = repo.getAnnouncementsWithAggregates();
    const ifNoneMatch = _req.headers["if-none-match"];
    if (ifNoneMatch && ifNoneMatch === etag) {
        return res.status(304).end();
    }
    res.setHeader("ETag", etag);
    return res.status(200).json(list);
});
// POST /announcements/:id/comments
router.post("/:id/comments", commentsLimiter, rejectUnknownFields(["authorName", "text"]), async (req, res, next) => {
    try {
        const id = String(req.params.id);
        const dto = (0, dto_1.validateAddCommentDto)(req.body);
        const created = repo.addComment(id, dto);
        res.status(201).json(created);
    }
    catch (err) {
        next(err);
    }
});
// GET /announcements/:id/comments?cursor&limit
router.get("/:id/comments", async (req, res, next) => {
    try {
        const id = String(req.params.id);
        const { cursor, limit } = (0, dto_1.validatePaginationDto)(req.query);
        const result = repo.getComments(id, { cursor, limit });
        res.status(200).json(result);
    }
    catch (err) {
        next(err);
    }
});
// POST /announcements/:id/reactions with Idempotency-Key
router.post("/:id/reactions", rejectUnknownFields(["type", "userId"]), async (req, res, next) => {
    try {
        const id = String(req.params.id);
        const idempotencyKey = String(req.header("Idempotency-Key") || "");
        const dto = (0, dto_1.validateAddReactionDto)(req.body);
        const result = repo.addReaction(id, dto, idempotencyKey);
        res.status(201).json(result);
    }
    catch (err) {
        next(err);
    }
});
// DELETE /announcements/:id/reactions uses x-user-id
router.delete("/:id/reactions", async (req, res, next) => {
    try {
        const id = String(req.params.id);
        const userId = String(req.header("x-user-id") || "");
        if (!userId) {
            return next({ status: 400, code: "missing_user_id", message: "x-user-id header required" });
        }
        repo.removeReaction(id, userId);
        res.status(204).end();
    }
    catch (err) {
        next(err);
    }
});
exports.default = router;
