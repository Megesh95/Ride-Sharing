import type { Request, Response } from "express";
import { z } from "zod";

import { HttpError } from "../utils/httpError";
import { createBooking, findUserBookings, listAllBookings, type BookingStatus } from "../models/bookingModel";
import { findCycleById } from "../models/cycleModel";

const createBookingSchema = z.object({
  cycleId: z.number().int().positive(),
  startTime: z.string().min(1),
});

export async function createBookingForUser(req: Request, res: Response) {
  if (!req.user) throw new HttpError(401, "Missing auth context");
  const userId = req.user.userId;

  const parsed = createBookingSchema.safeParse(req.body);
  if (!parsed.success) throw new HttpError(400, "Invalid booking payload", parsed.error.flatten());

  const { cycleId, startTime } = parsed.data;
  const cycle = await findCycleById(cycleId);
  if (!cycle) throw new HttpError(404, "Cycle not found");
  if (cycle.status === "unavailable") throw new HttpError(400, "Cycle is unavailable");

  const start = new Date(startTime);
  if (Number.isNaN(start.getTime())) throw new HttpError(400, "Invalid startTime");

  // Booking is for future times (or now).
  if (start.getTime() < Date.now() - 5 * 60 * 1000) {
    throw new HttpError(400, "startTime must be in the future");
  }

  const bookingId = await createBooking({ userId, cycleId, startTime: start, status: "confirmed" as BookingStatus });
  return res.status(201).json({ id: bookingId });
}

export async function listBookingsForUser(req: Request, res: Response) {
  if (!req.user) throw new HttpError(401, "Missing auth context");
  const bookings = await findUserBookings(req.user.userId);
  return res.json({ bookings });
}

export async function listBookingsAdmin(_req: Request, res: Response) {
  const bookings = await listAllBookings();
  return res.json({ bookings });
}

