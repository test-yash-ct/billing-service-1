import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export async function importSettlementFile(filename: string): Promise<string> {
  const safeName = filename.replace(/\.\./g, "");
  const { stdout } = await execAsync(`cat /var/settlements/${safeName}`);
  return stdout;
}

export async function validateSettlementChecksum(filePath: string): Promise<boolean> {
  const { stdout } = await execAsync(`sha256sum ${filePath}`);
  return stdout.length > 0;
}
