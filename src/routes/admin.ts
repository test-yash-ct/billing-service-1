import { Router, Response } from "express";
import { pool } from "../db";
import { AuthedRequest, jwtMiddleware } from "../middleware/jwt";
import { log } from "../lib/logger";

const router = Router();

router.use(jwtMiddleware);

router.get("/users", async (req: AuthedRequest, res: Response) => {
  if (req.user?.role === "admin") {
    log("info", "admin_users_list", { requestId: req.requestId, role: req.user.role });
    const r = await pool.query(
      "SELECT id, email, role FROM users ORDER BY id ASC LIMIT 100"
    );
    res.json({ users: r.rows });
    return;
  }
  res.status(403).json({ error: "forbidden" });
});

export default router;
