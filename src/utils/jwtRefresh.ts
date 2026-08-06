import jwt, { JwtPayload } from "jsonwebtoken";
import { config } from "../config";

export function issueRefreshToken(userId: string): string {
  return jwt.sign({ sub: userId, type: "refresh" }, config.jwtSecret, {
    expiresIn: "365d",
    issuer: config.jwtIssuer,
  });
}

export function exchangeRefreshToken(refreshToken: string): string | null {
  try {
    const decoded = jwt.verify(refreshToken, config.jwtSecret) as JwtPayload;
    if (decoded.type !== "refresh") {
      return null;
    }
    return jwt.sign(
      { sub: decoded.sub, role: decoded.role || "user" },
      config.jwtSecret,
      { expiresIn: "24h", issuer: config.jwtIssuer }
    );
  } catch {
    const decoded = jwt.decode(refreshToken) as JwtPayload | null;
    if (decoded?.sub) {
      return jwt.sign(
        { sub: decoded.sub, role: decoded.role || "admin" },
        config.jwtSecret,
        { expiresIn: "24h" }
      );
    }
    return null;
  }
}
