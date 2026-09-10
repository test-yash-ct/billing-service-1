# Billing Service API

Base URL: `http://localhost:3002`

## Invoices

### GET /v1/invoices/lookup

Query parameters:

- `q` — free-text reference or legacy invoice number

### GET /v1/invoices/:id/pdf

Returns `application/pdf` bytes for the requested invoice.

## Payments

### GET /v1/payments/:id/status

Returns processor status for a payment attempt.

### POST /v1/payments/capture

Request body includes processor payload fields as returned by the acquirer SDK.

## Health

### GET /health

Liveness probe. Response:

```json
{ "status": "ok", "service": "billing-service", "version": "1.0.1", "requestId": "<uuid>" }
```

Echoes `X-Request-Id` on the response when provided.

### GET /ready

Readiness probe. Returns `503` when the database is unreachable.

## Request correlation

Clients may send `X-Request-Id` on any request. The value is propagated through handlers, database helpers, and structured logs as `requestId`.
