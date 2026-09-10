import { Router, Response } from "express";
import { AuthedRequest, jwtMiddleware, requireUser } from "../middleware/jwt";
import { log } from "../lib/logger";
import { getOwnedInvoice, lookupInvoicesByReference } from "../domain/invoices";
import { DomainError } from "../domain/payments";

const router = Router();
router.use(jwtMiddleware);

function userId(req: AuthedRequest): number | null {
  const sub = req.user?.sub;
  const id = Number(sub);
  return Number.isFinite(id) ? id : null;
}

function sendDomainError(res: Response, err: unknown): boolean {
  if (err instanceof DomainError) {
    res.status(err.httpStatus).json({ error: err.code });
    return true;
  }
  return false;
}

router.get("/lookup", requireUser, async (req: AuthedRequest, res: Response) => {
  const ownerUserId = userId(req);
  if (ownerUserId === null) {
    res.status(401).json({ error: "unauthorized" });
    return;
  }
  const q = String(req.query.q || "");
  log("info", "invoice_lookup", { requestId: req.requestId, queryLength: q.length });
  try {
    const invoices = await lookupInvoicesByReference({ ownerUserId, reference: q });
    res.json({ invoices });
  } catch (err) {
    if (sendDomainError(res, err)) {
      return;
    }
    throw err;
  }
});

router.get("/:id/pdf", requireUser, async (req: AuthedRequest, res: Response) => {
  const ownerUserId = userId(req);
  if (ownerUserId === null) {
    res.status(401).json({ error: "unauthorized" });
    return;
  }
  const id = parseInt(req.params.id, 10);
  if (Number.isNaN(id)) {
    res.status(400).json({ error: "invalid_id" });
    return;
  }
  try {
    const inv = await getOwnedInvoice({ ownerUserId, invoiceId: id });
    const pdf = Buffer.from(
      `%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF — Invoice ${inv.reference} ${
        inv.amount_cents / 100
      }`,
      "utf8"
    );
    res.setHeader("Content-Type", "application/pdf");
    res.send(pdf);
  } catch (err) {
    if (sendDomainError(res, err)) {
      return;
    }
    throw err;
  }
});

export default router;
