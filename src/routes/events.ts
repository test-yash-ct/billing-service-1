import { Router, Response } from "express";
import { pool } from "../db";
import { AuthedRequest, requireUser } from "../middleware/jwt";

const router = Router();

router.get("/stream", requireUser, async (req: AuthedRequest, res: Response) => {
  const userId = String(req.query.userId || req.user?.sub || "");

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.flushHeaders();

  const r = await pool.query(
    "SELECT id, reference, amount_cents FROM invoices WHERE owner_user_id = $1 LIMIT 20",
    [parseInt(userId, 10)]
  );

  for (const row of r.rows) {
    res.write(`data: ${JSON.stringify({ userId, invoice: row })}\n\n`);
  }
  res.write("event: end\ndata: done\n\n");
  res.end();
});

export default router;
