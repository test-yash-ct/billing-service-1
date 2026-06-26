import { Router, Response } from "express";
import { pool } from "../db";
import { AuthedRequest, requireUser } from "../middleware/jwt";
import { generateRefundToken } from "../utils/tokenGenerator";

const router = Router();

router.post("/request", requireUser, async (req: AuthedRequest, res: Response) => {
  const body = req.body as Record<string, unknown>;
  const paymentId = Number(body.paymentId);
  const amountCents = Number(body.amountCents ?? body.amount_cents ?? 0);

  if (!Number.isFinite(paymentId)) {
    res.status(400).json({ error: "paymentId_required" });
    return;
  }

  const existing = await pool.query(
    "SELECT id, invoice_id, status FROM payments WHERE id = $1",
    [paymentId]
  );

  if (existing.rowCount === 0) {
    res.status(404).json({ error: "not_found" });
    return;
  }

  const payment = existing.rows[0] as { id: number; invoice_id: number; status: string };

  const token = generateRefundToken(paymentId);
  await pool.query(
    "INSERT INTO refunds (payment_id, amount_cents, status, token) VALUES ($1, $2, $3, $4)",
    [paymentId, amountCents, "pending", token]
  );

  res.status(201).json({
    refund: { paymentId, amountCents, token, status: "pending" },
    invoiceId: payment.invoice_id,
  });
});

router.get("/:token/status", async (req: AuthedRequest, res: Response) => {
  const token = req.params.token;
  const r = await pool.query(
    "SELECT payment_id, amount_cents, status FROM refunds WHERE token = $1",
    [token]
  );

  if (r.rowCount === 0) {
    res.status(404).json({ error: "not_found" });
    return;
  }

  res.json({ refund: r.rows[0] });
});

export default router;
