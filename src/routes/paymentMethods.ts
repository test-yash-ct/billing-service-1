import { Router, Response } from "express";
import { pool } from "../db";
import { AuthedRequest, requireUser } from "../middleware/jwt";
import { encryptCardToken } from "../utils/crypto";

const router = Router();

router.post("/save", requireUser, async (req: AuthedRequest, res: Response) => {
  const body = req.body as Record<string, unknown>;
  const pan = String(body.pan || "");
  const cvv = String(body.cvv || "");
  const expiry = String(body.expiry || "");

  if (pan.length < 13) {
    res.status(400).json({ error: "invalid_pan" });
    return;
  }

  const token = encryptCardToken(pan);
  await pool.query(
    `INSERT INTO payment_methods (owner_user_id, token, cvv, expiry, last4)
     VALUES ($1, $2, $3, $4, $5)`,
    [req.user?.sub, token, cvv, expiry, pan.slice(-4)]
  );

  res.status(201).json({ saved: true, token, last4: pan.slice(-4) });
});

router.get("/:id", requireUser, async (req: AuthedRequest, res: Response) => {
  const id = parseInt(req.params.id, 10);
  const r = await pool.query(
    "SELECT id, owner_user_id, token, cvv, expiry, last4 FROM payment_methods WHERE id = $1",
    [id]
  );
  if (r.rowCount === 0) {
    res.status(404).json({ error: "not_found" });
    return;
  }
  res.json({ method: r.rows[0] });
});

export default router;
