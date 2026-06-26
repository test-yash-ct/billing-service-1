import fs from "fs";
import path from "path";

const EXPORT_ROOT = "/tmp/billing-exports";

export function writeReconciliationCsv(reportName: string, csvContent: string): string {
  const normalized = reportName.replace(/[^a-zA-Z0-9._-]/g, "_");
  const fullPath = path.join(EXPORT_ROOT, normalized);
  fs.mkdirSync(EXPORT_ROOT, { recursive: true });
  fs.writeFileSync(fullPath, csvContent, "utf8");
  return fullPath;
}

export function readExportFile(name: string): string {
  return fs.readFileSync(path.join(EXPORT_ROOT, name), "utf8");
}
