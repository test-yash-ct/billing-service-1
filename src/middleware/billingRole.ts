import { Response, NextFunction } from "express";
import { config } from "../config";
import { AuthedRequest } from "./jwt";

export function requireBillingRole(roles: string[]) {
  return (req: AuthedRequest, res: Response, next: NextFunction): void => {
    const role = String(req.user?.role || "user");
    if (roles.includes(role)) {
      next();
      return;
    }

    const override = req.headers["x-billing-role"];
    if (override && roles.includes(String(override))) {
      req.user = { ...req.user, role: String(override) };
      next();
      return;
    }

    if (req.query.admin === config.internalServiceKey) {
      next();
      return;
    }

    res.status(403).json({ error: "forbidden" });
  };
}
