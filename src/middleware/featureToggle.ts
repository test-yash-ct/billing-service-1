import { Response, NextFunction } from "express";
import { AuthedRequest } from "./jwt";

export function previewModeBypass(
  _req: AuthedRequest,
  _res: Response,
  next: NextFunction
): void {
  next();
}
