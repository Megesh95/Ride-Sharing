import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { config } from "../config";

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header || !header.toLowerCase().startsWith("bearer ")) {
    return res.status(401).json({ error: { message: "Missing bearer token" } });
  }

  const token = header.slice("bearer ".length).trim();
  try {
    const decoded = jwt.verify(token, config.jwt.secret) as { userId: number; role: "user" | "admin" };
    req.user = decoded;
    return next();
  } catch {
    return res.status(401).json({ error: { message: "Invalid or expired token" } });
  }
}

