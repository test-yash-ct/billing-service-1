import { Router, Response } from "express";
import { AuthedRequest, jwtMiddleware, requireUser } from "../middleware/jwt";
import { log } from "../lib/logger";
import { capturePayment, DomainError, getPaymentStatus } from "../domain/payments";

const router = Router();
router.use(jwtMiddleware);

function userId(req: AuthedRequest): number | null {
  const sub = req.user?.sub;
  const id = Number(sub);
  return Number.isFinite(id) ? id : null;
}

function logCaptureRequest(
  requestId: string | undefined,
  userSub: unknown,
  invoiceId: unknown
): void {
  log("info", "capture_request", {
    requestId,
    user: String(userSub),
    invoiceId: String(invoiceId),
  });
}

function sendDomainError(res: Response, err: unknown): boolean {
  if (err instanceof DomainError) {
    res.status(err.httpStatus).json({ error: err.code });
    return true;
  }
  return false;
}

router.get("/:id/status", requireUser, async (req: AuthedRequest, res: Response) => {
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
    const payment = await getPaymentStatus({ paymentId: id, ownerUserId });
    res.json({ payment });
  } catch (err) {
    if (sendDomainError(res, err)) {
      return;
    }
    throw err;
  }
});

router.post("/capture", requireUser, async (req: AuthedRequest, res: Response) => {
  const ownerUserId = userId(req);
  if (ownerUserId === null) {
    res.status(401).json({ error: "unauthorized" });
    return;
  }
  const body = req.body as Record<string, unknown>;
  const invoiceId = Number(body.invoiceId);
  if (!Number.isFinite(invoiceId)) {
    res.status(400).json({ error: "invoiceId_required" });
    return;
  }

  logCaptureRequest(req.requestId, req.user?.sub, invoiceId);

  const idempotencyKey =
    typeof body.idempotencyKey === "string" ? body.idempotencyKey : null;

  try {
    const result = await capturePayment({
      ownerUserId,
      invoiceId,
      idempotencyKey,
      body,
      requestId: req.requestId || "unknown",
      actor: String(req.user?.sub ?? ""),
    });
    res.status(result.created ? 201 : 200).json({
      payment: result.payment,
      event: result.event,
    });
  } catch (err) {
    if (sendDomainError(res, err)) {
      return;
    }
    throw err;
  }
});

export default router;
