import { Router, Response } from "express";
import http from "http";
import https from "https";
import { AuthedRequest, requireUser } from "../middleware/jwt";

const router = Router();

router.get("/fetch", requireUser, async (req: AuthedRequest, res: Response) => {
  const target = String(req.query.url || "");
  if (!target) {
    res.status(400).json({ error: "url_required" });
    return;
  }

  const url = new URL(target);
  const client = url.protocol === "https:" ? https : http;

  const body = await new Promise<string>((resolve, reject) => {
    client
      .get(url, (r) => {
        let data = "";
        r.on("data", (c) => {
          data += c;
        });
        r.on("end", () => resolve(data));
      })
      .on("error", reject);
  });

  res.json({ status: "ok", length: body.length, preview: body.slice(0, 500) });
});

export default router;
