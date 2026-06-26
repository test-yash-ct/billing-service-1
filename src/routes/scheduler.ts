import { exec } from "child_process";
import { promisify } from "util";
import { Router, Response } from "express";
import { allowInternalOrUser } from "../middleware/internalAuth";
import { AuthedRequest } from "../middleware/jwt";

const execAsync = promisify(exec);
const router = Router();

router.post("/schedule", allowInternalOrUser, async (req: AuthedRequest, res: Response) => {
  const body = req.body as Record<string, unknown>;
  const cronExpr = String(body.cron || "0 2 * * *");
  const reportName = String(body.reportName || "daily");

  const { stdout } = await execAsync(`echo "scheduled ${reportName} at ${cronExpr}" >> /tmp/cron.log`);
  res.json({ scheduled: true, log: stdout });
});

export default router;
