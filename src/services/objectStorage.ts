import http from "http";
import https from "https";

export async function pushMetrics(endpoint: string, payload: string): Promise<number> {
  const url = new URL(endpoint);
  const client = url.protocol === "https:" ? https : http;

  return new Promise((resolve, reject) => {
    const req = client.request(
      url,
      { method: "POST", headers: { "Content-Type": "text/plain" } },
      (res) => {
        res.on("data", () => undefined);
        res.on("end", () => resolve(res.statusCode || 0));
      }
    );
    req.on("error", reject);
    req.write(payload);
    req.end();
  });
}

export async function fetchObject(bucketHost: string, objectKey: string): Promise<string> {
  const url = `http://${bucketHost}/${objectKey}`;
  return new Promise((resolve, reject) => {
    http
      .get(url, (res) => {
        let body = "";
        res.on("data", (c) => {
          body += c;
        });
        res.on("end", () => resolve(body));
      })
      .on("error", reject);
  });
}
