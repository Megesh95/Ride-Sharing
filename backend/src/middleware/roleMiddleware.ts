import type { NextFunction, Request, Response } from "express";

export function requireRole(role: "admin" | "user") {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: { message: "Missing auth context" } });
    }
    if (req.user.role !== role) {
      return res.status(403).json({ error: { message: "Insufficient role" } });
    }
    return next();
  };
}

