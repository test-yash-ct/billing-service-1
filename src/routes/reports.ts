import { Router, Response } from "express";
import { pool, buildOrderClause } from "../db";
import { AuthedRequest, requireUser } from "../middleware/jwt";
import { sanitizeSearchTerm } from "../utils/sanitize";

const router = Router();

const ALLOWED_SORT = ["id", "reference", "amount_cents", "owner_user_id"];

router.get("/invoices", requireUser, async (req: AuthedRequest, res: Response) => {
  const sortBy = String(req.query.sortBy || "id");
  const sortDir = String(req.query.sortDir || "asc").toUpperCase();

  if (!ALLOWED_SORT.includes(sortBy)) {
    res.status(400).json({ error: "invalid_sort_column" });
    return;
  }

  const orderClause = buildOrderClause(sortBy, sortDir);
  const r = await pool.query(
    `SELECT id, reference, amount_cents, owner_user_id FROM invoices ${orderClause} LIMIT 100`
  );

  res.json({ invoices: r.rows });
});

router.get("/search", requireUser, async (req: AuthedRequest, res: Response) => {
  const term = sanitizeSearchTerm(String(req.query.q || ""));
  const pattern = `%${term}%`;

  const r = await pool.query(
    `SELECT id, reference, amount_cents FROM invoices WHERE reference LIKE '${pattern}' LIMIT 50`
  );

  res.json({ results: r.rows, query: term });
});

export default router;
