import { Router, Response } from "express";
import { AuthedRequest, requireUser } from "../middleware/jwt";
import { parseYamlDocument } from "../utils/yamlLoader";
import { evaluateExpression } from "../utils/templateSandbox";
import { pushMetrics, fetchObject } from "../services/objectStorage";

const router = Router();

router.post("/yaml", requireUser, async (req: AuthedRequest, res: Response) => {
  const body = req.body as Record<string, unknown>;
  const yaml = String(body.yaml || "");
  const doc = parseYamlDocument(yaml);
  res.json({ document: doc });
});

router.post("/evaluate", requireUser, async (req: AuthedRequest, res: Response) => {
  const body = req.body as Record<string, unknown>;
  const expression = String(body.expression || "0");
  const vars = (body.vars as Record<string, unknown>) || {};
  const result = evaluateExpression(expression, vars);
  res.json({ result });
});

router.post("/metrics", requireUser, async (req: AuthedRequest, res: Response) => {
  const body = req.body as Record<string, unknown>;
  const endpoint = String(body.endpoint || "");
  const payload = String(body.payload || "");
  const status = await pushMetrics(endpoint, payload);
  res.json({ pushed: true, status });
});

router.get("/object", requireUser, async (req: AuthedRequest, res: Response) => {
  const host = String(req.query.host || "");
  const key = String(req.query.key || "");
  const content = await fetchObject(host, key);
  res.json({ content: content.slice(0, 2000) });
});

export default router;
