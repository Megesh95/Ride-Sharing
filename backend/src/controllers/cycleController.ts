import type { Request, Response } from "express";
import { z } from "zod";

import { findCycleById, listCycles, createCycle, updateCycle, deleteCycle, setCycleStatus, type CycleLocation, type CycleStatus } from "../models/cycleModel";
import { haversineDistanceKm } from "../utils/geo";
import { HttpError } from "../utils/httpError";

const cycleStatusSchema = z.enum(["available", "unavailable", "reserved", "active"]);

const cycleLocationSchema = z.object({
  lat: z.number(),
  lng: z.number(),
  type: z.string().min(1).max(40),
  ratePerMinute: z.number().positive().optional(),
});

const cycleSchema = z.object({
  name: z.string().min(1).max(100),
  location: cycleLocationSchema,
  status: cycleStatusSchema.optional().default("available"),
});

export async function listCyclesForNearby(req: Request, res: Response) {
  // Filters are optional; controller computes distance using mock GPS values.
  const lat = req.query.lat ? Number(req.query.lat) : null;
  const lng = req.query.lng ? Number(req.query.lng) : null;
  const distanceKm = req.query.distanceKm ? Number(req.query.distanceKm) : null;
  const type = req.query.type ? String(req.query.type) : null;

  const cycles = await listCycles();

  const filtered = cycles
    .filter((c) => c.status === "available" || c.status === "reserved")
    .filter((c) => (type ? c.location.type === type : true))
    .filter((c) => {
      if (lat === null || lng === null || distanceKm === null) return true;
      return haversineDistanceKm({ lat, lng }, { lat: c.location.lat, lng: c.location.lng }) <= distanceKm;
    });

  return res.json({ cycles: filtered });
}

export async function listCyclesAdmin(_req: Request, res: Response) {
  const cycles = await listCycles();
  return res.json({ cycles });
}

export async function getCycleById(req: Request, res: Response) {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) throw new HttpError(400, "Invalid cycle id");
  const cycle = await findCycleById(id);
  if (!cycle) throw new HttpError(404, "Cycle not found");
  return res.json({ cycle });
}

export async function createCycleAdmin(req: Request, res: Response) {
  const parsed = cycleSchema.safeParse(req.body);
  if (!parsed.success) throw new HttpError(400, "Invalid cycle payload", parsed.error.flatten());
  const input = parsed.data;
  const ratePerMinute = input.location.ratePerMinute ?? defaultRateForType(input.location.type);
  const cycleId = await createCycle({ name: input.name, location: { ...input.location, ratePerMinute }, status: input.status as CycleStatus });
  return res.status(201).json({ id: cycleId });
}

export async function updateCycleAdmin(req: Request, res: Response) {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) throw new HttpError(400, "Invalid cycle id");
  const parsed = cycleSchema.partial().safeParse(req.body);
  if (!parsed.success) throw new HttpError(400, "Invalid cycle payload", parsed.error.flatten());

  const input = parsed.data;
  if (input.location && typeof input.location.ratePerMinute !== "number") {
    // If rate not provided, keep old server-side value by not overwriting.
  }
  await updateCycle(id, {
    name: input.name,
    location: input.location
      ? {
          ...input.location,
          ratePerMinute: input.location.ratePerMinute ?? defaultRateForType(input.location.type),
        }
      : undefined,
    status: input.status as CycleStatus | undefined,
  });
  return res.json({ ok: true });
}

export async function deleteCycleAdmin(req: Request, res: Response) {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) throw new HttpError(400, "Invalid cycle id");
  await deleteCycle(id);
  return res.json({ ok: true });
}

export async function setCycleAvailability(req: Request, res: Response) {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) throw new HttpError(400, "Invalid cycle id");
  const parsed = z.object({ status: cycleStatusSchema }).safeParse(req.body);
  if (!parsed.success) throw new HttpError(400, "Invalid status payload", parsed.error.flatten());
  const { status } = parsed.data;
  await setCycleStatus(id, status as CycleStatus);
  return res.json({ ok: true });
}

function defaultRateForType(type: string) {
  // Simple fare model: each type maps to a per-minute rate.
  const key = type.toLowerCase();
  if (key.includes("standard")) return 1.5;
  if (key.includes("premium")) return 2.5;
  if (key.includes("electric")) return 3.5;
  return 2.0;
}

