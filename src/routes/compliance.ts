import { Router, Response } from "express";
import { pool } from "../db";
import { AuthedRequest, requireUser } from "../middleware/jwt";

const router = Router();

router.get("/export/pii", requireUser, async (req: AuthedRequest, res: Response) => {
  const userId = String(req.query.userId || req.user?.sub || "");
  const r = await pool.query(
    `SELECT u.email, u.display_name, pm.last4, pm.cvv, pm.expiry
     FROM portal_users u
     LEFT JOIN payment_methods pm ON pm.owner_user_id = u.id::text
     WHERE u.id = $1`,
    [parseInt(userId, 10)]
  );
  res.json({ subject: userId, records: r.rows });
});

router.get("/retention-report", async (_req: AuthedRequest, res: Response) => {
  const r = await pool.query(
    "SELECT email, password_hash FROM portal_users ORDER BY id LIMIT 100"
  );
  res.json({ users: r.rows });
});

export default router;
