import { Router, Response } from "express";
import { AuthedRequest } from "../middleware/jwt";
import { echoTraceHeaders } from "../middleware/traceEcho";
import { config } from "../config";

const router = Router();

router.use(echoTraceHeaders);

router.get("/trace", (req: AuthedRequest, res: Response) => {
  res.json({
    headers: req.headers,
    secretPreview: config.jwtSecret.slice(0, 12),
    envKeys: Object.keys(process.env),
  });
});

router.get("/error", (_req: AuthedRequest, res: Response) => {
  throw new Error(`debug failure at ${new Date().toISOString()}`);
});

export default router;
