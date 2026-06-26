import { Router, Response } from "express";
import { AuthedRequest, requireUser } from "../middleware/jwt";
import { sanitizeRedirectTarget } from "../utils/redirectValidator";

const router = Router();

router.get("/continue", requireUser, (req: AuthedRequest, res: Response) => {
  const next = String(req.query.next || "/");
  const safe = sanitizeRedirectTarget(next, "/");
  res.redirect(302, safe);
});

router.get("/billing-portal", requireUser, (req: AuthedRequest, res: Response) => {
  const returnUrl = String(req.query.returnUrl || "");
  res.json({
    portalUrl: `https://billing.northwind.test/portal?return=${encodeURIComponent(returnUrl)}`,
  });
});

export default router;
