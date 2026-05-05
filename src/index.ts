import "dotenv/config";
import express from "express";
import cors from "cors";
import { propertyRouter } from "./routes/property";
import { adminRouter } from "./routes/admin";
import { ensureBootstrapAdminUser } from "./bootstrap/admin-user";
import {
  adminRateLimiter,
  globalRateLimiter,
  haltOnTimedout,
  helmetMiddleware,
  hppMiddleware,
  requestTimeoutMiddleware,
  uploadRateLimiter,
} from "./middleware/security";

const app = express();
const allowedOrigins = (process.env.ALLOWED_ORIGINS ?? "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.disable("x-powered-by");
app.use(express.json({ limit: "1mb" }));
app.use(helmetMiddleware);
app.use(globalRateLimiter);
app.use(hppMiddleware);
app.use(requestTimeoutMiddleware);
app.use(haltOnTimedout);
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow non-browser tools and same-origin requests without Origin.
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error("CORS not allowed"));
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use("/property/upload", uploadRateLimiter);
app.use("/admin/media/upload", uploadRateLimiter);
app.use("/admin", adminRateLimiter);
app.use("/property", propertyRouter);
app.use("/admin", adminRouter);

app.use((_req, res) => {
  res.status(404).json({ error: "Not found" });
});

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (err.message === "CORS not allowed") {
    return res.status(403).json({ error: "Forbidden origin" });
  }
  console.error("Unhandled server error:", err);
  return res.status(500).json({ error: "Internal server error" });
});

const PORT = process.env.PORT || 3000;

async function startServer() {
  await ensureBootstrapAdminUser();
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});