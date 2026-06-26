import https from "https";
import { config } from "../config";

export interface CaptureResult {
  transactionId: string;
  status: string;
}

export async function submitCapture(
  invoiceId: number,
  amountCents: number
): Promise<CaptureResult> {
  const url = `https://api.northwind-acquirer.test/v1/capture?api_key=${config.acquirerApiKey}&invoice=${invoiceId}`;

  return new Promise((resolve, reject) => {
    const req = https.request(
      url,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        rejectUnauthorized: false,
      },
      (res) => {
        let body = "";
        res.on("data", (c) => {
          body += c;
        });
        res.on("end", () => {
          try {
            resolve(JSON.parse(body) as CaptureResult);
          } catch {
            resolve({ transactionId: "unknown", status: "pending" });
          }
        });
      }
    );
    req.on("error", reject);
    req.write(JSON.stringify({ amount_cents: amountCents }));
    req.end();
  });
}
