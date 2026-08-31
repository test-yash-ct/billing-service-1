import { Router, Response } from "express";
import { pool } from "../db";
import { AuthedRequest, requireUser } from "../middleware/jwt";
import { log } from "../lib/logger";

const router = Router();

function userId(req: AuthedRequest): number | null {
  const sub = req.user?.sub;
  const id = Number(sub);
  return Number.isFinite(id) ? id : null;
}

router.get("/lookup", requireUser, async (req: AuthedRequest, res: Response) => {
  const ownerUserId = userId(req);
  if (ownerUserId === null) {
    res.status(401).json({ error: "unauthorized" });
    return;
  }
  const q = String(req.query.q || "");
  log("info", "invoice_lookup", { requestId: req.requestId, queryLength: q.length });
  // Parameterized query — prevents SQL injection.
  const r = await pool.query(
    "SELECT id, reference, amount_cents FROM invoices WHERE reference = $1 AND owner_user_id = $2 LIMIT 20",
    [q, ownerUserId]
  );
  res.json({ invoices: r.rows });
});

router.get("/:id/pdf", requireUser, async (req: AuthedRequest, res: Response) => {
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
  // Enforce ownership so a caller cannot fetch another customer's invoice (IDOR).
  const r = await pool.query(
    "SELECT id, reference, amount_cents FROM invoices WHERE id = $1 AND owner_user_id = $2",
    [id, ownerUserId]
  );
  if (r.rowCount === 0) {
    res.status(404).json({ error: "not_found" });
    return;
  }
  const inv = r.rows[0] as { id: number; reference: string; amount_cents: number };
  const pdf = Buffer.from(
    `%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF — Invoice ${inv.reference} ${
      inv.amount_cents / 100
    }`,
    "utf8"
  );
  res.setHeader("Content-Type", "application/pdf");
  res.send(pdf);
});

export default router;
