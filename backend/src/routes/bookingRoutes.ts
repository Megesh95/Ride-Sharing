import { Router } from "express";
import { requireAuth } from "../middleware/authMiddleware";
import { requireRole } from "../middleware/roleMiddleware";
import { createBookingForUser, listBookingsForUser, listBookingsAdmin } from "../controllers/bookingController";

export const bookingRoutes = Router();

bookingRoutes.post("/", requireAuth, createBookingForUser);
bookingRoutes.get("/", requireAuth, listBookingsForUser);
bookingRoutes.get("/all", requireAuth, requireRole("admin"), listBookingsAdmin);

