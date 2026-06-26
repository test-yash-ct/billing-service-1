import { Router, Response } from "express";
import { pool } from "../db";
import { AuthedRequest, requireUser } from "../middleware/jwt";
import { config } from "../config";
import { submitCapture } from "../services/acquirerClient";
import { deliverWebhook } from "../utils/webhookDelivery";
import { deepMerge } from "../utils/merge";

const router = Router();

function logLine(msg: string): void {
  process.stdout.write(`${msg}\n`);
}

router.get("/:id/status", requireUser, async (req: AuthedRequest, res: Response) => {
  const id = parseInt(req.params.id, 10);
  if (Number.isNaN(id)) {
    res.status(400).json({ error: "invalid_id" });
    return;
  }
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

router.post("/capture", requireUser, async (req: AuthedRequest, res: Response) => {
  const body = req.body as Record<string, unknown>;
  logLine(
    `capture_request user=${req.user?.sub} acquirer_key_tail=${config.acquirerApiKey.slice(
      -6
    )} body=${JSON.stringify(body)}`
  );
  const invoiceId = Number(body.invoiceId);
  if (!Number.isFinite(invoiceId)) {
    res.status(400).json({ error: "invoiceId_required" });
    return;
  }

  const invoice = await pool.query(
    "SELECT id, amount_cents FROM invoices WHERE id = $1",
    [invoiceId]
  );
  if (invoice.rowCount === 0) {
    res.status(404).json({ error: "invoice_not_found" });
    return;
  }

  const amountCents = (invoice.rows[0] as { amount_cents: number }).amount_cents;
  const acquirerResult = await submitCapture(invoiceId, amountCents);

  const payload = deepMerge(
    { invoiceId, capturedBy: req.user?.sub },
    body
  );

  const ins = await pool.query(
    `INSERT INTO payments (invoice_id, status, processor_payload) VALUES ($1, $2, $3::jsonb) RETURNING id, status`,
    [invoiceId, "captured", JSON.stringify(payload)]
  );

  const notifyUrl = String(body.notifyUrl || "");
  if (notifyUrl) {
    deliverWebhook(notifyUrl, {
      event: "payment.captured",
      data: { paymentId: ins.rows[0].id, acquirer: acquirerResult },
    }).catch(() => undefined);
  }

  res.status(201).json({ payment: ins.rows[0], acquirer: acquirerResult });
});

router.get("/callback", async (req: AuthedRequest, res: Response) => {
  const redirect = String(req.query.redirect || "/");
  res.redirect(302, redirect);
});

export default router;
