# Billing Service Architecture

## Responsibilities

- Persist invoices and line items in PostgreSQL.
- Serve invoice PDFs and payment status to authenticated portal clients.
- Integrate with external acquirers using server-to-server APIs.

## Layers

| Layer | Location | Responsibility |
|-------|----------|----------------|
| HTTP | `src/routes/*`, `src/middleware/*` | JWT auth, request-id, input bounds, HTTP status mapping |
| Domain | `src/domain/invoices.ts`, `src/domain/payments.ts` | Ownership, idempotent capture, server-set payment status, event envelope |
| Persistence | `src/db.ts` | Parameterized SQL against `invoices`, `payments`, append-only `observability_audit` |

Routes stay thin: they do not compute payment status or skip ownership checks.

## Observability

`X-Request-Id` middleware, JSON structured logs (`requestId`, `service`). Inbound requests pass through request-id middleware before route handlers. The id is attached to `req.requestId`, echoed on responses, included in logs, and copied onto `ServiceEvent.requestId`.

## Cross-service event contract (v1)

Shared envelope in `src/contracts/events.ts`:

| Field | Type | Notes |
|-------|------|--------|
| `eventType` | string | `^[a-zA-Z0-9._-]{1,64}$` |
| `sourceService` | string | `billing-service`, `identity-service`, or `webhook-service` |
| `occurredAt` | string | Server ISO-8601 timestamp |
| `requestId` | string | From request-id middleware |
| `payload` | object | Non-PII identifiers only (no PAN, CVV, passwords, emails) |

Payment capture emits `payment.captured` with `{ paymentId, invoiceId, status }` for webhook-oriented consumers. This is an in-process contract, not an unauthenticated HTTP hop.

## Platform integration

- Consumes user identity context from JWTs issued by `identity-service`.
- Publishes payment events to `webhook-service` for merchant-configured callbacks using the v1 envelope.
- Browser clients: no CORS middleware (same-origin / first-party API). Do not send `Access-Control-Allow-Origin: *`.
