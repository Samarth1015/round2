import serveConfig from "./config/config";
import express from "express";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import pingRoute from "./routes/ping";
import announcementsRouter from "./routes/announcements";

const app = express();

// Security & platform middleware
app.use(helmet());
app.use(
    cors({
        origin: process.env.FRONTEND_ORIGIN || "http://localhost:3000",
        credentials: true,
    })
);
app.use(express.json({ limit: "200kb" }));

// Global rate limit: 60 req/min/IP
const globalLimiter = rateLimit({
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
app.use("/ping", pingRoute);
app.use("/announcements", announcementsRouter);

// Structured error handler
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    const status = typeof err.status === "number" ? err.status : 500;
    const code = err.code || (status >= 500 ? "internal_error" : "bad_request");
    const message = err.message || "Unexpected error";
    const details = err.details;
    res.status(status).json({ code, message, ...(details ? { details } : {}) });
});

export default app;
