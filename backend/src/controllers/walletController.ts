import type { Request, Response } from "express";
import { z } from "zod";
import { withTransaction } from "../db";
import { getWalletByUser, listTransactionsByUser } from "../models/walletModel";
import { ensureWalletForUser } from "../models/userModel";
import { HttpError } from "../utils/httpError";

const addMoneySchema = z.object({
  amount: z.number().positive(),
});

export async function getBalance(req: Request, res: Response) {
  if (!req.user) throw new HttpError(401, "Missing auth context");
  const wallet = await getWalletByUser(req.user.userId);
  return res.json({ balance: wallet?.balance ?? 0 });
}

export async function getTransactions(req: Request, res: Response) {
  if (!req.user) throw new HttpError(401, "Missing auth context");
  const transactions = await listTransactionsByUser(req.user.userId);
  return res.json({ transactions });
}

export async function addMoney(req: Request, res: Response) {
  if (!req.user) throw new HttpError(401, "Missing auth context");

  const parsed = addMoneySchema.safeParse(req.body);
  if (!parsed.success) throw new HttpError(400, "Invalid add money payload", parsed.error.flatten());
  const amount = parsed.data.amount;

  await withTransaction(async (conn) => {
    await ensureWalletForUser(req.user!.userId, 0);
    await conn.execute("UPDATE wallet SET balance = balance + ? WHERE user_id = ?", [amount, req.user!.userId]);
    await conn.execute(
      "INSERT INTO transactions (user_id, amount, type, created_at) VALUES (?, ?, 'credit', NOW())",
      [req.user!.userId, amount]
    );
  });

  const wallet = await getWalletByUser(req.user.userId);
  return res.json({ balance: wallet?.balance ?? 0 });
}

