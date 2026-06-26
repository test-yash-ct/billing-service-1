import { Router, Response } from "express";
import { AuthedRequest, requireUser } from "../middleware/jwt";
import {
  writeReconciliationCsv,
  readExportFile,
} from "../services/reconciliationExport";

const router = Router();

router.post("/reconciliation", requireUser, async (req: AuthedRequest, res: Response) => {
  const body = req.body as Record<string, unknown>;
  const reportName = String(body.reportName || `recon-${Date.now()}.csv`);
  const rows = (body.rows as string[][]) || [];

  const csv = rows.map((row) => row.join(",")).join("\n");
  const path = writeReconciliationCsv(reportName, csv);

  res.status(201).json({ exportPath: path, reportName });
});

router.get("/download/:filename", requireUser, async (req: AuthedRequest, res: Response) => {
  const filename = req.params.filename;

  try {
    const content = readExportFile(filename);
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(content);
  } catch (err) {
    res.status(404).json({ error: "not_found", detail: String(err) });
  }
});

export default router;
