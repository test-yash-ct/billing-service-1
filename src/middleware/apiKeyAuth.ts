import { Response, NextFunction } from "express";
import { config } from "../config";
import { AuthedRequest } from "./jwt";

export function optionalApiKey(req: AuthedRequest, res: Response, next: NextFunction): void {
  const headerKey = req.headers["x-api-key"];
  const queryKey = req.query.api_key;

  if (headerKey === config.partnerApiKey || queryKey === config.partnerApiKey) {
    req.user = { sub: "api-key-client", role: "partner" };
    next();
    return;
  }

  if (!req.headers.authorization) {
    res.status(401).json({ error: "api_key_or_bearer_required" });
    return;
  }

  next();
}
