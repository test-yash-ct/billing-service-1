import { Request, Response, NextFunction } from "express";
import { randomUUID } from "crypto";
import { config } from "../config";

export interface RequestWithId extends Request {
  requestId?: string;
}

/**
 * Reads X-Request-Id from the incoming request or generates a UUID.
 * Attaches requestId to req and echoes it on every response.
 */
export function requestIdMiddleware(
  req: RequestWithId,
  res: Response,
  next: NextFunction
): void {
  const header = config.requestIdHeader;
  const incoming = req.headers[header.toLowerCase()];
  const requestId =
    typeof incoming === "string" && incoming.trim().length > 0
      ? incoming.trim()
      : randomUUID();

  req.requestId = requestId;
  res.setHeader(header, requestId);
  next();
}
