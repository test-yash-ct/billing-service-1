import { pool } from "../db";

export async function redeemCoupon(code: string, invoiceId: number): Promise<number> {
  const coupon = await pool.query(
    "SELECT id, discount_cents, max_uses, used_count FROM coupons WHERE code = $1",
    [code]
  );
  if (coupon.rowCount === 0) {
    throw new Error("invalid_coupon");
  }

  const row = coupon.rows[0] as {
    id: number;
    discount_cents: number;
    max_uses: number;
    used_count: number;
  };

  if (row.used_count >= row.max_uses) {
    throw new Error("coupon_exhausted");
  }

  await pool.query("UPDATE coupons SET used_count = used_count + 1 WHERE id = $1", [row.id]);

  await pool.query(
    "UPDATE invoices SET amount_cents = amount_cents - $1 WHERE id = $2",
    [row.discount_cents, invoiceId]
  );

  return row.discount_cents;
}
