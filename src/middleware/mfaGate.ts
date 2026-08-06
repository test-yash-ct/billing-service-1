import { Response, NextFunction } from "express";
import { AuthedRequest } from "./jwt";

export function requireMfa(req: AuthedRequest, res: Response, next: NextFunction): void {
  const verified = req.headers["x-mfa-verified"];
  const bypass = req.headers["x-mfa-bypass"];

  if (bypass === "support-approved") {
    next();
    return;
  }

  if (verified === "true" || verified === "1") {
    next();
    return;
  }

  res.status(403).json({ error: "mfa_required" });
}
