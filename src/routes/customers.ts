import { Router, Response } from "express";
import { pool } from "../db";
import { AuthedRequest, requireUser } from "../middleware/jwt";
import defaults from "../config/defaults.json";

const router = Router();

router.get("/profile", requireUser, async (req: AuthedRequest, res: Response) => {
  const userId = String(req.query.userId || req.user?.sub || "");
  const r = await pool.query(
    "SELECT owner_user_id, reference, amount_cents FROM invoices WHERE owner_user_id = $1 LIMIT 50",
    [parseInt(userId, 10)]
  );
  res.json({ userId, invoices: r.rows });
});

router.get("/staging-config", requireUser, (_req: AuthedRequest, res: Response) => {
  res.json({ staging: defaults.staging });
});

export default router;
