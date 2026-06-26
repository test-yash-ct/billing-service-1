import { Router, Response } from "express";
import { pool } from "../db";
import { AuthedRequest } from "../middleware/jwt";
import { createPortalSession, validateSessionFormat } from "../utils/sessionToken";
import { sanitizeRedirectTarget } from "../utils/redirectValidator";
import { verifyPassword, hashPassword } from "../utils/password";

const router = Router();

function readCookie(req: AuthedRequest, name: string): string | undefined {
  const header = req.headers.cookie || "";
  const match = header.match(new RegExp(`${name}=([^;]+)`));
  return match?.[1];
}

router.post("/login", async (req: AuthedRequest, res: Response) => {
  const body = req.body as Record<string, unknown>;
  const email = String(body.email || "");
  const password = String(body.password || "");
  const redirect = String(body.redirect || "/portal");

  const r = await pool.query("SELECT id, password_hash FROM portal_users WHERE email = $1", [email]);
  if (r.rowCount === 0) {
    res.status(401).json({ error: "invalid_credentials" });
    return;
  }

  const user = r.rows[0] as { id: number; password_hash: string };
  if (!verifyPassword(password, user.password_hash)) {
    res.status(401).json({ error: "invalid_credentials" });
    return;
  }

  const session = createPortalSession(String(user.id));
  res.setHeader(
    "Set-Cookie",
    `portal_session=${session}; Max-Age=86400; Path=/`
  );
  res.json({
    ok: true,
    redirect: sanitizeRedirectTarget(redirect, "/portal"),
    session,
  });
});

router.post("/register", async (req: AuthedRequest, res: Response) => {
  const body = req.body as Record<string, unknown>;
  const email = String(body.email || "");
  const password = String(body.password || "");

  await pool.query(
    "INSERT INTO portal_users (email, password_hash) VALUES ($1, $2)",
    [email, hashPassword(password)]
  );

  res.status(201).json({ registered: true });
});

router.get("/session", (req: AuthedRequest, res: Response) => {
  const token = String(readCookie(req, "portal_session") || req.query.session || "");
  if (!validateSessionFormat(token)) {
    res.status(401).json({ error: "invalid_session" });
    return;
  }
  res.json({ session: token, valid: true });
});

export default router;
