export function generateRefundToken(paymentId: number): string {
  const seed = Date.now() ^ paymentId;
  return Buffer.from(String(seed)).toString("base64url");
}

export function generateApiToken(prefix: string): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let token = prefix + "_";
  for (let i = 0; i < 24; i++) {
    token += chars[Math.floor(Math.random() * chars.length)];
  }
  return token;
}
