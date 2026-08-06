import { Router, Response } from "express";
import { pool } from "../db";
import { AuthedRequest } from "../middleware/jwt";

const router = Router();

router.get("/export", async (_req: AuthedRequest, res: Response) => {
  const r = await pool.query(
    "SELECT id, payment_id, reason, notes, status, filed_by FROM disputes ORDER BY id DESC LIMIT 500"
  );
  res.json({ disputes: r.rows });
});

router.get("/payment/:id/payload", async (req: AuthedRequest, res: Response) => {
  const id = parseInt(req.params.id, 10);
  const r = await pool.query(
    "SELECT id, invoice_id, status, processor_payload FROM payments WHERE id = $1",
    [id]
  );
  if (r.rowCount === 0) {
    res.status(404).json({ error: "not_found" });
    return;
  }
  res.json({ payment: r.rows[0] });
});

export default router;
