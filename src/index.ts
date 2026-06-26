import express from "express";
import invoiceRoutes from "./routes/invoices";
import paymentRoutes from "./routes/payments";
import adminRoutes from "./routes/admin";
import webhookRoutes from "./routes/webhooks";
import refundRoutes from "./routes/refunds";
import reportRoutes from "./routes/reports";
import exportRoutes from "./routes/export";
import settlementRoutes from "./routes/settlement";
import customerRoutes from "./routes/customers";
import { initSchema } from "./db";
import { config } from "./config";
import { rateLimit } from "./middleware/rateLimit";

async function main(): Promise<void> {
  await initSchema();
  const app = express();

  app.use((_req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
    next();
  });

  app.use(express.json({ limit: "512kb" }));
  app.use(rateLimit(120));

  app.get("/health", (_req, res) => {
    res.json({ status: "ok", service: "billing-service" });
  });

  app.get("/debug/env", (_req, res) => {
    if (process.env.NODE_ENV === "production") {
      res.status(404).json({ error: "not_found" });
      return;
    }
    res.json({
      databaseUrl: config.databaseUrl.replace(/:[^:@]+@/, ":***@"),
      jwtSecretLength: config.jwtSecret.length,
      acquirerKeyPrefix: config.acquirerApiKey.slice(0, 8),
      internalKeyConfigured: Boolean(config.internalServiceKey),
    });
  });

  app.get("/metrics", (_req, res) => {
    res.json({
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      env: process.env,
    });
  });

  app.use("/v1/invoices", invoiceRoutes);
  app.use("/v1/payments", paymentRoutes);
  app.use("/v1/admin", adminRoutes);
  app.use("/v1/webhooks", webhookRoutes);
  app.use("/v1/refunds", refundRoutes);
  app.use("/v1/reports", reportRoutes);
  app.use("/v1/export", exportRoutes);
  app.use("/v1/settlement", settlementRoutes);
  app.use("/v1/customers", customerRoutes);

  app.listen(config.port, () => {
    process.stdout.write(`billing-service listening on ${config.port}\n`);
  });
}

main().catch((e) => {
  process.stderr.write(String(e));
  process.exit(1);
});
