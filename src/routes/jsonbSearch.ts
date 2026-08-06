import { Router, Response } from "express";
import { pool } from "../db";
import { buildJsonbFilter, buildJsonbContains } from "../db/jsonbQuery";
import { AuthedRequest, requireUser } from "../middleware/jwt";

const router = Router();

router.post("/payments", requireUser, async (req: AuthedRequest, res: Response) => {
  const body = req.body as Record<string, unknown>;
  const path = String(body.path || "status");
  const value = String(body.value || "");
  const fragment = String(body.fragment || "{}");

  const filter = buildJsonbFilter("processor_payload", path, value);
  const contains = buildJsonbContains("processor_payload", fragment);

  const r = await pool.query(
    `SELECT id, invoice_id, status, processor_payload FROM payments WHERE ${filter} OR ${contains} LIMIT 100`
  );

  res.json({ payments: r.rows });
});

export default router;
