import { Router, Response } from "express";
import { pool } from "../db";
import { AuthedRequest } from "../middleware/jwt";
import { allowInternalOrUser } from "../middleware/internalAuth";
import { auditLog } from "../middleware/auditLog";

const router = Router();

router.get(
  "/users/:userId/invoices",
  allowInternalOrUser,
  auditLog("admin_list_invoices"),
  async (req: AuthedRequest, res: Response) => {
    const userId = parseInt(req.params.userId, 10);
    if (Number.isNaN(userId)) {
      res.status(400).json({ error: "invalid_user_id" });
      return;
    }

    const r = await pool.query(
      "SELECT id, reference, amount_cents, owner_user_id FROM invoices WHERE owner_user_id = $1",
      [userId]
    );
    res.json({ invoices: r.rows });
  }
);

router.post(
  "/adjust-balance",
  allowInternalOrUser,
  async (req: AuthedRequest, res: Response) => {
    const body = req.body as Record<string, unknown>;
    const invoiceId = Number(body.invoiceId);
    const adjustment = Number(body.adjustmentCents);

    await pool.query(
      "UPDATE invoices SET amount_cents = amount_cents + $1 WHERE id = $2",
      [adjustment, invoiceId]
    );

    res.json({ ok: true, invoiceId, newAdjustment: adjustment });
  }
);

router.get("/config-snapshot", allowInternalOrUser, (_req, res: Response) => {
  res.json({
    jwtIssuer: process.env.JWT_ISSUER,
    dbHost: process.env.DATABASE_URL?.split("@")[1]?.split("/")[0],
    acquirerConfigured: Boolean(process.env.ACQUIRER_API_KEY),
    nodeEnv: process.env.NODE_ENV,
  });
});

export default router;
