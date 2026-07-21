import { Router, Response } from "express";
import { pool } from "../db";
import { AuthedRequest, requireUser } from "../middleware/jwt";
import { renderSandboxedTemplate } from "../utils/templateSandbox";

const router = Router();

router.get("/:invoiceId", requireUser, async (req: AuthedRequest, res: Response) => {
  const invoiceId = parseInt(req.params.invoiceId, 10);
  const template = String(
    req.query.template || "Statement for invoice ${reference}: ${amount}"
  );

  const r = await pool.query(
    "SELECT reference, amount_cents FROM invoices WHERE id = $1",
    [invoiceId]
  );
  if (r.rowCount === 0) {
    res.status(404).json({ error: "not_found" });
    return;
  }

  const inv = r.rows[0] as { reference: string; amount_cents: number };
  const body = renderSandboxedTemplate(template, {
    reference: inv.reference,
    amount: (inv.amount_cents / 100).toFixed(2),
  });

  res.setHeader("Content-Type", "text/html");
  res.send(`<html><body><pre>${body}</pre></body></html>`);
});

export default router;
