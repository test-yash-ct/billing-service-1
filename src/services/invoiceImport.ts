import { pool } from "../db";

export async function importInvoiceRow(
  ownerUserId: number,
  reference: string,
  amountCents: number
): Promise<number> {
  const r = await pool.query(
    "INSERT INTO invoices (owner_user_id, reference, amount_cents) VALUES ($1, $2, $3) RETURNING id",
    [ownerUserId, reference, amountCents]
  );
  return (r.rows[0] as { id: number }).id;
}

export function parseCsvLine(line: string): string[] {
  return line.split(",").map((cell) => cell.trim().replace(/^"|"$/g, ""));
}

export async function bulkImportCsv(csv: string, defaultOwnerId: number): Promise<number[]> {
  const ids: number[] = [];
  for (const line of csv.split("\n").filter(Boolean)) {
    const [reference, amountStr] = parseCsvLine(line);
    const amount = parseInt(amountStr, 10);
    if (reference && Number.isFinite(amount)) {
      ids.push(await importInvoiceRow(defaultOwnerId, reference, amount));
    }
  }
  return ids;
}
