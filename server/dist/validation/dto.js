"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateAddCommentDto = validateAddCommentDto;
exports.validatePaginationDto = validatePaginationDto;
exports.validateAddReactionDto = validateAddReactionDto;
function isNonEmptyString(v) {
    return typeof v === "string" && v.trim().length > 0;
}
function validateAddCommentDto(body) {
    const errors = [];
    if (!isNonEmptyString(body?.authorName))
        errors.push({ field: "authorName", message: "authorName is required" });
    if (!isNonEmptyString(body?.text))
        errors.push({ field: "text", message: "text is required" });
    const textLen = typeof body?.text === "string" ? body.text.trim().length : 0;
    if (textLen < 1 || textLen > 500)
        errors.push({ field: "text", message: "text must be 1-500 chars" });
    if (errors.length) {
        const err = new Error("Validation failed");
        err.status = 400;
        err.code = "validation_error";
        err.details = errors;
        throw err;
    }
    return { authorName: String(body.authorName).trim(), text: String(body.text).trim() };
}
function validatePaginationDto(query) {
    const cursor = query?.cursor ? String(query.cursor) : null;
    let limit = query?.limit ? Number(query.limit) : 10;
    if (!Number.isFinite(limit) || limit < 1 || limit > 50)
        limit = 10;
    return { cursor, limit };
}
function validateAddReactionDto(body) {
    const errors = [];
    const allowed = ["up", "down", "heart"];
    if (!allowed.includes(body?.type))
        errors.push({ field: "type", message: "type must be up|down|heart" });
    if (body?.userId != null && typeof body.userId !== "string")
        errors.push({ field: "userId", message: "userId must be string" });
    if (errors.length) {
        const err = new Error("Validation failed");
        err.status = 400;
        err.code = "validation_error";
        err.details = errors;
        throw err;
    }
    const dto = { type: body.type };
    if (body.userId)
        dto.userId = String(body.userId);
    return dto;
}
