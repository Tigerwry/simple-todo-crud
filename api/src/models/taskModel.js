'use strict';

const { query } = require('../config/db');

/**
 * Data-access layer for the `tasks` table.
 * Every read is scoped by userId so users can only ever touch their own tasks.
 */

async function createTask({ userId, title, description, dueDate, priority, status }) {
  const result = await query(
    `INSERT INTO tasks (userId, title, description, dueDate, priority, status)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [userId, title, description, dueDate, priority, status]
  );
  return findById(result.insertId, userId);
}

async function findAllByUser(userId) {
  return query(
    'SELECT * FROM tasks WHERE userId = ? ORDER BY id ASC',
    [userId]
  );
}

async function findById(id, userId) {
  const rows = await query(
    'SELECT * FROM tasks WHERE id = ? AND userId = ? LIMIT 1',
    [id, userId]
  );
  return rows[0] || null;
}

async function updateTask(id, userId, { title, description, dueDate, priority, status }) {
  await query(
    `UPDATE tasks
        SET title = ?, description = ?, dueDate = ?, priority = ?, status = ?
      WHERE id = ? AND userId = ?`,
    [title, description, dueDate, priority, status, id, userId]
  );
  return findById(id, userId);
}

async function deleteTask(id, userId) {
  const result = await query(
    'DELETE FROM tasks WHERE id = ? AND userId = ?',
    [id, userId]
  );
  return result.affectedRows > 0;
}

async function searchTasks(userId, term) {
  const like = `%${term}%`;
  return query(
    `SELECT * FROM tasks
      WHERE userId = ? AND (title LIKE ? OR description LIKE ?)
      ORDER BY id ASC`,
    [userId, like, like]
  );
}

module.exports = {
  createTask,
  findAllByUser,
  findById,
  updateTask,
  deleteTask,
  searchTasks,
};
