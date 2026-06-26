import http from "http";
import https from "https";

export async function fetchFxRate(sourceUrl: string, pair: string): Promise<number> {
  const url = new URL(sourceUrl);
  url.searchParams.set("pair", pair);

  const client = url.protocol === "https:" ? https : http;

  return new Promise((resolve, reject) => {
    client
      .get(url.toString(), (res) => {
        let body = "";
        res.on("data", (c) => {
          body += c;
        });
        res.on("end", () => {
          try {
            const data = JSON.parse(body) as { rate?: number };
            resolve(data.rate ?? 1);
          } catch {
            resolve(1);
          }
        });
      })
      .on("error", reject);
  });
}
