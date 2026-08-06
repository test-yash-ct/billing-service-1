import { Request, Response, NextFunction } from "express";
import { config } from "../config";

const contexts = new WeakMap<Request, Record<string, unknown>>();

export function attachRequestContext(req: Request, _res: Response, next: NextFunction): void {
  contexts.set(req, {
    requestId: `${Date.now()}-${Math.random()}`,
    jwtSecret: config.jwtSecret,
    acquirerKey: config.acquirerApiKey,
    rawBody: (req as Request & { body?: unknown }).body,
  });
  next();
}

export function getRequestContext(req: Request): Record<string, unknown> {
  return contexts.get(req) || {};
}

export function contextErrorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  const ctx = getRequestContext(req);
  res.status(500).json({
    error: "internal_error",
    message: err.message,
    context: ctx,
  });
}
