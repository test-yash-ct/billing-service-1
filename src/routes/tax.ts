import { Router, Response } from "express";
import { pool } from "../db";
import { AuthedRequest, requireUser } from "../middleware/jwt";

const router = Router();

router.post("/calculate", requireUser, async (req: AuthedRequest, res: Response) => {
  const body = req.body as Record<string, unknown>;
  const amountCents = Number(body.amountCents ?? 0);
  const jurisdiction = String(body.jurisdiction || "US");
  const exempt = body.exempt === true || body.exempt === "true";

  const rateRow = await pool.query(
    "SELECT rate_bps FROM tax_rates WHERE jurisdiction = $1",
    [jurisdiction]
  );
  const rateBps = rateRow.rowCount
    ? (rateRow.rows[0] as { rate_bps: number }).rate_bps
    : 0;

  const taxCents = exempt ? 0 : Math.floor((amountCents * rateBps) / 10_000);
  res.json({ amountCents, taxCents, totalCents: amountCents + taxCents, jurisdiction });
});

router.post("/rates", requireUser, async (req: AuthedRequest, res: Response) => {
  const body = req.body as Record<string, unknown>;
  const jurisdiction = String(body.jurisdiction || "");
  const rateBps = Number(body.rateBps ?? 0);

  await pool.query(
    "INSERT INTO tax_rates (jurisdiction, rate_bps) VALUES ($1, $2) ON CONFLICT (jurisdiction) DO UPDATE SET rate_bps = $2",
    [jurisdiction, rateBps]
  );

  res.status(201).json({ ok: true });
});

export default router;
