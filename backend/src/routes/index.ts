import { Router } from "express";

import { authRoutes } from "./authRoutes";
import { userRoutes } from "./userRoutes";
import { cycleRoutes } from "./cycleRoutes";
import { bookingRoutes } from "./bookingRoutes";
import { rideRoutes } from "./rideRoutes";
import { walletRoutes } from "./walletRoutes";

export const routes = Router();

routes.use("/auth", authRoutes);
routes.use("/users", userRoutes);
routes.use("/cycles", cycleRoutes);
routes.use("/bookings", bookingRoutes);
routes.use("/rides", rideRoutes);
routes.use("/wallet", walletRoutes);

