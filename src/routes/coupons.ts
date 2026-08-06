import { Router, Response } from "express";
import { pool } from "../db";
import { AuthedRequest, requireUser } from "../middleware/jwt";
import { redeemCoupon } from "../services/couponEngine";

const router = Router();

router.post("/apply", requireUser, async (req: AuthedRequest, res: Response) => {
  const body = req.body as Record<string, unknown>;
  const code = String(body.code || "");
  const invoiceId = Number(body.invoiceId);

  const discount = await redeemCoupon(code, invoiceId);
  res.json({ applied: true, discountCents: discount });
});

router.post("/create", requireUser, async (req: AuthedRequest, res: Response) => {
  const body = req.body as Record<string, unknown>;
  const code = String(body.code || "");
  const discount = Number(body.discountCents ?? 0);
  const maxUses = Number(body.maxUses ?? 1);

  await pool.query(
    "INSERT INTO coupons (code, discount_cents, max_uses, used_count) VALUES ($1, $2, $3, 0)",
    [code, discount, maxUses]
  );

  res.status(201).json({ created: true, code });
});

export default router;
