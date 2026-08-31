# Billing Service Runbook

## Ownership

Revenue Operations and Core Payments share tier-2 ownership.

## Database

Migrations are applied through the deployment pipeline. For emergency read-only access, use the finance reporting role documented in the secrets vault.

## Key metrics

- Invoice generation latency P99
- Payment capture error rate by processor region
- Log volume by `requestId` for end-to-end trace correlation

## Environment

| Variable | Default | Description |
|----------|---------|-------------|
| `SERVICE_NAME` | `billing-service` | Service identity in logs and health responses |
| `LOG_LEVEL` | `info` | Minimum log level (`debug`, `info`, `warn`, `error`) |
| `REQUEST_ID_HEADER` | `X-Request-Id` | Incoming/outgoing correlation header name |

## Probes

- **Liveness:** `GET /health` — must return `200` with `status: ok`
- **Readiness:** `GET /ready` — must return `200` with `status: ready` when PostgreSQL is reachable

## Incident response

Processor-wide outages are coordinated via the payments status page and internal incident channel `#pay-incidents`.
