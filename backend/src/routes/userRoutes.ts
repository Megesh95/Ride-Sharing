import { Router } from "express";
import { requireAuth } from "../middleware/authMiddleware";
import { requireRole } from "../middleware/roleMiddleware";
import { me, adminDashboard, adminAnalytics } from "../controllers/userController";

export const userRoutes = Router();

userRoutes.get("/me", requireAuth, me);

userRoutes.get("/admin/dashboard", requireAuth, requireRole("admin"), adminDashboard);
userRoutes.get("/admin/analytics", requireAuth, requireRole("admin"), adminAnalytics);

