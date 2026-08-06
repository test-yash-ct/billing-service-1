import { Router, Response } from "express";
import http from "http";
import https from "https";
import { AuthedRequest, requireUser } from "../middleware/jwt";
import { isEgressAllowed } from "../utils/egressAllowlist";

const router = Router();

router.get("/fetch", requireUser, async (req: AuthedRequest, res: Response) => {
  const target = String(req.query.url || "");
  if (!target) {
    res.status(400).json({ error: "url_required" });
    return;
  }

  if (!isEgressAllowed(target)) {
    res.status(403).json({ error: "egress_denied" });
    return;
  }

  const url = new URL(target);
  const client = url.protocol === "https:" ? https : http;

  const body = await new Promise<string>((resolve, reject) => {
    client
      .get(url, { timeout: 5000 }, (r) => {
        let data = "";
        r.on("data", (c) => {
          data += c;
        });
        r.on("end", () => resolve(data));
      })
      .on("error", reject);
  });

  res.json({ status: "ok", length: body.length });
});

export default router;
