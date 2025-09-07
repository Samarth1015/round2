// import express, { Router } from "express";
// import { InMemoryAnnouncementsRepository } from "../model/repository";
// import { validateAddCommentDto, validatePaginationDto, validateCreateAnnouncementDto } from "../validation/dto";
// import rateLimit from "express-rate-limit";

// const repo = InMemoryAnnouncementsRepository.getInstance();
// const router = Router();

// // Comments rate limit: 10/min/IP
// const commentsLimiter = rateLimit({ windowMs: 60 * 1000, limit: 10, standardHeaders: true, legacyHeaders: false });

// // Helper to enforce unknown field rejection
// function rejectUnknownFields<T extends object>(allowed: (keyof T)[]) {
//     return (req: express.Request, _res: express.Response, next: express.NextFunction) => {
//         const keys = Object.keys(req.body || {});
//         const extras = keys.filter((k) => !allowed.includes(k as keyof T));
//         if (extras.length > 0) {
//             return next({ status: 400, code: "unknown_fields", message: "Unknown fields", details: { fields: extras } });
//         }
//         next();
//     };
// }

// // GET /announcements (list with aggregates)
// router.get("/", async (_req: express.Request, res: express.Response) => {
//     const { list, etag } = repo.getAnnouncementsWithAggregates();
//     const ifNoneMatch = _req.headers["if-none-match"];
//     if (ifNoneMatch && ifNoneMatch === etag) {
//         return res.status(304).end();
//     }
//     res.setHeader("ETag", etag);
//     return res.status(200).json(list);
// });

// // POST /announcements
// router.post(
//     "/",
//     rejectUnknownFields<{ title: string }>(["title"]),
//     async (req: express.Request, res: express.Response, next: express.NextFunction) => {
//         try {
//             const dto = validateCreateAnnouncementDto(req.body);
//             const created = repo.addAnnouncement(dto);
//             res.status(201).json(created);
//         } catch (err) {
//             next(err);
//         }
//     }
// );

// // POST /announcements/:id/comments
// router.post(
//     "/:id/comments",
//     commentsLimiter,
//     rejectUnknownFields<{ authorName: string; text: string }>(["authorName", "text"]),
//     async (req: express.Request, res: express.Response, next: express.NextFunction) => {
//         try {
//             const id = String(req.params.id);
//             const dto = validateAddCommentDto(req.body);
//             const created = repo.addComment(id, dto);
//             res.status(201).json(created);
//         } catch (err) {
//             next(err);
//         }
//     }
// );

// // GET /announcements/:id/comments?cursor&limit
// router.get("/:id/comments", async (req: express.Request, res: express.Response, next: express.NextFunction) => {
//     try {
//         const id = String(req.params.id);
//         const { cursor, limit } = validatePaginationDto(req.query);
//         const result = repo.getComments(id, { cursor, limit });
//         res.status(200).json(result);
//     } catch (err) {
//         next(err);
//     }
// });

// // POST /announcements/:id/reactions with Idempotency-Key
// router.post(
//     "/:id/reactions",
//     async (req: express.Request, res: express.Response, next: express.NextFunction) => {
//         try {
//             const id = String(req.params.id);
//             const idempotencyKey = String(req.header("Idempotency-Key") || "");
//             const merged = { ...req.query, ...req.body } as any;
//             const rawType = typeof merged.type === "string" ? merged.type.trim().toLowerCase() : merged.type;
//             const type = (rawType === "up" || rawType === "down" || rawType === "heart") ? rawType : "up";
//             const userId = typeof merged.userId === "string" && merged.userId.trim().length > 0 ? merged.userId : "anonymous";
//             const result = repo.addReaction(id, { type, userId }, idempotencyKey);
//             res.status(201).json(result);
//         } catch (err) {
//             next(err);
//         }
//     }
// );

// // DELETE /announcements/:id/reactions
// router.delete("/:id/reactions", async (req: express.Request, res: express.Response, next: express.NextFunction) => {
//     try {
//         const id = String(req.params.id);
//         const merged = { ...req.query, ...req.body } as any;
//         const userIdHeader = req.header("x-user-id") || undefined;
//         const userId = (typeof merged.userId === "string" && merged.userId.trim().length > 0)
//             ? merged.userId
//             : (typeof userIdHeader === "string" && userIdHeader.trim().length > 0 ? userIdHeader : "anonymous");
//         repo.removeReaction(id, userId);
//         res.status(204).end();
//     } catch (err) {
//         next(err);
//     }
// });

// export default router;
// import { validateAddCommentDto, validatePaginationDto, validateCreateAnnouncementDto } from "../validation/dto";
// import rateLimit from "express-rate-limit";

// const repo = InMemoryAnnouncementsRepository.getInstance();
// const router = Router();

// // removed placeholder empty list handler
// // Comments rate limit: 10/min/IP
// const commentsLimiter = rateLimit({ windowMs: 60 * 1000, limit: 10, standardHeaders: true, legacyHeaders: false });

// // Helper to enforce unknown field rejection
// function rejectUnknownFields<T extends object>(allowed: (keyof T)[]) {
//     return (req: express.Request, _res: express.Response, next: express.NextFunction) => {
//         const keys = Object.keys(req.body || {});
//         const extras = keys.filter((k) => !allowed.includes(k as keyof T));
//         if (extras.length > 0) {
//             return next({ status: 400, code: "unknown_fields", message: "Unknown fields", details: { fields: extras } });
//         }
//         next();
//     };
// }

// // GET /announcements (list with aggregates)
// router.get("/", async (_req: express.Request, res: express.Response) => {
//     const { list, etag } = repo.getAnnouncementsWithAggregates();
//     const ifNoneMatch = _req.headers["if-none-match"];
//     if (ifNoneMatch && ifNoneMatch === etag) {
//         return res.status(304).end();
//     }
//     res.setHeader("ETag", etag);
//     return res.status(200).json(list);
// });

// // POST /announcements
// router.post(
//     "/",
//     rejectUnknownFields<{ title: string }>(["title"]),
//     async (req: express.Request, res: express.Response, next: express.NextFunction) => {
//         try {
//             const dto = validateCreateAnnouncementDto(req.body);
//             const created = repo.addAnnouncement(dto);
//             res.status(201).json(created);
//         } catch (err) {
//             next(err);
//         }
//     }
// );

// // POST /announcements/:id/comments
// router.post(
//     "/:id/comments",
//     commentsLimiter,
//     rejectUnknownFields<{ authorName: string; text: string }>(["authorName", "text"]),
//     async (req: express.Request, res: express.Response, next: express.NextFunction) => {
//         try {
//             const id = String(req.params.id);
//             const dto = validateAddCommentDto(req.body);
//             const created = repo.addComment(id, dto);
//             res.status(201).json(created);
//         } catch (err) {
//             next(err);
//         }
//     }
// );

// // GET /announcements/:id/comments?cursor&limit
// router.get("/:id/comments", async (req: express.Request, res: express.Response, next: express.NextFunction) => {
//     try {
//         const id = String(req.params.id);
//         const { cursor, limit } = validatePaginationDto(req.query);
//         const result = repo.getComments(id, { cursor, limit });
//         res.status(200).json(result);
//     } catch (err) {
//         next(err);
//     }
// });

// // POST /announcements/:id/reactions with Idempotency-Key
// router.post(
//     "/:id/reactions",
//     async (req: express.Request, res: express.Response, next: express.NextFunction) => {
//         try {
//             const id = String(req.params.id);
//             const idempotencyKey = String(req.header("Idempotency-Key") || "");
//             const merged = { ...req.query, ...req.body } as any;
//             const rawType = typeof merged.type === "string" ? merged.type.trim().toLowerCase() : merged.type;
//             const type = (rawType === "up" || rawType === "down" || rawType === "heart") ? rawType : "up";
//             const userId = typeof merged.userId === "string" && merged.userId.trim().length > 0 ? merged.userId : "anonymous";
//             const result = repo.addReaction(id, { type, userId }, idempotencyKey);
//             res.status(201).json(result);
//         } catch (err) {
//             next(err);
//         }
//     }
// );

// // DELETE /announcements/:id/reactions uses x-user-id
// router.delete("/:id/reactions", async (req: express.Request, res: express.Response, next: express.NextFunction) => {
//     try {
//         const id = String(req.params.id);
//         const merged = { ...req.query, ...req.body } as any;
//         const userIdHeader = req.header("x-user-id") || undefined;
//         const userId = (typeof merged.userId === "string" && merged.userId.trim().length > 0)
//             ? merged.userId
//             : (typeof userIdHeader === "string" && userIdHeader.trim().length > 0 ? userIdHeader : "anonymous");
