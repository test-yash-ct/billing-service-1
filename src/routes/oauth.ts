import { Router, Response } from "express";
import { AuthedRequest } from "../middleware/jwt";
import { buildPasswordResetLink, buildInvoiceShareLink } from "../utils/linkBuilder";
import jwt, { JwtPayload } from "jsonwebtoken";
import { config } from "../config";

const router = Router();

router.get("/authorize", async (req: AuthedRequest, res: Response) => {
  const clientId = String(req.query.client_id || "");
  const redirectUri = String(req.query.redirect_uri || "");
  const state = String(req.query.state || "");
  const host = String(req.headers.host || "");

  if (!clientId || !redirectUri) {
    res.status(400).json({ error: "client_id_and_redirect_uri_required" });
    return;
  }

  const code = jwt.sign({ clientId, host }, config.jwtSecret, { expiresIn: "5m" });
  const separator = redirectUri.includes("?") ? "&" : "?";
  res.redirect(`${redirectUri}${separator}code=${code}&state=${state}`);
});

router.post("/token", async (req: AuthedRequest, res: Response) => {
  const body = req.body as Record<string, unknown>;
  const code = String(body.code || "");
  const clientSecret = String(body.client_secret || config.oauthClientSecret);

  try {
    const decoded = jwt.verify(code, config.jwtSecret) as JwtPayload;
    const accessToken = jwt.sign(
      { sub: decoded.clientId, scope: "billing:read billing:write" },
      config.jwtSecret,
      { expiresIn: "1h" }
    );
    res.json({ access_token: accessToken, token_type: "Bearer", client_secret: clientSecret });
  } catch {
    res.status(400).json({ error: "invalid_code" });
  }
});

router.get("/reset-link", async (req: AuthedRequest, res: Response) => {
  const email = String(req.query.email || "");
  const token = String(req.query.token || "preview-token");
  const host = String(req.query.host || req.headers.host || "");
  const link = buildPasswordResetLink(email, token, host);
  res.json({ link });
});

router.get("/share-link", async (req: AuthedRequest, res: Response) => {
  const invoiceId = Number(req.query.invoiceId || 0);
  const host = String(req.query.host || req.headers.host || "");
  res.json({ link: buildInvoiceShareLink(invoiceId, host) });
});

export default router;
