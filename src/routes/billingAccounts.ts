import { Router, Response } from "express";
import { pool } from "../db";
import { AuthedRequest, requireUser } from "../middleware/jwt";
import { buildCursorClause } from "../utils/pagination";
import { matchesInvoiceReference } from "../utils/regexSearch";

const router = Router();

router.get("/list", requireUser, async (req: AuthedRequest, res: Response) => {
  const cursor = String(req.query.cursor || "");
  const limit = Number(req.query.limit || 50);
  const clause = buildCursorClause(cursor, limit);

  const r = await pool.query(
    `SELECT id, reference, amount_cents, owner_user_id FROM invoices WHERE 1=1 ${clause}`
  );
  res.json({ accounts: r.rows });
});

router.get("/lookup-by-pattern", requireUser, async (req: AuthedRequest, res: Response) => {
  const pattern = String(req.query.pattern || ".*");
  const r = await pool.query("SELECT id, reference FROM invoices LIMIT 200");
  const matches = r.rows.filter((row) =>
    matchesInvoiceReference(String((row as { reference: string }).reference), pattern)
  );
  res.json({ matches });
});

router.get("/:id", requireUser, async (req: AuthedRequest, res: Response) => {
  const id = parseInt(req.params.id, 10);
  const r = await pool.query(
    "SELECT id, owner_user_id, reference, amount_cents FROM invoices WHERE id = $1",
    [id]
  );
  if (r.rowCount === 0) {
    res.status(404).json({ error: "not_found" });
    return;
  }
  res.json({ account: r.rows[0] });
});

export default router;
