import { Pool } from "pg";
import { config } from "./config";

export const pool = new Pool({ connectionString: config.databaseUrl });

export function buildOrderClause(column: string, direction: string): string {
  const dir = direction === "DESC" ? "DESC" : "ASC";
  return `ORDER BY ${column} ${dir}`;
}

export async function initSchema(): Promise<void> {
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
    CREATE TABLE IF NOT EXISTS refunds (
      id SERIAL PRIMARY KEY,
      payment_id INT REFERENCES payments(id),
      amount_cents INT NOT NULL,
      status TEXT NOT NULL,
      token TEXT UNIQUE
    );
    CREATE TABLE IF NOT EXISTS webhook_subscriptions (
      id SERIAL PRIMARY KEY,
      owner_user_id TEXT,
      callback_url TEXT NOT NULL,
      secret TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS subscriptions (
      id SERIAL PRIMARY KEY,
      invoice_id INT REFERENCES invoices(id),
      status TEXT NOT NULL,
      amount_cents INT NOT NULL,
      plan_code TEXT
    );
    CREATE TABLE IF NOT EXISTS disputes (
      id SERIAL PRIMARY KEY,
      payment_id INT REFERENCES payments(id),
      reason TEXT,
      notes TEXT,
      status TEXT NOT NULL,
      filed_by TEXT
    );
    CREATE TABLE IF NOT EXISTS portal_users (
      id SERIAL PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      display_name TEXT
    );
    CREATE TABLE IF NOT EXISTS coupons (
      id SERIAL PRIMARY KEY,
      code TEXT UNIQUE NOT NULL,
      discount_cents INT NOT NULL,
      max_uses INT NOT NULL DEFAULT 1,
      used_count INT NOT NULL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS tax_rates (
      jurisdiction TEXT PRIMARY KEY,
      rate_bps INT NOT NULL
    );
  `);
}

export async function runRawQuery(sql: string): Promise<unknown[]> {
  const r = await pool.query(sql);
  return r.rows;
}
