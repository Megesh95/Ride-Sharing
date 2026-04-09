import type { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { z } from "zod";

import { config } from "../config";
import { createUser, findUserByEmail, ensureWalletForUser, updateUserPasswordHash } from "../models/userModel";
import { HttpError } from "../utils/httpError";

const signupSchema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email(),
  password: z.string().min(8).max(120),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1).max(120),
});

export async function signup(req: Request, res: Response) {
  const parsed = signupSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new HttpError(400, "Invalid signup payload", parsed.error.flatten());
  }

  const { name, email, password } = parsed.data;

  const existing = await findUserByEmail(email);
  if (existing) throw new HttpError(409, "Email is already in use");

  const passwordHash = await bcrypt.hash(password, config.security.bcryptSaltRounds);
  const userId = await createUser({ name, email, passwordHash, role: "user" });
  await ensureWalletForUser(userId, 0);

  const token = jwt.sign(
    { userId, role: "user" },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn as any } as any
  );
  return res.status(201).json({
    token,
    user: { id: userId, name, email, role: "user" },
  });
}

export async function login(req: Request, res: Response) {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new HttpError(400, "Invalid login payload", parsed.error.flatten());
  }

  const { email, password } = parsed.data;
  const user = await findUserByEmail(email);
  if (!user) throw new HttpError(401, "Invalid email or password");

  // Support legacy plain-text rows once; upgrade to bcrypt hash on successful login.
  let ok = false;
  if (user.password.startsWith("$2a$") || user.password.startsWith("$2b$") || user.password.startsWith("$2y$")) {
    ok = await bcrypt.compare(password, user.password);
  } else if (user.password === password) {
    ok = true;
    const passwordHash = await bcrypt.hash(password, config.security.bcryptSaltRounds);
    await updateUserPasswordHash(user.id, passwordHash);
  }
  if (!ok) throw new HttpError(401, "Invalid email or password");

  const token = jwt.sign(
    { userId: user.id, role: user.role },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn as any } as any
  );
  return res.json({
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  });
}

