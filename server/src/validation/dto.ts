import { ReactionType } from "../model/repository";

function isNonEmptyString(v: unknown): v is string {
    return typeof v === "string" && v.trim().length > 0;
}

export function validateAddCommentDto(body: any): { authorName: string; text: string } {
    const errors: any[] = [];
    if (!isNonEmptyString(body?.authorName)) errors.push({ field: "authorName", message: "authorName is required" });
    if (!isNonEmptyString(body?.text)) errors.push({ field: "text", message: "text is required" });
    const textLen = typeof body?.text === "string" ? body.text.trim().length : 0;
    if (textLen < 1 || textLen > 500) errors.push({ field: "text", message: "text must be 1-500 chars" });
    if (errors.length) {
        const err: any = new Error("Validation failed");
        err.status = 400;
        err.code = "validation_error";
        err.details = errors;
        throw err;
    }
    return { authorName: String(body.authorName).trim(), text: String(body.text).trim() };
}

export function validatePaginationDto(query: any): { cursor: string | null; limit: number } {
    const cursor = query?.cursor ? String(query.cursor) : null;
    let limit = query?.limit ? Number(query.limit) : 10;
    if (!Number.isFinite(limit) || limit < 1 || limit > 50) limit = 10;
    return { cursor, limit };
}

export function validateAddReactionDto(body: any): { type: ReactionType; userId?: string } {
    const errors: any[] = [];
    const allowed: ReactionType[] = ["up", "down", "heart"];
    const rawType = typeof body?.type === "string" ? body.type.trim().toLowerCase() : body?.type;
    if (!allowed.includes(rawType)) errors.push({ field: "type", message: "type must be up|down|heart" });
    if (body?.userId != null && typeof body.userId !== "string")
        errors.push({ field: "userId", message: "userId must be string" });
    if (errors.length) {
        const err: any = new Error("Validation failed");
        err.status = 400;
        err.code = "validation_error";
        err.details = errors;
        throw err;
    }
    const dto: { type: ReactionType; userId?: string } = { type: rawType } as any;
    if (body.userId) dto.userId = String(body.userId);
    return dto;
}

export function validateCreateAnnouncementDto(body: any): { title: string } {
    const errors: any[] = [];
    if (!isNonEmptyString(body?.title)) errors.push({ field: "title", message: "title is required" });
    const titleLen = typeof body?.title === "string" ? body.title.trim().length : 0;
    if (titleLen < 1 || titleLen > 200) errors.push({ field: "title", message: "title must be 1-200 chars" });
    if (errors.length) {
        const err: any = new Error("Validation failed");
        err.status = 400;
        err.code = "validation_error";
        err.details = errors;
        throw err;
    }
    return { title: String(body.title).trim() };
}


