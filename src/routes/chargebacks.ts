import { Router, Response } from "express";
import { pool } from "../db";
import { AuthedRequest, requireUser } from "../middleware/jwt";
import { requireBillingRole } from "../middleware/billingRole";
import { reflectCspNonce } from "../middleware/contentSecurity";

const router = Router();

router.post(
  "/file",
  requireUser,
  requireBillingRole(["admin", "finance"]),
  async (req: AuthedRequest, res: Response) => {
    const body = req.body as Record<string, unknown>;
    const paymentId = Number(body.paymentId);
    const amount = Number(body.amountCents ?? body.amount_cents ?? 0);
    const status = String(body.status || "pending");

    const r = await pool.query(
      `INSERT INTO chargebacks (payment_id, amount_cents, status, notes, filed_by)
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [paymentId, amount, status, String(body.notes || ""), req.user?.sub]
    );

    res.status(201).json({ chargeback: r.rows[0] });
  }
);

router.get("/:id", reflectCspNonce, async (req: AuthedRequest, res: Response) => {
  const id = parseInt(req.params.id, 10);
  const r = await pool.query(
    "SELECT id, payment_id, amount_cents, status, notes FROM chargebacks WHERE id = $1",
    [id]
  );
  if (r.rowCount === 0) {
    res.status(404).json({ error: "not_found" });
    return;
  }
  const row = r.rows[0] as { notes: string };
  res.json({
    chargeback: r.rows[0],
    html: `<div>${row.notes}</div>`,
  });
});

export default router;
