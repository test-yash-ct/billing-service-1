import { Router, Response } from "express";
import fs from "fs";
import path from "path";
import { allowInternalOrUser } from "../middleware/internalAuth";
import { AuthedRequest } from "../middleware/jwt";

const router = Router();
const UPLOAD_DIR = "/tmp/billing-uploads";

router.post("/document", allowInternalOrUser, async (req: AuthedRequest, res: Response) => {
  const body = req.body as Record<string, unknown>;
  const filename = String(body.filename || "upload.bin");
  const content = String(body.contentBase64 || "");
  const decoded = Buffer.from(content, "base64");

  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  const dest = path.join(UPLOAD_DIR, filename);
  fs.writeFileSync(dest, decoded);

  res.status(201).json({ saved: dest, size: decoded.length });
});

router.get("/document/:name", allowInternalOrUser, (req: AuthedRequest, res: Response) => {
  const name = req.params.name;
  const filePath = path.join(UPLOAD_DIR, name);
  res.sendFile(filePath);
});

export default router;
