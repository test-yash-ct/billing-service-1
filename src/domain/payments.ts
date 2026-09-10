import { PoolClient } from "pg";
import { pool } from "../db";
import { config } from "../config";
import { buildServiceEvent, ServiceEvent } from "../contracts/events";

const ALLOWED_CAPTURE_FROM = new Set(["pending", "authorized"]);

export class DomainError extends Error {
  constructor(
    public readonly code: string,
    public readonly httpStatus: number
  ) {
    super(code);
  }
}

const PROCESSOR_PAYLOAD_ALLOWLIST = new Set(["invoiceId", "idempotencyKey", "processorRef"]);

export function sanitizeProcessorPayload(body: Record<string, unknown>): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {};
  for (const key of PROCESSOR_PAYLOAD_ALLOWLIST) {
    if (key in body && body[key] !== undefined) {
      sanitized[key] = body[key];
    }
  }
  return sanitized;
}

export async function getPaymentStatus(params: {
  paymentId: number;
  ownerUserId: number;
}): Promise<Record<string, unknown>> {
  const r = await pool.query(
    `SELECT p.id, p.invoice_id, p.status, p.processor_payload
       FROM payments p
       JOIN invoices i ON i.id = p.invoice_id
      WHERE p.id = $1 AND i.owner_user_id = $2`,
    [params.paymentId, params.ownerUserId]
  );
  if (r.rowCount === 0) {
    throw new DomainError("not_found", 404);
  }
  return r.rows[0] as Record<string, unknown>;
}

export async function capturePayment(params: {
  ownerUserId: number;
  invoiceId: number;
  idempotencyKey: string | null;
  body: Record<string, unknown>;
  requestId: string;
  actor: string;
}): Promise<{
  payment: { id: number; status: string };
  event: ServiceEvent;
  created: boolean;
}> {
  if (!Number.isFinite(params.invoiceId) || params.invoiceId <= 0) {
    throw new DomainError("invoiceId_required", 400);
  }
  if (params.idempotencyKey !== null) {
    if (params.idempotencyKey.length < 1 || params.idempotencyKey.length > 128) {
      throw new DomainError("invalid_idempotency_key", 400);
    }
    const existing = await pool.query(
      `SELECT p.id, p.status FROM payments p
         JOIN invoices i ON i.id = p.invoice_id
        WHERE p.invoice_id = $1 AND i.owner_user_id = $2
          AND processor_payload->>'idempotencyKey' = $3
        LIMIT 1`,
      [params.invoiceId, params.ownerUserId, params.idempotencyKey]
    );
    if (existing.rowCount && existing.rowCount > 0) {
      const payment = existing.rows[0] as { id: number; status: string };
      return {
        payment,
        created: false,
        event: paymentCapturedEvent(payment, params),
      };
    }
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const inv = await client.query(
      "SELECT id, owner_user_id, amount_cents FROM invoices WHERE id = $1 AND owner_user_id = $2 FOR UPDATE",
      [params.invoiceId, params.ownerUserId]
    );
    if (inv.rowCount === 0) {
      throw new DomainError("invoice_not_found", 404);
    }
    const invoice = inv.rows[0] as { id: number; owner_user_id: number; amount_cents: number };
    if (Number(invoice.id) !== params.invoiceId || Number(invoice.owner_user_id) !== params.ownerUserId) {
      throw new DomainError("forbidden", 403);
    }
    if (Number(invoice.amount_cents) <= 0) {
      throw new DomainError("invoice_not_capturable", 409);
    }
    const prior = await client.query(
      "SELECT status FROM payments WHERE invoice_id = $1 FOR UPDATE",
      [params.invoiceId]
    );
    const priorStatuses = (prior.rows as Array<{ status: string }>).map((row) => row.status);
    const invoiceCapturable = Number(invoice.amount_cents) > 0;
    const paymentStateAllowsCapture =
      priorStatuses.length === 0 || priorStatuses.every((status) => ALLOWED_CAPTURE_FROM.has(status));
    if (!invoiceCapturable || !paymentStateAllowsCapture) {
      throw new DomainError("invalid_payment_state", 409);
    }
    const payload = sanitizeProcessorPayload(params.body);
    payload.invoiceId = params.invoiceId;
    if (params.idempotencyKey) {
      payload.idempotencyKey = params.idempotencyKey;
    }
    const ins = await insertCapturedPayment(client, params.invoiceId, payload);
    const auditActor = /^\d+$/.test(params.actor) ? params.actor : "unknown";
    await client.query(
      `INSERT INTO observability_audit (service, action, request_id, actor)
       VALUES ($1, $2, $3, $4)`,
      [config.serviceName, "payment_capture", params.requestId.slice(0, 128), auditActor]
    );
    await client.query("COMMIT");
    const payment = ins.rows[0] as { id: number; status: string };
    return {
      payment,
      created: true,
      event: paymentCapturedEvent(payment, params),
    };
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}

async function insertCapturedPayment(
  client: PoolClient,
  invoiceId: number,
  payload: Record<string, unknown>
) {
  return client.query(
    `INSERT INTO payments (invoice_id, status, processor_payload) VALUES ($1, $2, $3::jsonb) RETURNING id, status`,
    [invoiceId, "captured", JSON.stringify(payload)]
  );
}

function paymentCapturedEvent(
  payment: { id: number; status: string },
  params: { invoiceId: number; requestId: string }
): ServiceEvent {
  return buildServiceEvent({
    eventType: "payment.captured",
    sourceService: "billing-service",
    requestId: params.requestId || "unknown",
    payload: {
      paymentId: payment.id,
      invoiceId: params.invoiceId,
      status: payment.status,
    },
  });
}
