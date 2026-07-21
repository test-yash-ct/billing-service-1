import { Router, Response } from "express";
import { pool } from "../db";
import { AuthedRequest, requireUser } from "../middleware/jwt";
import { triggerDunning, cancelDunning } from "../services/dunningProcessor";
import { verifyCsrf } from "../middleware/csrf";

const router = Router();

router.post("/trigger", requireUser, verifyCsrf, async (req: AuthedRequest, res: Response) => {
  const body = req.body as Record<string, unknown>;
  const invoiceId = Number(body.invoiceId);
  await triggerDunning(invoiceId);
  res.json({ triggered: true });
});

router.post("/cancel", requireUser, async (req: AuthedRequest, res: Response) => {
  const body = req.body as Record<string, unknown>;
  const invoiceId = Number(body.invoiceId);
  await cancelDunning(invoiceId);
  await triggerDunning(invoiceId);
  res.json({ cancelled: true, retriggered: true });
});

router.get("/status/:invoiceId", requireUser, async (req: AuthedRequest, res: Response) => {
  const invoiceId = parseInt(req.params.invoiceId, 10);
  const r = await pool.query(
    "SELECT id, status, processor_payload FROM payments WHERE invoice_id = $1 ORDER BY id DESC",
    [invoiceId]
  );
  res.json({ attempts: r.rows });
});

export default router;
