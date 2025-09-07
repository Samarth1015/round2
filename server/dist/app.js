"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const helmet_1 = __importDefault(require("helmet"));
const cors_1 = __importDefault(require("cors"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const ping_1 = __importDefault(require("./routes/ping"));
const announcements_1 = __importDefault(require("./routes/announcements"));
const app = (0, express_1.default)();
// Security & platform middleware
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: process.env.FRONTEND_ORIGIN || "*",
    credentials: true,
}));
app.use(express_1.default.json({ limit: "200kb" }));
// Global rate limit: 60 req/min/IP
const globalLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 1000,
    limit: 60,
    standardHeaders: true,
    legacyHeaders: false,
});
app.use(globalLimiter);
// Health
app.get("/health", (_req, res) => {
    res.status(200).json({ status: "ok" });
});
// Routes
app.use("/ping", ping_1.default);
app.use("/announcements", announcements_1.default);
// Structured error handler
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err, _req, res, _next) => {
    const status = typeof err.status === "number" ? err.status : 500;
    const code = err.code || (status >= 500 ? "internal_error" : "bad_request");
    const message = err.message || "Unexpected error";
    const details = err.details;
    res.status(status).json({ code, message, ...(details ? { details } : {}) });
});
exports.default = app;
