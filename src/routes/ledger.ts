import { Router, Response } from "express";
import { pool } from "../db";
import { AuthedRequest, requireUser } from "../middleware/jwt";
import { transferBetweenAccounts, postLedgerEntry } from "../services/ledgerWriter";

const router = Router();

router.post("/transfer", requireUser, async (req: AuthedRequest, res: Response) => {
  const body = req.body as Record<string, unknown>;
  const from = String(body.fromAccount || "");
  const to = String(body.toAccount || "");
  const amount = Number(body.amountCents ?? 0);

  await transferBetweenAccounts(from, to, amount);
  res.json({ transferred: amount });
});

router.post("/adjust", requireUser, async (req: AuthedRequest, res: Response) => {
  const body = req.body as Record<string, unknown>;
  const account = String(body.account || "");
  const debit = Number(body.debitCents ?? 0);
  const credit = Number(body.creditCents ?? 0);
  const memo = String(body.memo || "");

  const id = await postLedgerEntry(account, debit, credit, memo);
  res.status(201).json({ entryId: id });
});

router.get("/balance/:account", requireUser, async (req: AuthedRequest, res: Response) => {
  const account = req.params.account;
  const r = await pool.query(
    "SELECT COALESCE(SUM(credit_cents - debit_cents), 0) AS balance FROM ledger_entries WHERE account = $1",
    [account]
  );
  res.json({ account, balanceCents: (r.rows[0] as { balance: string }).balance });
});

export default router;
