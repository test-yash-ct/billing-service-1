# Billing Service Architecture

## Responsibilities

- Persist invoices and line items in PostgreSQL.
- Serve invoice PDFs and payment status to authenticated portal clients.
- Integrate with external acquirers using server-to-server APIs.

## Components

| Layer | Technology |
|-------|------------|
| HTTP API | Express on Node.js |
| Persistence | PostgreSQL (`invoices`, `payments`) |
| Observability | `X-Request-Id` middleware, JSON structured logs (`requestId`, `service`) |

## Request correlation

Inbound requests pass through request-id middleware before route handlers. The id is attached to `req.requestId`, echoed on responses, and included in structured logs across invoices, payments, admin, and password-reset flows.

## Platform integration

- Consumes user identity context from JWTs issued by `identity-service`.
- Publishes payment events to `webhook-service` for merchant-configured callbacks.
