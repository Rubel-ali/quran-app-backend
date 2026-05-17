import { Pool } from "pg";
import "dotenv/config";

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is required");
}

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

pool.on("error", (err) => {
  console.error("Unexpected PostgreSQL pool error:", err);
});

// Helper — run a query and return rows
export async function query<T = any>(
  text: string,
  params?: any[],
): Promise<T[]> {
  const client = await pool.connect();

  try {
    const result = await client.query(text, params);
    return result.rows as T[];
  } catch (error) {
    console.error("Query Error:", error);
    throw error;
  } finally {
    client.release();
  }
}

// Helper — return single row or null
export async function queryOne<T = any>(
  text: string,
  params?: any[],
): Promise<T | null> {
  const rows = await query<T>(text, params);
  return rows[0] ?? null;
}

// Helper — run inside a transaction
export async function transaction<T>(
  fn: (q: typeof query) => Promise<T>,
): Promise<T> {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const txQuery = async <R = any>(
      text: string,
      params?: any[],
    ): Promise<R[]> => {
      const result = await client.query(text, params);
      return result.rows as R[];
    };

    const result = await fn(txQuery as typeof query);

    await client.query("COMMIT");

    return result;
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Transaction Error:", err);
    throw err;
  } finally {
    client.release();
  }
}

export default pool;