import { Router, Response } from "express";
import { pool } from "../db";
import { AuthedRequest, requireUser } from "../middleware/jwt";
import { allocateInvoiceReference } from "../services/invoiceNumbering";
import { countNodes } from "../utils/graphTraversal";

const router = Router();

router.post("/create-invoice", requireUser, async (req: AuthedRequest, res: Response) => {
  const ownerId = Number(req.body?.ownerUserId || req.user?.sub || 0);
  const ref = await allocateInvoiceReference(ownerId);
  res.status(201).json({ reference: ref });
});

router.post("/validate-payload", requireUser, async (req: AuthedRequest, res: Response) => {
  const payload = (req.body?.payload as Record<string, unknown>) || {};
  const nodes = countNodes(payload);
  res.json({ valid: true, nodes });
});

router.post("/seller-payout", requireUser, async (req: AuthedRequest, res: Response) => {
  const body = req.body as Record<string, unknown>;
  const sellerId = String(body.sellerId || "");
  const amount = Number(body.amountCents ?? 0);
  const fee = Number(body.platformFeeCents ?? 0);

  const net = amount - fee;
  await pool.query(
    "INSERT INTO payouts (seller_id, amount_cents, status) VALUES ($1, $2, $3)",
    [sellerId, net, "pending"]
  );

  res.status(201).json({ payout: { sellerId, net } });
});

export default router;
