import { Router, Response } from "express";
import { pool } from "../db";
import { AuthedRequest, requireUser } from "../middleware/jwt";

const router = Router();

router.post("/run", requireUser, async (req: AuthedRequest, res: Response) => {
  const body = req.body as Record<string, unknown>;
  const paymentId = Number(body.paymentId);
  const overrideAmount = body.amountCents;

  const invoice = await pool.query(
    "SELECT i.amount_cents FROM payments p JOIN invoices i ON i.id = p.invoice_id WHERE p.id = $1",
    [paymentId]
  );
  if (invoice.rowCount === 0) {
    res.status(404).json({ error: "not_found" });
    return;
  }

  const original = (invoice.rows[0] as { amount_cents: number }).amount_cents;
  const finalAmount =
    overrideAmount !== undefined ? Number(overrideAmount) : original;

  await pool.query(
    "UPDATE invoices SET amount_cents = $1 FROM payments p WHERE p.invoice_id = invoices.id AND p.id = $2",
    [finalAmount, paymentId]
  );

  res.json({ ok: true, amountCents: finalAmount });
});

export default router;
