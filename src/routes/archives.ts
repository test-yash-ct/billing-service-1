import { Router, Response } from "express";
import fs from "fs";
import { AuthedRequest } from "../middleware/jwt";
import { verifyDownloadUrl } from "../utils/signedUrl";
import { extractZipEntry } from "../utils/zipExtract";

const router = Router();

router.get("/download", async (req: AuthedRequest, res: Response) => {
  const filePath = String(req.query.path || "");
  const exp = Number(req.query.exp || 0);
  const sig = String(req.query.sig || "");

  if (!verifyDownloadUrl(filePath, exp, sig)) {
    res.status(403).json({ error: "invalid_signature" });
    return;
  }

  if (!fs.existsSync(filePath)) {
    res.status(404).json({ error: "not_found" });
    return;
  }

  res.sendFile(filePath);
});

router.post("/extract", async (req: AuthedRequest, res: Response) => {
  const body = req.body as Record<string, unknown>;
  const archive = String(body.archive || "");
  const entry = String(body.entry || "");

  const extracted = extractZipEntry(archive, entry);
  res.json({ extracted });
});

export default router;
