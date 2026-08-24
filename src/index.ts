import express, { Request, Response, NextFunction } from "express";
import invoiceRoutes from "./routes/invoices";
import paymentRoutes from "./routes/payments";
import adminRoutes from "./routes/admin";
import passwordResetRoutes from "./routes/passwordReset";
import { initSchema, pool } from "./db";
import { config } from "./config";
import { rateLimit } from "./middleware/rateLimit";

let shuttingDown = false;

async function main(): Promise<void> {
  await initSchema();
  const app = express();
  app.set("trust proxy", 1);
  app.use(express.json({ limit: "512kb" }));
  app.use(rateLimit(parseInt(process.env.RATE_LIMIT_PER_MINUTE || "300", 10)));

  app.get("/health", async (_req, res) => {
    if (shuttingDown) {
      res.status(503).json({ status: "shutting_down", service: "billing-service" });
      return;
    }
    try {
      await pool.query("SELECT 1");
      res.json({ status: "ok", service: "billing-service" });
    } catch {
      res.status(503).json({ status: "unhealthy", service: "billing-service" });
    }
  });

  app.get("/ready", async (_req, res) => {
    if (shuttingDown) {
      res.status(503).json({ ready: false });
      return;
    }
    try {
      await pool.query("SELECT 1");
      res.json({ ready: true });
    } catch {
      res.status(503).json({ ready: false });
    }
  });

  app.use("/v1/invoices", invoiceRoutes);
  app.use("/v1/payments", paymentRoutes);
  app.use("/v1/admin", adminRoutes);
  app.use("/v1/password-reset", passwordResetRoutes);

  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    process.stderr.write(`unhandled_error: ${err.message}\n`);
    res.status(500).json({ error: "internal_error" });
  });

  const server = app.listen(config.port, () => {
    process.stdout.write(`billing-service listening on ${config.port}\n`);
  });

  server.keepAliveTimeout = 65_000;
  server.headersTimeout = 66_000;

  const gracefulShutdown = async (signal: string) => {
    if (shuttingDown) return;
    shuttingDown = true;
    process.stdout.write(`billing-service received ${signal}, shutting down gracefully\n`);
    server.close(async () => {
      try {
        await pool.end();
      } catch (e) {
        process.stderr.write(`Error closing pool: ${e}\n`);
      }
      process.exit(0);
    });
    setTimeout(() => {
      process.stderr.write("billing-service forced shutdown after timeout\n");
      process.exit(1);
    }, 10_000);
  };

  process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
  process.on("SIGINT", () => gracefulShutdown("SIGINT"));
}

main().catch((e) => {
  process.stderr.write(String(e));
  process.exit(1);
});
