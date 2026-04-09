import type { Request, Response } from "express";
import { z } from "zod";
import mysql from "mysql2/promise";

import { config } from "../config";
import { pool, withTransaction } from "../db";
import { findActiveRideByUser, createActiveRide, endRide, findRideHistoryByUser } from "../models/rideModel";
import { findCycleById } from "../models/cycleModel";
import { findLatestConfirmedBookingForUserCycle } from "../models/bookingModel";
import { getWalletByUser } from "../models/walletModel";
import { calculateFare } from "../utils/fare";
import { HttpError } from "../utils/httpError";

const startRideSchema = z.object({
  cycleId: z.number().int().positive(),
});

const baseFare = Number(process.env.BASE_FARE ?? 2.0);

export async function getActiveRide(req: Request, res: Response) {
  if (!req.user) throw new HttpError(401, "Missing auth context");
  const userId = req.user.userId;

  const active = await findActiveRideByUser(userId);
  if (!active) return res.json({ activeRide: null });

  const now = new Date();
  const durationSeconds = Math.max(0, Math.floor((now.getTime() - active.start_time.getTime()) / 1000));
  const ratePerMinute = active.cycle_location.ratePerMinute ?? 0;
  const fareSoFar = calculateFare({ durationSeconds, ratePerMinute, baseFare });

  return res.json({
    activeRide: {
      rideId: active.id,
      cycleId: active.cycle_id,
      cycleName: active.cycle_name,
      cycleLocation: active.cycle_location,
      startTime: active.start_time,
      ratePerMinute,
      baseFare,
      durationSeconds,
      fareSoFar,
    },
  });
}

export async function startRide(req: Request, res: Response) {
  if (!req.user) throw new HttpError(401, "Missing auth context");
  const userId = req.user.userId;

  const parsed = startRideSchema.safeParse(req.body);
  if (!parsed.success) throw new HttpError(400, "Invalid start ride payload", parsed.error.flatten());
  const { cycleId } = parsed.data;

  const activeAlready = await findActiveRideByUser(userId);
  if (activeAlready) throw new HttpError(409, "You already have an active ride");

  const cycle = await findCycleById(cycleId);
  if (!cycle) throw new HttpError(404, "Cycle not found");
  if (!(cycle.status === "available" || cycle.status === "reserved")) {
    throw new HttpError(400, `Cycle is not available (status=${cycle.status})`);
  }

  // Start ride: persist ride start and update cycle state atomically.
  const now = new Date();
  const rideId = await withTransaction(async (conn) => {
    // Re-check cycle state inside transaction to reduce race conditions.
    const [cycleRows] = await conn.execute("SELECT status FROM cycles WHERE id = ? LIMIT 1", [cycleId]);
    const status = (cycleRows as any[])[0]?.status as string | undefined;
    if (!status) throw new HttpError(404, "Cycle not found");
    if (!(status === "available" || status === "reserved")) {
      throw new HttpError(400, "Cycle is not available");
    }

    // Booking reservation rules:
    // 1) If the cycle has any future confirmed booking, deny starts for everyone.
    const [futureBookingRows] = await conn.execute(
      `SELECT id, user_id, start_time
       FROM bookings
       WHERE cycle_id = ? AND status = 'confirmed' AND start_time > ?
       ORDER BY start_time ASC
       LIMIT 1`,
      [cycleId, now]
    );
    const futureBooking = (futureBookingRows as any[])[0] as undefined | { id: number; user_id: number; start_time: Date };
    if (futureBooking) {
      throw new HttpError(409, "This cycle is booked for a future time");
    }

    // 2) If there is a past confirmed booking, only the booking owner can start.
    const [latestBookingRows] = await conn.execute(
      `SELECT id, user_id, start_time
       FROM bookings
       WHERE cycle_id = ? AND status = 'confirmed' AND start_time <= ?
       ORDER BY start_time DESC
       LIMIT 1`,
      [cycleId, now]
    );
    const latestBooking = (latestBookingRows as any[])[0] as undefined | { id: number; user_id: number; start_time: Date };
    if (latestBooking) {
      if (latestBooking.user_id !== userId) {
        throw new HttpError(409, "Cycle is reserved for another booking");
      }

      const ageMs = now.getTime() - new Date(latestBooking.start_time).getTime();
      if (ageMs > 4 * 60 * 60 * 1000) {
        // Too old to be used to start a ride.
        throw new HttpError(400, "No valid booking window for this cycle");
      }
    }

    await conn.execute("UPDATE cycles SET status = 'active' WHERE id = ?", [cycleId]);
    const [rideResult] = await conn.execute(
      "INSERT INTO rides (user_id, cycle_id, start_time, end_time, fare) VALUES (?, ?, ?, NULL, NULL)",
      [userId, cycleId, now]
    );
    return (rideResult as mysql.ResultSetHeader).insertId as number;
  });

  return res.status(201).json({ rideId, startedAt: now, cycleId });
}

export async function endRideHandler(req: Request, res: Response) {
  if (!req.user) throw new HttpError(401, "Missing auth context");
  const userId = req.user.userId;

  const active = await findActiveRideByUser(userId);
  if (!active) throw new HttpError(404, "No active ride found");

  const now = new Date();
  const durationSeconds = Math.max(0, Math.floor((now.getTime() - active.start_time.getTime()) / 1000));
  const ratePerMinute = active.cycle_location.ratePerMinute ?? 0;
  const fare = calculateFare({ durationSeconds, ratePerMinute, baseFare });

  // Execute ride close + wallet deduction + cycle reset atomically.
  await withTransaction(async (conn) => {
    const [walletRows] = await conn.execute("SELECT balance FROM wallet WHERE user_id = ? LIMIT 1 FOR UPDATE", [userId]);
    const balance = Number((walletRows as any[])[0]?.balance ?? 0);
    if (balance < fare) throw new HttpError(402, "Insufficient wallet balance");

    await conn.execute("UPDATE rides SET end_time = ?, fare = ? WHERE id = ?", [now, fare, active.id]);
    await conn.execute("UPDATE wallet SET balance = balance - ? WHERE user_id = ?", [fare, userId]);
    await conn.execute(
      "INSERT INTO transactions (user_id, amount, type, created_at) VALUES (?, ?, 'debit', NOW())",
      [userId, fare]
    );
    await conn.execute("UPDATE cycles SET status = 'available' WHERE id = ?", [active.cycle_id]);

    const latestBooking = await findLatestConfirmedBookingForUserCycle({ userId, cycleId: active.cycle_id, atTime: now });
    if (latestBooking && latestBooking.status === "confirmed") {
      await conn.execute("UPDATE bookings SET status = 'completed' WHERE id = ?", [latestBooking.id]);
    }
  });

  // Return updated active ride response -> history item
  const history = await findRideHistoryByUser(userId);
  return res.json({ ok: true, fare, durationSeconds, rideHistory: history[0] ?? null });
}

export async function rideHistory(req: Request, res: Response) {
  if (!req.user) throw new HttpError(401, "Missing auth context");
  const history = await findRideHistoryByUser(req.user.userId);
  return res.json({ rides: history });
}

