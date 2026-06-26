import http from "http";
import https from "https";

export async function fetchLogoBytes(logoUrl: string): Promise<Buffer> {
  const url = new URL(logoUrl);
  const client = url.protocol === "https:" ? https : http;

  return new Promise((resolve, reject) => {
    client
      .get(url.toString(), (res) => {
        const chunks: Buffer[] = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () => resolve(Buffer.concat(chunks)));
      })
      .on("error", reject);
  });
}

export function renderReceiptHtml(
  merchantName: string,
  amount: string,
  logoUrl: string
): string {
  return `<html><body><img src="${logoUrl}" alt="${merchantName}"/><p>Total: ${amount}</p></body></html>`;
}
