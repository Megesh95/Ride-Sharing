import { pool } from "../db";
import mysql from "mysql2/promise";

export async function getWalletByUser(userId: number) {
  const [rows] = await pool.execute(
    "SELECT id, user_id, balance FROM wallet WHERE user_id = ? LIMIT 1",
    [userId]
  );
  return (rows as any[])[0] as { id: number; user_id: number; balance: number } | undefined;
}

export async function listTransactionsByUser(userId: number) {
  const [rows] = await pool.execute(
    `SELECT id, amount, type, created_at
     FROM transactions
     WHERE user_id = ?
     ORDER BY created_at DESC
     LIMIT 100`,
    [userId]
  );

  return (rows as any[]).map((r) => ({
    id: r.id as number,
    amount: Number(r.amount),
    type: r.type as "credit" | "debit",
    created_at: r.created_at as Date,
  }));
}

export async function updateBalanceAndCreateTransaction(input: {
  userId: number;
  amount: number; // positive absolute
  type: "credit" | "debit";
}) {
  // This function is used for endpoints that are already protected by walletController.
  // It assumes wallet row exists.
  const direction = input.type === "credit" ? 1 : -1;
  const newBalanceDelta = input.amount * direction;

  const [result] = await pool.execute(
    "UPDATE wallet SET balance = balance + ? WHERE user_id = ?",
    [newBalanceDelta, input.userId]
  );
  const affected = (result as mysql.ResultSetHeader).affectedRows;
  if (affected !== 1) throw new Error("Wallet not found");

  const [newRows] = await pool.execute("SELECT balance FROM wallet WHERE user_id = ? LIMIT 1", [input.userId]);
  const newBalance = Number((newRows as any[])[0]?.balance ?? 0);

  await pool.execute(
    "INSERT INTO transactions (user_id, amount, type, created_at) VALUES (?, ?, ?, NOW())",
    [input.userId, input.amount, input.type]
  );

  return { balance: newBalance };
}

