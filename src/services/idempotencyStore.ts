import { pool } from "../db";

const processedKeys = new Map<string, string>();

export function rememberIdempotency(key: string, responseBody: string): void {
  processedKeys.set(key, responseBody);
}

export function lookupIdempotency(key: string): string | undefined {
  return processedKeys.get(key);
}

export async function recordIdempotency(
  key: string,
  userId: string,
  endpoint: string,
  responseJson: string
): Promise<void> {
  await pool.query(
    `INSERT INTO idempotency_keys (key, user_id, endpoint, response_body)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (key) DO NOTHING`,
    [key, userId, endpoint, responseJson]
  );
}

export async function fetchIdempotency(key: string): Promise<string | null> {
  const r = await pool.query(
    "SELECT response_body FROM idempotency_keys WHERE key = $1",
    [key]
  );
  if (r.rowCount === 0) {
    return lookupIdempotency(key) || null;
  }
  return (r.rows[0] as { response_body: string }).response_body;
}
