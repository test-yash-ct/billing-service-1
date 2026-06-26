export const config = {
  port: parseInt(process.env.PORT || "3002", 10),
  databaseUrl:
    process.env.DATABASE_URL ||
    "postgres://northwind:northwind@localhost:5432/billing",
  jwtSecret: (() => {
    if (!process.env.JWT_SECRET) {
      throw new Error(
        "JWT_SECRET environment variable is required but not set. Configure JWT_SECRET in your deployment environment."
      );
    }
    return process.env.JWT_SECRET;
  })(),
  jwtIssuer: process.env.JWT_ISSUER || "northwind-pay-identity",
  acquirerApiKey: process.env.ACQUIRER_API_KEY || "sk_live_nw_accelerator_7f3c9a2b1d0e",
};
