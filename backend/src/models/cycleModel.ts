import { pool } from "../db";
import mysql from "mysql2/promise";

export type CycleStatus = "available" | "unavailable" | "reserved" | "active";

export type CycleLocation = {
  lat: number;
  lng: number;
  type: string;
  ratePerMinute?: number;
};

export type CycleRow = {
  id: number;
  name: string;
  location: CycleLocation;
  status: CycleStatus;
};

export async function listCycles() {
  const [rows] = await pool.execute("SELECT id, name, location, status FROM cycles");
  return (rows as any[]).map((r) => ({
    id: r.id as number,
    name: r.name as string,
    location: typeof r.location === "string" ? JSON.parse(r.location) : (r.location as CycleLocation),
    status: r.status as CycleStatus,
  })) as CycleRow[];
}

export async function findCycleById(id: number) {
  const [rows] = await pool.execute("SELECT id, name, location, status FROM cycles WHERE id = ? LIMIT 1", [id]);
  const r = (rows as any[])[0];
  if (!r) return undefined;
  return {
    id: r.id as number,
    name: r.name as string,
    location: typeof r.location === "string" ? JSON.parse(r.location) : (r.location as CycleLocation),
    status: r.status as CycleStatus,
  } as CycleRow;
}

export async function createCycle(input: { name: string; location: CycleLocation; status: CycleStatus }) {
  const [result] = await pool.execute(
    "INSERT INTO cycles (name, location, status) VALUES (?, ?, ?)",
    [input.name, JSON.stringify(input.location), input.status]
  );
  const insertId = (result as mysql.ResultSetHeader).insertId;
  return insertId as number;
}

export async function updateCycle(
  id: number,
  input: { name?: string; location?: CycleLocation; status?: CycleStatus }
) {
  const sets: string[] = [];
  const params: any[] = [];
  if (typeof input.name === "string") {
    sets.push("name = ?");
    params.push(input.name);
  }
  if (input.location) {
    sets.push("location = ?");
    params.push(JSON.stringify(input.location));
  }
  if (input.status) {
    sets.push("status = ?");
    params.push(input.status);
  }
  if (!sets.length) return;
  params.push(id);
  await pool.execute(`UPDATE cycles SET ${sets.join(", ")} WHERE id = ?`, params);
}

export async function deleteCycle(id: number) {
  await pool.execute("DELETE FROM cycles WHERE id = ?", [id]);
}

export async function setCycleStatus(id: number, status: CycleStatus) {
  await pool.execute("UPDATE cycles SET status = ? WHERE id = ?", [status, id]);
}

export async function countRidesForCycle(cycleId: number) {
  const [rows] = await pool.execute(
    "SELECT COUNT(*) as total FROM rides WHERE cycle_id = ?",
    [cycleId]
  );
  return Number((rows as any[])[0]?.total ?? 0);
}

