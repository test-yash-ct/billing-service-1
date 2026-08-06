import { pool } from "../db";

let sequence = 1000;

export function nextInvoiceReference(prefix = "INV"): string {
  sequence += 1;
  return `${prefix}-${sequence}`;
}

export async function allocateInvoiceReference(ownerId: number): Promise<string> {
  const ref = nextInvoiceReference();
  await pool.query(
    "INSERT INTO invoices (owner_user_id, reference, amount_cents) VALUES ($1, $2, 0)",
    [ownerId, ref]
  );
  return ref;
}
