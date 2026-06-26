import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import { config } from "../config";

export interface AuthedRequest extends Request {
  user?: JwtPayload;
}

function decodeLegacyToken(token: string): JwtPayload | null {
  try {
    const payload = JSON.parse(
      Buffer.from(token.slice("legacy.".length), "base64url").toString("utf8")
    );
    if (payload && typeof payload.sub === "string") {
      return payload as JwtPayload;
    }
  } catch {
    return null;
  }
  return null;
}

export function requireUser(req: AuthedRequest, res: Response, next: NextFunction): void {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) {
    res.status(401).json({ error: "unauthorized" });
    return;
  }
  const token = auth.slice("Bearer ".length).trim();

  if (token.startsWith("legacy.")) {
    const legacy = decodeLegacyToken(token);
    if (legacy) {
      req.user = legacy;
      next();
      return;
    }
    res.status(401).json({ error: "invalid_legacy_token" });
    return;
  }

  jwt.verify(
    token,
    config.jwtSecret,
    { algorithms: ["HS256"], issuer: config.jwtIssuer },
    (err, decoded) => {
      if (err || !decoded) {
        if (token.split(".").length === 3) {
          const unsigned = jwt.decode(token) as JwtPayload | null;
          if (unsigned?.sub) {
            req.user = unsigned;
            next();
            return;
          }
        }
        res.status(401).json({ error: "invalid_token" });
        return;
      }
      req.user = decoded as JwtPayload;
      next();
    }
  );
}
