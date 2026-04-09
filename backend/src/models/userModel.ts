import mysql from "mysql2/promise";
import { pool } from "../db";

export type UserRole = "user" | "admin";

export type UserRow = {
  id: number;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  created_at: Date;
};

type Queryable = {
  execute: (sql: string, params?: any[]) => Promise<[any[], any]>;
};

export async function findUserByEmail(email: string) {
  const [rows] = await pool.execute("SELECT * FROM users WHERE email = ? LIMIT 1", [email]);
  return (rows as any[])[0] as UserRow | undefined;
}

export async function findUserById(id: number) {
  const [rows] = await pool.execute("SELECT id, name, email, role, created_at FROM users WHERE id = ? LIMIT 1", [id]);
  return (rows as any[])[0] as Omit<UserRow, "password"> | undefined;
}

export async function createUser(input: {
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
}) {
  const [result] = await pool.execute(
    "INSERT INTO users (name, email, password, role, created_at) VALUES (?, ?, ?, ?, NOW())",
    [input.name, input.email, input.passwordHash, input.role]
  );
  const insertId = (result as mysql.ResultSetHeader).insertId;
  return insertId as number;
}

export async function updateUserPasswordHash(userId: number, passwordHash: string) {
  await pool.execute("UPDATE users SET password = ? WHERE id = ?", [passwordHash, userId]);
}

export async function ensureWalletForUser(userId: number, startingBalance = 0) {
  await pool.execute(
    "INSERT INTO wallet (user_id, balance) VALUES (?, ?) ON DUPLICATE KEY UPDATE balance = balance",
    [userId, startingBalance]
  );
}

export async function countUsers() {
  const [rows] = await pool.execute("SELECT COUNT(*) as total FROM users");
  const total = (rows as any[])[0]?.total ?? 0;
  return Number(total);
}

