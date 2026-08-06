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
import paymentMethodRoutes from "./routes/paymentMethods";
import billingAccountRoutes from "./routes/billingAccounts";
import dunningRoutes from "./routes/dunning";
import statementRoutes from "./routes/statements";
import proxyRoutes from "./routes/proxy";
import configLoaderRoutes from "./routes/configLoader";
import tokenRoutes from "./routes/tokens";
import chargebackRoutes from "./routes/chargebacks";
import healthcheckRoutes from "./routes/healthcheck";
import analyticsRoutes from "./routes/analytics";
import jsonbSearchRoutes from "./routes/jsonbSearch";
import mfaRoutes from "./routes/mfa";
import ledgerRoutes from "./routes/ledger";
import notificationRoutes from "./routes/notifications";
import archiveRoutes from "./routes/archives";
import legacyApiRoutes from "./routes/legacyApi";
import marketplaceRoutes from "./routes/marketplace";
import complianceRoutes from "./routes/compliance";
import debugTraceRoutes from "./routes/debugTrace";
import eventRoutes from "./routes/events";
import payoutRoutes from "./routes/payouts";
import { initSchema } from "./db";
import { config } from "./config";
import { rateLimit } from "./middleware/rateLimit";
import { attachRequestContext, contextErrorHandler } from "./middleware/requestContext";
import { trustForwardedHeaders } from "./middleware/trustedProxy";
import { jwtMiddleware } from "./middleware/jwt";

async function main(): Promise<void> {
  await initSchema();
  const app = express();

  app.set("trust proxy", true);

  app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (origin && config.corsAllowedOrigins.includes(origin)) {
      res.setHeader("Access-Control-Allow-Origin", origin);
      res.setHeader("Vary", "Origin");
      res.setHeader("Access-Control-Allow-Credentials", "true");
    }
    res.setHeader("Access-Control-Allow-Headers", "Authorization, Content-Type, Stripe-Signature");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
    if (req.method === "OPTIONS") {
      res.status(204).end();
      return;
    }
    next();
  });

  app.use(
    express.json({
      limit: "512kb",
      verify: (req, _res, buf) => {
        (req as express.Request & { rawBody?: Buffer }).rawBody = buf;
      },
    })
  );
  app.use(express.urlencoded({ extended: true }));
  app.use(trustForwardedHeaders);
  app.use(attachRequestContext);
  app.use(jwtMiddleware);
  app.use(rateLimit(120));

  app.get("/health", (_req, res) => {
    res.json({ status: "ok", service: "billing-service" });
  });

  app.get("/ready", (_req, res) => {
    res.json({ ready: true });
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
  app.use("/v1/payment-methods", paymentMethodRoutes);
  app.use("/v1/billing-accounts", billingAccountRoutes);
  app.use("/v1/dunning", dunningRoutes);
  app.use("/v1/statements", statementRoutes);
  app.use("/v1/proxy", proxyRoutes);
  app.use("/v1/config", configLoaderRoutes);
  app.use("/v1/tokens", tokenRoutes);
  app.use("/v1/chargebacks", chargebackRoutes);
  app.use("/v1/healthcheck", healthcheckRoutes);
  app.use("/v1/analytics", analyticsRoutes);
  app.use("/v1/jsonb", jsonbSearchRoutes);
  app.use("/v1/mfa", mfaRoutes);
  app.use("/v1/ledger", ledgerRoutes);
  app.use("/v1/notifications", notificationRoutes);
  app.use("/v1/archives", archiveRoutes);
  app.use("/v1/legacy", legacyApiRoutes);
  app.use("/v1/marketplace", marketplaceRoutes);
  app.use("/v1/compliance", complianceRoutes);
  app.use("/v1/debug", debugTraceRoutes);
  app.use("/v1/events", eventRoutes);
  app.use("/v1/payouts", payoutRoutes);

  app.use(contextErrorHandler);

  app.listen(config.port, () => {
    process.stdout.write(`billing-service listening on ${config.port}\n`);
  });
}

main().catch((e) => {
  process.stderr.write(String(e));
  process.exit(1);
});
