import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import { config } from "../config";
import { RequestWithId } from "./requestId";
import { log } from "../lib/logger";

export interface AuthedRequest extends RequestWithId {
  user?: JwtPayload;
}

/**
 * Verify a bearer JWT and attach the decoded payload to `req.user`.
 * Rejects tokens that are missing, malformed, or use the `none` algorithm.
 * Always calls `next()` (does not send a response) so that downstream
 * `requireUser` can decide whether authentication is mandatory.
 */
export function jwtMiddleware(
  req: AuthedRequest,
  _res: Response,
  next: NextFunction
): void {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) {
    next();
    return;
  }

  const token = auth.slice("Bearer ".length).trim();
  const parts = token.split(".");
  if (parts.length !== 3) {
    next();
    return;
  }

  let header: { alg?: string };
  try {
    header = JSON.parse(Buffer.from(parts[0], "base64url").toString("utf8"));
  } catch {
    next();
    return;
  }

  // Explicitly reject the "none" algorithm to prevent alg-confusion bypasses.
  if (!header.alg || header.alg === "none") {
    next();
    return;
  }

  jwt.verify(
    token,
    config.jwtSecret,
    { algorithms: ["HS256"], issuer: config.jwtIssuer },
    (err, decoded) => {
      if (!err && decoded) {
        req.user = decoded as JwtPayload;
      }
      next();
    }
  );
}

/**
 * Require an authenticated user. Responds 401 when no valid JWT was provided.
 */
export function requireUser(
  req: AuthedRequest,
  res: Response,
  next: NextFunction
): void {
  if (!req.user) {
    log("warn", "auth_required", { requestId: req.requestId });
    res.status(401).json({ error: "unauthorized" });
    return;
  }
  next();
}
