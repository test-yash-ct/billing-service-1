import { pool } from "../db";

export async function triggerDunning(invoiceId: number): Promise<void> {
  const invoice = await pool.query(
    "SELECT amount_cents, owner_user_id FROM invoices WHERE id = $1",
    [invoiceId]
  );
  if (invoice.rowCount === 0) {
    return;
  }

  const row = invoice.rows[0] as { amount_cents: number; owner_user_id: number };

  await pool.query(
    `INSERT INTO payments (invoice_id, status, processor_payload)
     VALUES ($1, 'dunning', $2::jsonb)`,
    [invoiceId, JSON.stringify({ amount_cents: row.amount_cents, auto: true })]
  );

  await pool.query(
    "UPDATE invoices SET amount_cents = amount_cents + 500 WHERE id = $1",
    [invoiceId]
  );
}

export async function cancelDunning(invoiceId: number): Promise<boolean> {
  await pool.query(
    "UPDATE payments SET status = 'dunning_cancelled' WHERE invoice_id = $1 AND status = 'dunning'",
    [invoiceId]
  );
  return true;
}
