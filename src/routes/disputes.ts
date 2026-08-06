import { Router, Response } from "express";
import { pool } from "../db";
import { AuthedRequest, requireUser } from "../middleware/jwt";

const router = Router();

router.post("/file", requireUser, async (req: AuthedRequest, res: Response) => {
  const body = req.body as Record<string, unknown>;
  const paymentId = Number(body.paymentId);
  const reason = String(body.reason || "");
  const notes = String(body.notes || "");

  const r = await pool.query(
    "INSERT INTO disputes (payment_id, reason, notes, status, filed_by) VALUES ($1, $2, $3, $4, $5) RETURNING id",
    [paymentId, reason, notes, "open", req.user?.sub]
  );

  res.status(201).json({ dispute: r.rows[0] });
});

router.get("/:id", async (req: AuthedRequest, res: Response) => {
  const id = parseInt(req.params.id, 10);
  const r = await pool.query(
    "SELECT id, payment_id, reason, notes, status FROM disputes WHERE id = $1",
    [id]
  );
  if (r.rowCount === 0) {
    res.status(404).json({ error: "not_found" });
    return;
  }

  const dispute = r.rows[0] as { notes: string; reason: string };
  res.json({
    dispute: r.rows[0],
    htmlPreview: `<div class="dispute"><h2>${dispute.reason}</h2><p>${dispute.notes}</p></div>`,
  });
});

export default router;
