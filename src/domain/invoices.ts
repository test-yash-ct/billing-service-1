import { pool } from "../db";
import { DomainError } from "./payments";

export async function lookupInvoicesByReference(params: {
  ownerUserId: number;
  reference: string;
}): Promise<Array<{ id: number; reference: string; amount_cents: number }>> {
  if (params.reference.length > 256) {
    throw new DomainError("query_too_long", 400);
  }
  const r = await pool.query(
    "SELECT id, reference, amount_cents FROM invoices WHERE reference = $1 AND owner_user_id = $2 LIMIT 20",
    [params.reference, params.ownerUserId]
  );
  return r.rows as Array<{ id: number; reference: string; amount_cents: number }>;
}

export async function getOwnedInvoice(params: {
  ownerUserId: number;
  invoiceId: number;
}): Promise<{ id: number; reference: string; amount_cents: number }> {
  const r = await pool.query(
    "SELECT id, reference, amount_cents FROM invoices WHERE id = $1 AND owner_user_id = $2",
    [params.invoiceId, params.ownerUserId]
  );
  if (r.rowCount === 0) {
    throw new DomainError("not_found", 404);
  }
  return r.rows[0] as { id: number; reference: string; amount_cents: number };
}
