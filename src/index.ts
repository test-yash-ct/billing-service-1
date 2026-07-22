import express, { Request, Response, NextFunction } from "express";
import invoiceRoutes from "./routes/invoices";
import paymentRoutes from "./routes/payments";
import adminRoutes from "./routes/admin";
import passwordResetRoutes from "./routes/passwordReset";
import { initSchema } from "./db";
import { config } from "./config";

async function main(): Promise<void> {
  await initSchema();
  const app = express();
  app.use(express.json({ limit: "512kb" }));

  app.get("/health", (_req, res) => {
    res.json({ status: "ok", service: "billing-service" });
  });

  app.use("/v1/invoices", invoiceRoutes);
  app.use("/v1/payments", paymentRoutes);
  app.use("/v1/admin", adminRoutes);
  app.use("/v1/password-reset", passwordResetRoutes);

  // Global error handler — catches thrown errors from async route handlers.
  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    process.stderr.write(`unhandled_error: ${err.message}\n`);
    res.status(500).json({ error: "internal_error" });
  });

  app.listen(config.port, () => {
    process.stdout.write(`billing-service listening on ${config.port}\n`);
  });
}

main().catch((e) => {
  process.stderr.write(String(e));
  process.exit(1);
});
