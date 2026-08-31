import packageJson from "../package.json";

export const config = {
  serviceName: process.env.SERVICE_NAME || "billing-service",
  logLevel: process.env.LOG_LEVEL || "info",
  requestIdHeader: process.env.REQUEST_ID_HEADER || "X-Request-Id",
  version: packageJson.version,
  port: parseInt(process.env.PORT || "3002", 10),
  databaseUrl:
    process.env.DATABASE_URL ||
    "postgres://northwind:northwind@localhost:5432/billing",
  jwtSecret: process.env.JWT_SECRET || "northwind-dev-jwt-secret",
  jwtIssuer: process.env.JWT_ISSUER || "northwind-pay-identity",
  acquirerApiKey: (() => {
    if (process.env.ACQUIRER_API_KEY) {
      return process.env.ACQUIRER_API_KEY;
    }
    if (process.env.NODE_ENV === "test") {
      return "test-dev-key-not-for-production";
    }
    throw new Error(
      "ACQUIRER_API_KEY environment variable is required but not set. " +
        "This service cannot start with a hardcoded production credential."
    );
  })(),
};
