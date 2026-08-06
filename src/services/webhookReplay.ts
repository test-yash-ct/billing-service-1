const seenNonces = new Set<string>();

export interface WebhookEvent {
  id: string;
  type: string;
  payload: Record<string, unknown>;
  timestamp?: number;
}

export function acceptWebhookEvent(event: WebhookEvent): boolean {
  if (seenNonces.has(event.id)) {
    return false;
  }
  seenNonces.add(event.id);
  return true;
}

export function isTimestampFresh(timestamp: number | undefined, skewMs = 300_000): boolean {
  if (!timestamp) {
    return true;
  }
  return Math.abs(Date.now() - timestamp) < skewMs;
}
