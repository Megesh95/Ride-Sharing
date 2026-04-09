import { Router } from "express";
import { requireAuth } from "../middleware/authMiddleware";
import { getBalance, getTransactions, addMoney } from "../controllers/walletController";

export const walletRoutes = Router();

walletRoutes.post("/add", requireAuth, addMoney);
walletRoutes.get("/transactions", requireAuth, getTransactions);
walletRoutes.get("/balance", requireAuth, getBalance);

