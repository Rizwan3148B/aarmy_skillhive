// src/lib/postgres.js
import { Pool } from "pg";

// Reuse the pool across hot-reloads in dev, and across serverless invocations in prod.
// Without this, Next.js hot-reload / multiple route imports would each create a new Pool.
let pool;

if (!global._pgPool) {
    global._pgPool = new Pool({
        host: process.env.PGHOST,
        port: process.env.PGPORT,
        user: process.env.PGUSER,
        password: process.env.PGPASSWORD,
        database: process.env.PGDATABASE,
        max: 10,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 5000,
    });

    // Fires once, when the pool successfully opens its first client connection.
    global._pgPool.on("connect", () => {
        console.log("postgress connected");
    });

    global._pgPool.on("error", (err) => {
        console.error("Unexpected error on idle pg client", err);
    });
}

pool = global._pgPool;

/**
 * Run a query using the shared pool.
 * Usage: const { rows } = await query("SELECT * FROM users WHERE email = $1", [email]);
 */
export function query(text, params) {
    return pool.query(text, params);
}

export default pool;