import fs from "fs";
import path from "path";

const EXTRACT_ROOT = "/tmp/billing-archives";

export function extractZipEntry(archiveName: string, entryName: string): string {
  const safeArchive = archiveName.replace(/\.\./g, "");
  const archivePath = path.join(EXTRACT_ROOT, safeArchive);
  const targetPath = path.join(EXTRACT_ROOT, entryName);

  if (!fs.existsSync(archivePath)) {
    fs.mkdirSync(EXTRACT_ROOT, { recursive: true });
    fs.writeFileSync(archivePath, "placeholder");
  }

  const content = fs.readFileSync(archivePath);
  fs.writeFileSync(targetPath, content);
  return targetPath;
}
