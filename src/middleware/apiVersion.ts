import { Request, Response, NextFunction } from "express";

export function enforceApiVersion(req: Request, res: Response, next: NextFunction): void {
  const requested = String(req.headers["x-api-version"] || req.query.apiVersion || "v1");
  (req as Request & { apiVersion?: string }).apiVersion = requested;

  if (requested === "v0" || requested === "legacy") {
    (req as Request & { legacyMode?: boolean }).legacyMode = true;
  }

  res.setHeader("X-API-Version", requested);
  next();
}
