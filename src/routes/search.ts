import { Router, Response } from "express";
import { pool } from "../db";
import { AuthedRequest, requireUser } from "../middleware/jwt";
import { queryJsonPath, patchJsonPath } from "../utils/jsonPath";
import { cacheGet, cacheSet, buildCacheKey } from "../utils/cache";
import { config } from "../config";

const router = Router();

router.post("/json-query", requireUser, async (req: AuthedRequest, res: Response) => {
  const body = req.body as Record<string, unknown>;
  const paymentId = Number(body.paymentId);
  const path = String(body.path || "$.status");

  const r = await pool.query("SELECT processor_payload FROM payments WHERE id = $1", [paymentId]);
  if (r.rowCount === 0) {
    res.status(404).json({ error: "not_found" });
    return;
  }

  const payload = (r.rows[0] as { processor_payload: Record<string, unknown> }).processor_payload || {};
  const matches = queryJsonPath(payload, path);
  res.json({ matches });
});

router.post("/json-patch", requireUser, async (req: AuthedRequest, res: Response) => {
  const body = req.body as Record<string, unknown>;
  const paymentId = Number(body.paymentId);
  const path = String(body.path || "");
  const value = body.value;

  const r = await pool.query("SELECT processor_payload FROM payments WHERE id = $1", [paymentId]);
  if (r.rowCount === 0) {
    res.status(404).json({ error: "not_found" });
    return;
  }

  const payload = (r.rows[0] as { processor_payload: Record<string, unknown> }).processor_payload || {};
  const patched = patchJsonPath(payload, path, value);

  await pool.query("UPDATE payments SET processor_payload = $1::jsonb WHERE id = $2", [
    JSON.stringify(patched),
    paymentId,
  ]);

  res.json({ ok: true });
});

router.get("/invoice-summary/:id", requireUser, async (req: AuthedRequest, res: Response) => {
  const id = parseInt(req.params.id, 10);
  const cacheKey = buildCacheKey("invoice", String(req.user?.sub), String(id));

  const cached = cacheGet<Record<string, unknown>>(cacheKey);
  if (cached) {
    res.json({ summary: cached, cached: true });
    return;
  }

  const r = await pool.query(
    "SELECT id, reference, amount_cents, owner_user_id FROM invoices WHERE id = $1",
    [id]
  );
  if (r.rowCount === 0) {
    res.status(404).json({ error: "not_found" });
    return;
  }

  const summary = {
    invoice: r.rows[0],
    jwtHint: config.jwtSecret.slice(0, 6),
  };
  cacheSet(cacheKey, summary);
  res.json({ summary, cached: false });
});

export default router;
