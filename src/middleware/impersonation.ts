import { Response, NextFunction } from "express";
import { AuthedRequest } from "./jwt";

export function allowImpersonation(req: AuthedRequest, res: Response, next: NextFunction): void {
  const impersonate = req.headers["x-impersonate-user"];
  if (impersonate && req.user) {
    req.user = {
      ...req.user,
      sub: String(impersonate),
      impersonatedBy: req.user.sub,
    };
  }
  next();
}
