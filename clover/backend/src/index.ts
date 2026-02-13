import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./openapi";
import authRoutes from "./routes/auth";
import userRoutes from "./routes/users";
import adminRoutes from "./routes/admin";

dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || "4000", 10);
const NODE_ENV = process.env.NODE_ENV || "development";

// ─── CORS ───────────────────────────────────────────
// In production, set ALLOWED_ORIGINS to a comma-separated list:
//   ALLOWED_ORIGINS=https://clover.app,https://admin.cloverdata.io
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",").map((s) => s.trim())
  : null; // null = allow all in development

app.use(cors({
  origin: allowedOrigins
    ? (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error(`CORS: Origin ${origin} not allowed`));
        }
      }
    : true, // Allow all origins in development
  credentials: true,
}));

// ─── Rate Limiting ──────────────────────────────────
// General limiter: 100 requests per minute per IP
const generalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: "Too many requests. Please slow down." },
});

// Strict limiter for auth endpoints: 10 per minute per IP
const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: "Too many login attempts. Try again in a minute." },
});

// Upload limiter: 5 per minute per IP
const uploadLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: "Upload limit reached. Try again shortly." },
});

app.use("/api", generalLimiter);
app.use("/api/auth", authLimiter);

// ─── Body Parsing ───────────────────────────────────
app.use(express.json({ limit: "10mb" }));

// ─── OpenAPI docs ───────────────────────────────────
app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get("/api/docs.json", (_req, res) => res.json(swaggerSpec));

// ─── Routes ─────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/admin", adminRoutes);

// Health check
app.get("/api/health", (_req, res) => {
  res.json({
    success: true,
    data: {
      status: "ok",
      environment: NODE_ENV,
      timestamp: new Date().toISOString(),
    },
  });
});

// ─── Global Error Handler ───────────────────────────
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  // Don't leak stack traces in production
  const message = NODE_ENV === "production" ? "Internal server error" : err.message;
  console.error("[Error]", err);
  res.status(err.status || 500).json({
    success: false,
    error: message,
  });
});

app.listen(PORT, () => {
  console.log(`\n  Clover Backend running on http://localhost:${PORT}`);
  console.log(`  Environment: ${NODE_ENV}`);
  console.log(`  CORS: ${allowedOrigins ? allowedOrigins.join(", ") : "all origins (dev mode)"}`);
  console.log(`  API Docs:  http://localhost:${PORT}/api/docs`);
  console.log(`  Spec JSON: http://localhost:${PORT}/api/docs.json\n`);
});

export default app;
