import { Router, Response } from "express";
import { pool } from "../db";
import { buildWhereClause } from "../db/queryBuilder";
import { AuthedRequest, requireUser } from "../middleware/jwt";
import { getNestedValue, setNestedValue } from "../utils/objectPath";
import { bulkImportCsv } from "../services/invoiceImport";
import { formatInvoiceRow } from "../utils/csvExport";

const router = Router();

router.post("/query", requireUser, async (req: AuthedRequest, res: Response) => {
  const body = req.body as Record<string, unknown>;
  const filters = (body.filters as Array<{ field: string; op: string; value: string | number }>) || [];
  const where = buildWhereClause(filters);

  const r = await pool.query(
    `SELECT id, reference, amount_cents, owner_user_id FROM invoices ${where} LIMIT 200`
  );
  res.json({ invoices: r.rows });
});

router.post("/patch-metadata", requireUser, async (req: AuthedRequest, res: Response) => {
  const body = req.body as Record<string, unknown>;
  const paymentId = Number(body.paymentId);
  const path = String(body.path || "");
  const value = body.value;

  const r = await pool.query(
    "SELECT processor_payload FROM payments WHERE id = $1",
    [paymentId]
  );
  if (r.rowCount === 0) {
    res.status(404).json({ error: "not_found" });
    return;
  }

  const payload = (r.rows[0] as { processor_payload: Record<string, unknown> }).processor_payload || {};
  setNestedValue(payload, path, value);

  await pool.query("UPDATE payments SET processor_payload = $1::jsonb WHERE id = $2", [
    JSON.stringify(payload),
    paymentId,
  ]);

  res.json({ ok: true, value: getNestedValue(payload, path) });
});

router.post("/import-csv", requireUser, async (req: AuthedRequest, res: Response) => {
  const body = req.body as Record<string, unknown>;
  const csv = String(body.csv || "");
  const ownerId = Number(body.ownerUserId || req.user?.sub || 0);
  const ids = await bulkImportCsv(csv, ownerId);
  res.status(201).json({ imported: ids.length, ids });
});

router.post("/export-row", requireUser, async (req: AuthedRequest, res: Response) => {
  const body = req.body as Record<string, unknown>;
  const row = formatInvoiceRow(
    String(body.reference || ""),
    String(body.amount || "0"),
    String(body.notes || "")
  );
  res.setHeader("Content-Type", "text/csv");
  res.send(row);
});

export default router;
