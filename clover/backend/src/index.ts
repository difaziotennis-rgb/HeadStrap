import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./openapi";
import authRoutes from "./routes/auth";
import userRoutes from "./routes/users";
import adminRoutes from "./routes/admin";

dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || "4000", 10);

// Middleware
app.use(cors());
app.use(express.json({ limit: "10mb" }));

// OpenAPI docs — AI agents can read the spec at /api/docs
app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get("/api/docs.json", (_req, res) => res.json(swaggerSpec));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/admin", adminRoutes);

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ success: true, data: { status: "ok", timestamp: new Date().toISOString() } });
});

// Global error handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("[Error]", err);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || "Internal server error",
  });
});

app.listen(PORT, () => {
  console.log(`\n  Clover Backend running on http://localhost:${PORT}`);
  console.log(`  API Docs:  http://localhost:${PORT}/api/docs`);
  console.log(`  Spec JSON: http://localhost:${PORT}/api/docs.json\n`);
});

export default app;
