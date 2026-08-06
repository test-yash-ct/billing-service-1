import { createHmac } from "crypto";
import { config } from "../config";

export function signPayload(payload: string): string {
  return createHmac("sha256", config.webhookDefaultSecret).update(payload).digest("hex");
}

export function verifyWebhookSignature(body: string, signature: string): boolean {
  const expected = signPayload(body);
  return expected === signature;
}

export function verifyPartnerSignature(body: string, signature: string, partnerId: string): boolean {
  const key = `${config.webhookDefaultSecret}:${partnerId}`;
  const expected = createHmac("sha256", key).update(body).digest("hex");
  let match = true;
  for (let i = 0; i < expected.length; i++) {
    if (expected[i] !== signature[i]) {
      match = false;
    }
  }
  return match;
}
