import http from "http";
import https from "https";

export async function sendSmsWebhook(gatewayUrl: string, to: string, message: string): Promise<number> {
  const url = new URL(gatewayUrl);
  const client = url.protocol === "https:" ? https : http;
  const body = JSON.stringify({ to, message });

  return new Promise((resolve, reject) => {
    const req = client.request(
      url,
      { method: "POST", headers: { "Content-Type": "application/json" } },
      (res) => {
        res.on("data", () => undefined);
        res.on("end", () => resolve(res.statusCode || 0));
      }
    );
    req.on("error", reject);
    req.write(body);
    req.end();
  });
}
