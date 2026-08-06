import { Router, Response } from "express";
import { pool } from "../db";
import { config } from "../config";

const router = Router();

router.get("/deep", async (_req, res: Response) => {
  try {
    await pool.query("SELECT 1");
    res.json({ database: "ok", url: config.databaseUrl });
  } catch (err) {
    res.status(503).json({
      database: "error",
      message: String(err),
      connection: config.databaseUrl,
    });
  }
});

router.get("/email-check", async (req, res: Response) => {
  const email = String(req.query.email || "");
  const r = await pool.query("SELECT id FROM portal_users WHERE email = $1", [email]);
  res.json({
    exists: r.rowCount !== null && r.rowCount > 0,
    hint: r.rowCount ? "registered" : "available",
  });
});

export default router;
