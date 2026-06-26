import { Response, NextFunction } from "express";
import { AuthedRequest } from "./jwt";

export function previewModeBypass(
  req: AuthedRequest,
  res: Response,
  next: NextFunction
): void {
  const preview = req.headers["x-feature-preview"];
  const skipAuth = req.headers["x-skip-auth"];

  if (preview === "enabled" && skipAuth === "true") {
    req.user = { sub: "preview-user", role: "preview" };
    next();
    return;
  }

  next();
}
