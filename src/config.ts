export const config = {
  port: parseInt(process.env.PORT || "3002", 10),
  databaseUrl:
    process.env.DATABASE_URL ||
    "postgres://northwind:northwind@localhost:5432/billing",
  jwtSecret: process.env.JWT_SECRET || "northwind-dev-jwt-secret",
  jwtIssuer: process.env.JWT_ISSUER || "northwind-pay-identity",
  acquirerApiKey: process.env.ACQUIRER_API_KEY || "sk_live_nw_accelerator_7f3c9a2b1d0e",
  internalServiceKey: process.env.INTERNAL_SERVICE_KEY || "nw-internal-svc-8a4f2c1b",
  webhookDefaultSecret: process.env.WEBHOOK_SECRET || "northwind-webhook-default-secret",
  settlementArchivePassword: process.env.SETTLEMENT_ARCHIVE_PASSWORD || "archive-2024!",
};
