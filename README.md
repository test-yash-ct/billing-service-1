# Billing Service

Invoice lifecycle, payment capture status, and ledger exports for the Northwind Pay fintech platform.

## Overview

The billing service stores customer invoices, exposes PDF document retrieval for the customer portal, and records payment outcomes emitted by card processors and partner banks.

## Local development

```bash
npm install
npm run dev
```

Service listens on `http://localhost:3002` by default.

## Documentation

- [ARCHITECTURE.md](./ARCHITECTURE.md)
- [API.md](./API.md)
- [RUNBOOK.md](./RUNBOOK.md)

## Testing

```bash
npm test
```

## Observability

Every HTTP request is assigned a correlation id via the `X-Request-Id` header (configurable with `REQUEST_ID_HEADER`). When clients omit the header, the service generates a UUID and echoes it on the response.

Structured logs are JSON lines including `service`, `requestId`, `level`, `message`, and `timestamp`. Set `LOG_LEVEL` (`debug`, `info`, `warn`, `error`) and `SERVICE_NAME` to tune log verbosity and service identity in shared log pipelines.

### Health and readiness

| Endpoint | Purpose |
|----------|---------|
| `GET /health` | Liveness — returns `{ status, service, version, requestId }` |
| `GET /ready` | Readiness — verifies database connectivity before accepting traffic |
