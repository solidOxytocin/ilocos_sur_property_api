import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

type AdminJwtPayload = {
  sub?: string;
  role?: string;
};

export function requireAdminAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.header("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const token = authHeader.slice("Bearer ".length).trim();
  const jwtSecret = process.env.ADMIN_JWT_SECRET;

  if (!jwtSecret) {
    console.error("Missing ADMIN_JWT_SECRET");
    return res.status(500).json({ error: "Server misconfiguration" });
  }

  try {
    const payload = jwt.verify(token, jwtSecret) as AdminJwtPayload;
    if (payload.role !== "admin") {
      return res.status(403).json({ error: "Forbidden" });
    }
    return next();
  } catch {
    return res.status(401).json({ error: "Unauthorized" });
  }
}
