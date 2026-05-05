import helmet from "helmet";
import hpp from "hpp";
import timeout from "connect-timeout";
import { rateLimit } from "express-rate-limit";

const ONE_MINUTE = 60 * 1000;

export const helmetMiddleware = helmet();

export const globalRateLimiter = rateLimit({
  windowMs: ONE_MINUTE,
  limit: 120,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later." },
});

export const uploadRateLimiter = rateLimit({
  windowMs: ONE_MINUTE,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { error: "Upload rate limit exceeded. Please wait before retrying." },
});

export const adminRateLimiter = rateLimit({
  windowMs: ONE_MINUTE,
  limit: 45,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { error: "Admin endpoint rate limit exceeded." },
});

export const hppMiddleware = hpp();

export const requestTimeoutMiddleware = timeout("15s");

export function haltOnTimedout(req: { timedout?: boolean }, _res: unknown, next: () => void) {
  if (!req.timedout) next();
}
