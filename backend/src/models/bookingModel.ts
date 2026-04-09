import { pool } from "../db";
import mysql from "mysql2/promise";

export type BookingStatus = "confirmed" | "cancelled" | "completed";

export type BookingRow = {
  id: number;
  user_id: number;
  cycle_id: number;
  start_time: Date;
  status: BookingStatus;
};

export async function createBooking(input: { userId: number; cycleId: number; startTime: Date; status?: BookingStatus }) {
  const [result] = await pool.execute(
    "INSERT INTO bookings (user_id, cycle_id, start_time, status) VALUES (?, ?, ?, ?)",
    [input.userId, input.cycleId, input.startTime, input.status ?? "confirmed"]
  );
  return (result as mysql.ResultSetHeader).insertId as number;
}

export async function findUserBookings(userId: number) {
  const [rows] = await pool.execute(
    `SELECT b.id, b.user_id, b.cycle_id, b.start_time, b.status,
            c.name AS cycle_name, c.location AS cycle_location
     FROM bookings b
     JOIN cycles c ON c.id = b.cycle_id
     WHERE b.user_id = ?
     ORDER BY b.start_time DESC`,
    [userId]
  );

  return (rows as any[]).map((r) => ({
    id: r.id as number,
    user_id: r.user_id as number,
    cycle_id: r.cycle_id as number,
    start_time: r.start_time as Date,
    status: r.status as BookingStatus,
    cycle_name: r.cycle_name as string,
    cycle_location: typeof r.cycle_location === "string" ? JSON.parse(r.cycle_location) : r.cycle_location,
  }));
}

export async function listAllBookings() {
  const [rows] = await pool.execute(
    `SELECT b.id, b.user_id, b.cycle_id, b.start_time, b.status,
            u.name AS user_name, u.email AS user_email,
            c.name AS cycle_name
     FROM bookings b
     JOIN users u ON u.id = b.user_id
     JOIN cycles c ON c.id = b.cycle_id
     ORDER BY b.start_time DESC`
  );

  return (rows as any[]).map((r) => ({
    id: r.id as number,
    user_id: r.user_id as number,
    cycle_id: r.cycle_id as number,
    start_time: r.start_time as Date,
    status: r.status as BookingStatus,
    user_name: r.user_name as string,
    user_email: r.user_email as string,
    cycle_name: r.cycle_name as string,
  }));
}

export async function findLatestConfirmedBookingForUserCycle(input: {
  userId: number;
  cycleId: number;
  atTime: Date;
}) {
  const [rows] = await pool.execute(
    `SELECT *
     FROM bookings
     WHERE user_id = ? AND cycle_id = ? AND status = 'confirmed'
       AND start_time <= ?
     ORDER BY start_time DESC
     LIMIT 1`,
    [input.userId, input.cycleId, input.atTime]
  );
  return (rows as any[])[0] as (BookingRow & { [k: string]: any }) | undefined;
}

export async function markBookingCompleted(bookingId: number) {
  await pool.execute("UPDATE bookings SET status = 'completed' WHERE id = ?", [bookingId]);
}

