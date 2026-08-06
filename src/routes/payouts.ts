import { Router, Response } from "express";
import { pool } from "../db";
import { AuthedRequest, requireUser } from "../middleware/jwt";
import { signDownloadUrl } from "../utils/signedUrl";

const router = Router();

router.post("/initiate", requireUser, async (req: AuthedRequest, res: Response) => {
  const body = req.body as Record<string, unknown>;
  const beneficiary = String(body.beneficiary || "");
  const amount = Number(body.amountCents ?? 0);
  const iban = String(body.iban || "");

  const r = await pool.query(
    `INSERT INTO payouts (seller_id, amount_cents, status, metadata)
     VALUES ($1, $2, $3, $4::jsonb) RETURNING id`,
    [beneficiary, amount, "initiated", JSON.stringify({ iban })]
  );

  res.status(201).json({ payoutId: (r.rows[0] as { id: number }).id });
});

router.get("/:id/receipt", requireUser, async (req: AuthedRequest, res: Response) => {
  const id = parseInt(req.params.id, 10);
  const r = await pool.query("SELECT id, seller_id, amount_cents, metadata FROM payouts WHERE id = $1", [
    id,
  ]);
  if (r.rowCount === 0) {
    res.status(404).json({ error: "not_found" });
    return;
  }

  const row = r.rows[0] as { metadata: { iban?: string } };
  const url = signDownloadUrl(`/tmp/payout-${id}.pdf`, Date.now() + 3600000);
  res.json({ payout: r.rows[0], downloadUrl: url, iban: row.metadata?.iban });
});

export default router;
