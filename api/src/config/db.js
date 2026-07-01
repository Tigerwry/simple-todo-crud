'use strict';

const mysql = require('mysql2/promise');

/**
 * A single shared connection pool for the whole application.
 * Using a pool (instead of one-off connections) keeps the console app
 * responsive and avoids leaking connections between CRUD operations.
 */
let pool = null;

function getPool() {
  if (!pool) {
    const config = {
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT) || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'todo_app',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      dateStrings: true, // return DATE/DATETIME as strings for clean console output
    };
    // Optional: connect over a UNIX socket instead of TCP when DB_SOCKET is set.
    if (process.env.DB_SOCKET) {
      config.socketPath = process.env.DB_SOCKET;
    }
    pool = mysql.createPool(config);
  }
  return pool;
}

/**
 * Thin wrapper around pool.query so models stay tiny and consistent.
 * @param {string} sql
 * @param {Array<any>} [params]
 * @returns {Promise<any>} rows (SELECT) or ResultSetHeader (INSERT/UPDATE/DELETE)
 */
async function query(sql, params = []) {
  const [result] = await getPool().execute(sql, params);
  return result;
}

/** Verify the database is reachable before the app starts its menu loop. */
async function testConnection() {
  const conn = await getPool().getConnection();
  try {
    await conn.ping();
  } finally {
    conn.release();
  }
}

/** Gracefully close the pool on shutdown. */
async function closePool() {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

module.exports = { getPool, query, testConnection, closePool };
