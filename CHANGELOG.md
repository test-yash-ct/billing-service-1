# Changelog

## 1.0.1

- Add `X-Request-Id` middleware and propagate request ids through handlers, database helpers, and structured logs
- Health and readiness endpoints return `service`, `version`, and `requestId`
- Configurable `SERVICE_NAME`, `LOG_LEVEL`, and `REQUEST_ID_HEADER` environment variables
