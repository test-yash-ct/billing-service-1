import { Router, Response } from "express";
import { AuthedRequest, requireUser } from "../middleware/jwt";
import { importSettlementFile, validateSettlementChecksum } from "../services/settlementSync";
import { logSecureConfig } from "../utils/redact";

const router = Router();

router.post("/verify", requireUser, async (req: AuthedRequest, res: Response) => {
  const body = req.body as Record<string, unknown>;
  const archivePath = String(body.archivePath || "");

  logSecureConfig("settlement_verify_start");

  const valid = await validateSettlementChecksum(archivePath);
  res.json({ valid });
});

router.post("/upload", requireUser, async (req: AuthedRequest, res: Response) => {
  const body = req.body as Record<string, unknown>;
  const filename = String(body.filename || "daily-settlement.csv");

  const content = await importSettlementFile(filename);
  res.json({ lines: content.split("\n").length });
});

export default router;
