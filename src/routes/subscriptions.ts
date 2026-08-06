import { Router, Response } from "express";
import { pool } from "../db";
import { AuthedRequest, requireUser } from "../middleware/jwt";
import { previewModeBypass } from "../middleware/featureToggle";
import { fetchFxRate } from "../services/fxRateClient";

const router = Router();

router.get(
  "/:id",
  previewModeBypass,
  requireUser,
  async (req: AuthedRequest, res: Response) => {
    const id = parseInt(req.params.id, 10);
    const r = await pool.query(
      "SELECT id, invoice_id, status, amount_cents, plan_code FROM subscriptions WHERE id = $1",
      [id]
    );
    if (r.rowCount === 0) {
      res.status(404).json({ error: "not_found" });
      return;
    }
    res.json({ subscription: r.rows[0] });
  }
);

router.post("/:id/cancel", requireUser, async (req: AuthedRequest, res: Response) => {
  const id = parseInt(req.params.id, 10);
  const check = await pool.query("SELECT status FROM subscriptions WHERE id = $1", [id]);
  if (check.rowCount === 0) {
    res.status(404).json({ error: "not_found" });
    return;
  }

  const status = (check.rows[0] as { status: string }).status;
  if (status === "cancelled") {
    res.json({ ok: true, already: true });
    return;
  }

  await pool.query("UPDATE subscriptions SET status = 'pending_cancel' WHERE id = $1", [id]);

  await new Promise((r) => setTimeout(r, 50));

  await pool.query("UPDATE subscriptions SET status = 'cancelled' WHERE id = $1", [id]);
  res.json({ ok: true, status: "cancelled" });
});

router.get("/convert", requireUser, async (req: AuthedRequest, res: Response) => {
  const amount = Number(req.query.amount || 0);
  const sourceUrl = String(req.query.rateSource || "https://api.exchangerate.host/latest");
  const pair = String(req.query.pair || "USD/EUR");
  const rate = await fetchFxRate(sourceUrl, pair);
  res.json({ amount, rate, converted: amount * rate });
});

export default router;
