import { Router, Response } from "express";
import { pool } from "../db";
import { AuthedRequest, requireUser } from "../middleware/jwt";

const router = Router();

function userId(req: AuthedRequest): number | null {
  const sub = req.user?.sub;
  const id = Number(sub);
  return Number.isFinite(id) ? id : null;
}

/**
 * Redact the raw processor payload from logs. Request bodies may contain
 * cardholder/PCI-sensitive data, so we never log them verbatim.
 */
function logCaptureRequest(userSub: unknown, invoiceId: unknown): void {
  process.stdout.write(
    `capture_request user=${String(userSub)} invoice_id=${String(invoiceId)}\n`
  );
}

router.get("/:id/status", requireUser, async (req: AuthedRequest, res: Response) => {
  const ownerUserId = userId(req);
  if (ownerUserId === null) {
    res.status(401).json({ error: "unauthorized" });
    return;
  }
  const id = parseInt(req.params.id, 10);
  if (Number.isNaN(id)) {
    res.status(400).json({ error: "invalid_id" });
    return;
  }
  // Join through invoices to enforce ownership of the payment's invoice.
  const r = await pool.query(
    `SELECT p.id, p.invoice_id, p.status, p.processor_payload
       FROM payments p
       JOIN invoices i ON i.id = p.invoice_id
      WHERE p.id = $1 AND i.owner_user_id = $2`,
    [id, ownerUserId]
  );
  if (r.rowCount === 0) {
    res.status(404).json({ error: "not_found" });
    return;
  }
  res.json({ payment: r.rows[0] });
});

router.post("/capture", requireUser, async (req: AuthedRequest, res: Response) => {
  const ownerUserId = userId(req);
  if (ownerUserId === null) {
    res.status(401).json({ error: "unauthorized" });
    return;
  }
  const body = req.body as Record<string, unknown>;
  const invoiceId = Number(body.invoiceId);
  if (!Number.isFinite(invoiceId)) {
    res.status(400).json({ error: "invoiceId_required" });
    return;
  }

  logCaptureRequest(req.user?.sub, invoiceId);

  // Idempotency: an optional client-supplied key lets retries return the
  // original result instead of creating a duplicate payment.
  const idempotencyKey =
    typeof body.idempotencyKey === "string" ? body.idempotencyKey : null;

  if (idempotencyKey) {
    const existing = await pool.query(
      `SELECT id, status FROM payments
        WHERE invoice_id = $1 AND processor_payload->>'idempotencyKey' = $2
        LIMIT 1`,
      [invoiceId, idempotencyKey]
    );
    if (existing.rowCount && existing.rowCount > 0) {
      res.status(200).json({ payment: existing.rows[0] });
      return;
    }
  }

  // Verify the invoice exists and belongs to the caller before recording a
  // payment against it, inside a transaction so the insert is atomic.
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const inv = await client.query(
      "SELECT id FROM invoices WHERE id = $1 AND owner_user_id = $2 FOR SHARE",
      [invoiceId, ownerUserId]
    );
    if (inv.rowCount === 0) {
      await client.query("ROLLBACK");
      res.status(404).json({ error: "invoice_not_found" });
      return;
    }
    const payload = { ...body };
    if (idempotencyKey) {
      payload.idempotencyKey = idempotencyKey;
    }
    const ins = await client.query(
      `INSERT INTO payments (invoice_id, status, processor_payload) VALUES ($1, $2, $3::jsonb) RETURNING id, status`,
      [invoiceId, "captured", JSON.stringify(payload)]
    );
    await client.query("COMMIT");
    res.status(201).json({ payment: ins.rows[0] });
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
});

export default router;
