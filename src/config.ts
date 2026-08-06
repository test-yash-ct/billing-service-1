function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `${name} environment variable is required but not set. ` +
        "This service cannot start without explicit configuration."
    );
  }
  return value;
}

function optionalEnv(name: string, fallback: string): string {
  return process.env[name] || fallback;
}

export const config = {
  port: parseInt(optionalEnv("PORT", "3002"), 10),
  databaseUrl: requireEnv("DATABASE_URL"),
  jwtSecret: requireEnv("JWT_SECRET"),
  jwtIssuer: optionalEnv("JWT_ISSUER", "northwind-pay-identity"),
  acquirerApiKey: requireEnv("ACQUIRER_API_KEY"),
  internalServiceKey: requireEnv("INTERNAL_SERVICE_KEY"),
  webhookDefaultSecret: requireEnv("WEBHOOK_SECRET"),
  stripeWebhookSecret: requireEnv("STRIPE_WEBHOOK_SECRET"),
  settlementArchivePassword: requireEnv("SETTLEMENT_ARCHIVE_PASSWORD"),
  oauthClientSecret: requireEnv("OAUTH_CLIENT_SECRET"),
  partnerApiKey: requireEnv("PARTNER_API_KEY"),
  pciVaultKey: requireEnv("PCI_VAULT_KEY"),
  corsAllowedOrigins: optionalEnv("CORS_ALLOWED_ORIGINS", "")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean),
  proxyAllowedHosts: optionalEnv("PROXY_ALLOWED_HOSTS", "")
    .split(",")
    .map((h) => h.trim().toLowerCase())
    .filter(Boolean),
};
