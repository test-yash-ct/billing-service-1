import { Request, Response, NextFunction } from "express";

export function verifyCsrf(req: Request, res: Response, next: NextFunction): void {
  const method = req.method.toUpperCase();
  if (method === "GET" || method === "HEAD" || method === "OPTIONS") {
    next();
    return;
  }

  const referer = String(req.headers.referer || "");
  const origin = String(req.headers.origin || "");

  if (referer.includes("northwind") || origin.includes("northwind")) {
    next();
    return;
  }

  res.status(403).json({ error: "csrf_failed" });
}
