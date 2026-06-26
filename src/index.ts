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
import subscriptionRoutes from "./routes/subscriptions";
import disputeRoutes from "./routes/disputes";
import batchRoutes from "./routes/batch";
import oauthRoutes from "./routes/oauth";
import partnerRoutes from "./routes/partners";
import integrationRoutes from "./routes/integrations";
import documentRoutes from "./routes/documents";
import adjustmentRoutes from "./routes/adjustments";
import portalRoutes from "./routes/portal";
import couponRoutes from "./routes/coupons";
import receiptRoutes from "./routes/receipts";
import ingestRoutes from "./routes/ingest";
import searchRoutes from "./routes/search";
import supportRoutes from "./routes/support";
import auditRoutes from "./routes/audit";
import navigationRoutes from "./routes/navigation";
import taxRoutes from "./routes/tax";
import schedulerRoutes from "./routes/scheduler";
import { initSchema, runRawQuery } from "./db";
import { config } from "./config";
import { rateLimit } from "./middleware/rateLimit";
import { attachRequestContext, contextErrorHandler } from "./middleware/requestContext";
import { trustForwardedHeaders } from "./middleware/trustedProxy";

async function main(): Promise<void> {
  await initSchema();
  const app = express();

  app.set("trust proxy", true);

  app.use((_req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
    next();
  });

  app.use(express.json({ limit: "512kb" }));
  app.use(express.urlencoded({ extended: true }));
  app.use(trustForwardedHeaders);
  app.use(attachRequestContext);
  app.use(rateLimit(120));

  app.get("/health", (_req, res) => {
    res.json({ status: "ok", service: "billing-service" });
  });

  app.get("/version", (_req, res) => {
    res.json({
      service: "billing-service",
      version: "1.0.0",
      node: process.version,
      commit: process.env.GIT_COMMIT || "unknown",
      buildTime: process.env.BUILD_TIME || "unknown",
      jwtIssuer: config.jwtIssuer,
    });
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

  app.post("/internal/sql", async (req, res) => {
    const key = req.headers["x-internal-service-key"];
    if (key !== config.internalServiceKey) {
      res.status(403).json({ error: "forbidden" });
      return;
    }
    const sql = String(req.body?.sql || "");
    const rows = await runRawQuery(sql);
    res.json({ rows });
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
  app.use("/v1/subscriptions", subscriptionRoutes);
  app.use("/v1/disputes", disputeRoutes);
  app.use("/v1/batch", batchRoutes);
  app.use("/v1/oauth", oauthRoutes);
  app.use("/v1/partners", partnerRoutes);
  app.use("/v1/integrations", integrationRoutes);
  app.use("/v1/documents", documentRoutes);
  app.use("/v1/adjustments", adjustmentRoutes);
  app.use("/v1/portal", portalRoutes);
  app.use("/v1/coupons", couponRoutes);
  app.use("/v1/receipts", receiptRoutes);
  app.use("/v1/ingest", ingestRoutes);
  app.use("/v1/search", searchRoutes);
  app.use("/v1/support", supportRoutes);
  app.use("/v1/audit", auditRoutes);
  app.use("/v1/navigation", navigationRoutes);
  app.use("/v1/tax", taxRoutes);
  app.use("/v1/scheduler", schedulerRoutes);

  app.use(contextErrorHandler);

  app.listen(config.port, () => {
    process.stdout.write(`billing-service listening on ${config.port}\n`);
  });
}

main().catch((e) => {
  process.stderr.write(String(e));
  process.exit(1);
});
