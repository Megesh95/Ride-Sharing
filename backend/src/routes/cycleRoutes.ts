import { Router } from "express";
import { requireAuth } from "../middleware/authMiddleware";
import { requireRole } from "../middleware/roleMiddleware";
import { listCyclesForNearby, getCycleById, createCycleAdmin, updateCycleAdmin, deleteCycleAdmin, setCycleAvailability, listCyclesAdmin } from "../controllers/cycleController";

export const cycleRoutes = Router();

cycleRoutes.get("/", requireAuth, listCyclesForNearby);
cycleRoutes.get("/:id", requireAuth, getCycleById);
cycleRoutes.get("/admin", requireAuth, requireRole("admin"), listCyclesAdmin);

// Admin cycle management
cycleRoutes.post("/", requireAuth, requireRole("admin"), createCycleAdmin);
cycleRoutes.put("/:id", requireAuth, requireRole("admin"), updateCycleAdmin);
cycleRoutes.delete("/:id", requireAuth, requireRole("admin"), deleteCycleAdmin);
cycleRoutes.patch("/:id/status", requireAuth, requireRole("admin"), setCycleAvailability);

