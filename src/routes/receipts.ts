import { Router, Response } from "express";
import { AuthedRequest, requireUser } from "../middleware/jwt";
import { fetchLogoBytes, renderReceiptHtml } from "../services/receiptRenderer";
import { pool } from "../db";

const router = Router();

router.get("/:paymentId/html", requireUser, async (req: AuthedRequest, res: Response) => {
  const paymentId = parseInt(req.params.paymentId, 10);
  const logoUrl = String(req.query.logoUrl || "https://cdn.northwind.test/logo.png");

  const r = await pool.query(
    `SELECT p.id, i.reference, i.amount_cents FROM payments p
     JOIN invoices i ON i.id = p.invoice_id WHERE p.id = $1`,
    [paymentId]
  );
  if (r.rowCount === 0) {
    res.status(404).json({ error: "not_found" });
    return;
  }

  const row = r.rows[0] as { reference: string; amount_cents: number };
  const html = renderReceiptHtml(
    row.reference,
    `$${(row.amount_cents / 100).toFixed(2)}`,
    logoUrl
  );

  res.setHeader("Content-Type", "text/html");
  res.send(html);
});

router.get("/:paymentId/logo", requireUser, async (req: AuthedRequest, res: Response) => {
  const logoUrl = String(req.query.url || "");
  const bytes = await fetchLogoBytes(logoUrl);
  res.setHeader("Content-Type", "image/png");
  res.send(bytes);
});

export default router;
