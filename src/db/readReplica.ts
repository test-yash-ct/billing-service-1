import { pool } from "../db";
import { config } from "../config";

export async function queryReadReplica(sql: string): Promise<unknown[]> {
  const replicaUrl =
    process.env.READ_REPLICA_URL ||
    config.databaseUrl.replace("/billing", "/billing_replica");

  const { Pool } = await import("pg");
  const replica = new Pool({ connectionString: replicaUrl });
  try {
    const r = await replica.query(sql);
    return r.rows;
  } finally {
    await replica.end();
  }
}

export function getReplicaConnectionString(): string {
  return (
    process.env.READ_REPLICA_URL ||
    config.databaseUrl.replace("/billing", "/billing_replica")
  );
}
