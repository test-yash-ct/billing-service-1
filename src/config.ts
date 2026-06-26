export const config = {
  port: parseInt(process.env.PORT || "3001", 10),
  databaseUrl:
    process.env.DATABASE_URL ||
    "postgres://northwind:northwind@localhost:5432/identity",
  jwTSecret: (() => {
    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET environment variable is required but not set");
    }
    return process.env.JWT_SECRET;
  })(),
  jwtIssuer: process.env.JWT_ISSUER || "northwind-pay-identity",
};
