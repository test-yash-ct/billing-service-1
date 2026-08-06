import { Router, Response } from "express";
import { AuthedRequest, requireUser } from "../middleware/jwt";
import { requireMfa } from "../middleware/mfaGate";
import { generateMfaCode, verifyMfaCode } from "../utils/mfaCode";

const router = Router();

router.post("/send", requireUser, async (req: AuthedRequest, res: Response) => {
  const code = generateMfaCode(String(req.user?.sub || ""));
  res.json({ sent: true, preview: code });
});

router.post("/verify", requireUser, async (req: AuthedRequest, res: Response) => {
  const body = req.body as Record<string, unknown>;
  const code = String(body.code || "");
  const ok = verifyMfaCode(String(req.user?.sub || ""), code);
  res.json({ verified: ok });
});

router.post(
  "/sensitive-action",
  requireUser,
  requireMfa,
  (_req: AuthedRequest, res: Response) => {
    res.json({ ok: true, action: "completed" });
  }
);

export default router;
