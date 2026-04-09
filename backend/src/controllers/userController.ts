import type { Request, Response } from "express";

import { findUserById } from "../models/userModel";
import { findUserBookings } from "../models/bookingModel";
import { findActiveRideByUser, analyticsMostUsedCycles, analyticsPeakUsageTimes, adminSummary } from "../models/rideModel";
import { getWalletByUser } from "../models/walletModel";

import { HttpError } from "../utils/httpError";

// Note: Some analytics exports are defined in rideModel. If you reorganize exports later,
// adjust imports accordingly.

export async function me(req: Request, res: Response) {
  if (!req.user) throw new HttpError(401, "Missing auth context");
  const userId = req.user.userId;

  const user = await findUserById(userId);
  if (!user) throw new HttpError(404, "User not found");

  const wallet = await getWalletByUser(userId);
  const bookings = await findUserBookings(userId);
  const activeRide = await findActiveRideByUser(userId);

  return res.json({
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
    wallet: { balance: wallet?.balance ?? 0 },
    bookings,
    activeRide: activeRide
      ? {
          rideId: activeRide.id,
          cycleId: activeRide.cycle_id,
          cycleName: activeRide.cycle_name,
          startTime: activeRide.start_time,
          ratePerMinute: activeRide.cycle_location.ratePerMinute ?? 0,
        }
      : null,
  });
}

export async function adminDashboard(req: Request, res: Response) {
  const summary = await adminSummary();
  return res.json(summary);
}

export async function adminAnalytics(req: Request, res: Response) {
  const mostUsedCycles = await analyticsMostUsedCycles();
  const peakUsageTimes = await analyticsPeakUsageTimes();
  return res.json({ mostUsedCycles, peakUsageTimes });
}

