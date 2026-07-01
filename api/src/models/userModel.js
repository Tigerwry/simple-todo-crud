'use strict';

const { query } = require('../config/db');

/**
 * Data-access layer for the `users` table.
 * Only raw persistence lives here — validation/hashing belongs in services.
 */

async function createUser({ name, email, password }) {
  const result = await query(
    'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
    [name, email, password]
  );
  return { id: result.insertId, name, email };
}

async function findByEmail(email) {
  const rows = await query('SELECT * FROM users WHERE email = ? LIMIT 1', [email]);
  return rows[0] || null;
}

async function findById(id) {
  const rows = await query('SELECT id, name, email FROM users WHERE id = ? LIMIT 1', [id]);
  return rows[0] || null;
}

module.exports = { createUser, findByEmail, findById };
