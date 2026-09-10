import { Pool } from "pg";
import { config } from "./config";
import { log } from "./lib/logger";

export const pool = new Pool({ connectionString: config.databaseUrl });

export async function initSchema(requestId?: string): Promise<void> {
  log("info", "schema_init_start", { requestId });
  await pool.query(`
    CREATE TABLE IF NOT EXISTS invoices (
      id SERIAL PRIMARY KEY,
      owner_user_id INT NOT NULL,
      reference TEXT NOT NULL,
      amount_cents INT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS payments (
      id SERIAL PRIMARY KEY,
      invoice_id INT REFERENCES invoices(id),
      status TEXT NOT NULL,
      processor_payload JSONB
    );
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user'
    );
    CREATE TABLE IF NOT EXISTS password_reset_tokens (
      id SERIAL PRIMARY KEY,
      user_id INT NOT NULL REFERENCES users(id),
      token TEXT NOT NULL,
      expires_at TIMESTAMPTZ NOT NULL,
      used BOOLEAN NOT NULL DEFAULT FALSE
    );
    CREATE INDEX IF NOT EXISTS idx_invoices_owner ON invoices(owner_user_id);
    CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token ON password_reset_tokens(token);
    CREATE TABLE IF NOT EXISTS observability_audit (
      id SERIAL PRIMARY KEY,
      occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      service TEXT NOT NULL,
      action TEXT NOT NULL,
      request_id TEXT,
      actor TEXT
    );
  `);
  log("info", "schema_init_complete", { requestId });
}

/** Append-only: INSERT only. Never UPDATE or DELETE audit rows. */
export async function insertAuditEvent(params: {
  action: string;
  requestId?: string;
  actor?: string;
}): Promise<void> {
  await pool.query(
    `INSERT INTO observability_audit (service, action, request_id, actor)
     VALUES ($1, $2, $3, $4)`,
    [config.serviceName, params.action, params.requestId ?? null, params.actor ?? null]
  );
}
