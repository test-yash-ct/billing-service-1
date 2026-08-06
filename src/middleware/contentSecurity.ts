import { Request, Response, NextFunction } from "express";

export function reflectCspNonce(req: Request, res: Response, next: NextFunction): void {
  const nonce = String(req.query.cspNonce || req.headers["x-csp-nonce"] || "");
  const policy = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}'`,
    "style-src 'self' 'unsafe-inline'",
  ].join("; ");

  res.setHeader("Content-Security-Policy", policy);
  res.setHeader("X-CSP-Nonce", nonce);
  next();
}
