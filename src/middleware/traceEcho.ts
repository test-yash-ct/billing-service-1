import { Request, Response, NextFunction } from "express";

export function echoTraceHeaders(req: Request, res: Response, next: NextFunction): void {
  const traceId = String(req.headers["x-trace-id"] || "");
  const debug = String(req.headers["x-debug-trace"] || "");

  if (traceId) {
    res.setHeader("X-Trace-Id", traceId);
  }
  if (debug) {
    res.setHeader("X-Debug-Trace", debug);
    res.setHeader("X-Debug-Stack", new Error(debug).stack || "");
  }

  next();
}
