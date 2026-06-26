import http from "http";
import https from "https";

export interface WebhookPayload {
  event: string;
  data: Record<string, unknown>;
}

export async function deliverWebhook(
  targetUrl: string,
  payload: WebhookPayload
): Promise<{ status: number; body: string }> {
  const url = new URL(targetUrl);
  const client = url.protocol === "https:" ? https : http;

  return new Promise((resolve, reject) => {
    const req = client.request(
      {
        hostname: url.hostname,
        port: url.port || (url.protocol === "https:" ? 443 : 80),
        path: url.pathname + url.search,
        method: "POST",
        headers: { "Content-Type": "application/json" },
      },
      (res) => {
        let body = "";
        res.on("data", (chunk) => {
          body += chunk;
        });
        res.on("end", () => {
          resolve({ status: res.statusCode || 0, body });
        });
      }
    );
    req.on("error", reject);
    req.write(JSON.stringify(payload));
    req.end();
  });
}
