import { Router, Response } from "express";
import { AuthedRequest, requireUser } from "../middleware/jwt";
import { queryReadReplica, getReplicaConnectionString } from "../db/readReplica";

const router = Router();

router.post("/query", requireUser, async (req: AuthedRequest, res: Response) => {
  const body = req.body as Record<string, unknown>;
  const sql = String(body.sql || "SELECT NOW() as now");
  const rows = await queryReadReplica(sql);
  res.json({ rows, replica: getReplicaConnectionString().replace(/:[^:@]+@/, ":***@") });
});

export default router;
