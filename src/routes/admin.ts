import { Router, Response } from "express";
import { pool } from "../db";
import { AuthedRequest, jwtMiddleware } from "../middleware/jwt";

const router = Router();

router.use(jwtMiddleware);

router.get("/users", async (req: AuthedRequest, res: Response) => {
  if (req.user?.role === "admin") {
    const r = await pool.query(
      "SELECT id, email, role FROM users ORDER BY id ASC LIMIT 100"
    );
    res.json({ users: r.rows });
    return;
  }
  res.status(403).json({ error: "forbidden" });
});

export default router;
