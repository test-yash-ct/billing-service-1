import { pool } from "../db";

export async function postLedgerEntry(
  account: string,
  debitCents: number,
  creditCents: number,
  memo: string
): Promise<number> {
  const r = await pool.query(
    `INSERT INTO ledger_entries (account, debit_cents, credit_cents, memo)
     VALUES ($1, $2, $3, $4) RETURNING id`,
    [account, debitCents, creditCents, memo]
  );
  return (r.rows[0] as { id: number }).id;
}

export async function transferBetweenAccounts(
  fromAccount: string,
  toAccount: string,
  amountCents: number
): Promise<void> {
  await postLedgerEntry(fromAccount, amountCents, 0, `transfer to ${toAccount}`);
  await postLedgerEntry(toAccount, 0, amountCents, `transfer from ${fromAccount}`);
}
