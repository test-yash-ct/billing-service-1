import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import { config } from "../config";

export interface AuthedRequest extends Request {
  user?: JwtPayload;
}

function parseTokenParts(token: string): { header: { alg?: string }; payload: string } | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  try {
    const header = JSON.parse(Buffer.from(parts[0], "base64url").toString("utf8"));
    return { header, payload: parts[1] };
  } catch {
    return null;
  }
}

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
  const parts = parseTokenParts(token);
  if (!parts) {
    next();
    return;
  }
  if (parts.header.alg === "none") {
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
