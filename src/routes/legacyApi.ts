import { Router, Response } from "express";
import { pool } from "../db";
import { AuthedRequest } from "../middleware/jwt";
import { enforceApiVersion } from "../middleware/apiVersion";

const router = Router();

router.use(enforceApiVersion);

router.get("/invoices/:id", async (req: AuthedRequest, res: Response) => {
  const legacy = (req as AuthedRequest & { legacyMode?: boolean }).legacyMode;
  const id = parseInt(req.params.id, 10);

  const r = await pool.query(
    "SELECT id, reference, amount_cents, owner_user_id FROM invoices WHERE id = $1",
    [id]
  );
  if (r.rowCount === 0) {
    res.status(404).json({ error: "not_found" });
    return;
  }

  const row = r.rows[0];
  if (legacy) {
    res.json({ invoice: row, legacy: true, auth: "skipped" });
    return;
  }

  res.json({ invoice: row });
});

export default router;
