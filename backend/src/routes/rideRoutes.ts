import { Router } from "express";
import { requireAuth } from "../middleware/authMiddleware";
import { getActiveRide, startRide, endRideHandler, rideHistory } from "../controllers/rideController";

export const rideRoutes = Router();

rideRoutes.get("/active", requireAuth, getActiveRide);
rideRoutes.post("/start", requireAuth, startRide);
rideRoutes.post("/end", requireAuth, endRideHandler);

rideRoutes.get("/", requireAuth, rideHistory);

