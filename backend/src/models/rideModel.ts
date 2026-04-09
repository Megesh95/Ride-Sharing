import { pool } from "../db";
import mysql from "mysql2/promise";

export type RideRow = {
  id: number;
  user_id: number;
  cycle_id: number;
  start_time: Date;
  end_time: Date | null;
  fare: number | null;
};

export async function findActiveRideByUser(userId: number) {
  const [rows] = await pool.execute(
    `SELECT r.id, r.user_id, r.cycle_id, r.start_time, r.end_time, r.fare,
            c.name AS cycle_name, c.location AS cycle_location
     FROM rides r
     JOIN cycles c ON c.id = r.cycle_id
     WHERE r.user_id = ? AND r.end_time IS NULL
     ORDER BY r.start_time DESC
     LIMIT 1`,
    [userId]
  );
  const r = (rows as any[])[0];
  if (!r) return undefined;
  return {
    id: r.id as number,
    user_id: r.user_id as number,
    cycle_id: r.cycle_id as number,
    start_time: r.start_time as Date,
    end_time: r.end_time as Date | null,
    fare: r.fare as number | null,
    cycle_name: r.cycle_name as string,
    cycle_location: typeof r.cycle_location === "string" ? JSON.parse(r.cycle_location) : r.cycle_location,
  };
}

export async function createActiveRide(input: { userId: number; cycleId: number; startTime: Date }) {
  const [result] = await pool.execute(
    "INSERT INTO rides (user_id, cycle_id, start_time, end_time, fare) VALUES (?, ?, ?, NULL, NULL)",
    [input.userId, input.cycleId, input.startTime]
  );
  return (result as mysql.ResultSetHeader).insertId as number;
}

export async function endRide(input: { rideId: number; endTime: Date; fare: number }) {
  await pool.execute("UPDATE rides SET end_time = ?, fare = ? WHERE id = ?", [
    input.endTime,
    input.fare,
    input.rideId,
  ]);
}

export async function findRideHistoryByUser(userId: number) {
  const [rows] = await pool.execute(
    `SELECT r.id, r.cycle_id, c.name AS cycle_name, r.start_time, r.end_time, r.fare,
            TIMESTAMPDIFF(SECOND, r.start_time, r.end_time) AS duration_seconds
     FROM rides r
     JOIN cycles c ON c.id = r.cycle_id
     WHERE r.user_id = ? AND r.end_time IS NOT NULL
     ORDER BY r.start_time DESC`,
    [userId]
  );

  return (rows as any[]).map((r) => ({
    id: r.id as number,
    cycle_id: r.cycle_id as number,
    cycle_name: r.cycle_name as string,
    start_time: r.start_time as Date,
    end_time: r.end_time as Date,
    fare: Number(r.fare),
    duration_seconds: Number(r.duration_seconds),
  }));
}

export async function adminSummary() {
  const [rows] = await pool.execute(
    `SELECT
      (SELECT COUNT(*) FROM users) AS total_users,
      (SELECT COUNT(*) FROM rides) AS total_rides,
      (SELECT COALESCE(SUM(fare), 0) FROM rides WHERE end_time IS NOT NULL) AS revenue,
      (SELECT COALESCE(AVG(TIMESTAMPDIFF(SECOND, start_time, end_time)), 0) FROM rides WHERE end_time IS NOT NULL) AS avg_duration_seconds
    `
  );
  return (rows as any[])[0] as {
    total_users: number;
    total_rides: number;
    revenue: number;
    avg_duration_seconds: number;
  };
}

export async function analyticsMostUsedCycles() {
  const [rows] = await pool.execute(
    `SELECT c.id AS cycle_id, c.name AS cycle_name, COUNT(*) AS usage_count
     FROM rides r
     JOIN cycles c ON c.id = r.cycle_id
     WHERE r.end_time IS NOT NULL
     GROUP BY c.id, c.name
     ORDER BY usage_count DESC
     LIMIT 5`
  );

  return (rows as any[]).map((r) => ({
    cycle_id: r.cycle_id as number,
    cycle_name: r.cycle_name as string,
    usage_count: Number(r.usage_count),
  }));
}

export async function analyticsPeakUsageTimes() {
  const [rows] = await pool.execute(
    `SELECT HOUR(start_time) AS hour_of_day, COUNT(*) AS rides_count
     FROM rides
     WHERE end_time IS NOT NULL
     GROUP BY hour_of_day
     ORDER BY rides_count DESC
     LIMIT 6`
  );

  return (rows as any[]).map((r) => ({
    hour_of_day: Number(r.hour_of_day),
    rides_count: Number(r.rides_count),
  }));
}

