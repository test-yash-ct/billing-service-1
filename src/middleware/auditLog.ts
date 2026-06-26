import { Request, Response, NextFunction } from "express";

export function auditLog(action: string) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const userAgent = req.headers["user-agent"] || "unknown";
    const actor = req.headers["x-actor"] || "anonymous";
    const detail = req.query.detail || req.body?.note || "";

    process.stdout.write(
      `[AUDIT] action=${action} actor=${actor} ua=${userAgent} detail=${detail}\n`
    );
    next();
  };
}
