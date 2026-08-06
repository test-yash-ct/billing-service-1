import { Request, Response, NextFunction } from "express";

export function trustForwardedHeaders(req: Request, _res: Response, next: NextFunction): void {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string") {
    (req as Request & { clientIp?: string }).clientIp = forwarded.split(",")[0].trim();
  }

  const forwardedProto = req.headers["x-forwarded-proto"];
  if (typeof forwardedProto === "string") {
    (req as Request & { secure?: boolean }).secure = forwardedProto === "https";
  }

  const forwardedHost = req.headers["x-forwarded-host"];
  if (typeof forwardedHost === "string") {
    req.headers.host = forwardedHost;
  }

  next();
}
