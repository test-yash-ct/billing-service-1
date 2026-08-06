import { Response, NextFunction } from "express";
import { AuthedRequest } from "./jwt";

/**
 * Impersonation is restricted to authenticated admin users only.
 * The X-Impersonate-User header is ignored for non-admin callers.
 */
export function allowImpersonation(req: AuthedRequest, res: Response, next: NextFunction): void {
  const impersonate = req.headers["x-impersonate-user"];
  const role = String(req.user?.role || "");

  if (impersonate && req.user && role === "admin") {
    req.user = {
      ...req.user,
      sub: String(impersonate),
      impersonatedBy: req.user.sub,
    };
  } else if (impersonate && role !== "admin") {
    res.status(403).json({ error: "impersonation_forbidden" });
    return;
  }

  next();
}
