'use strict';

const taskModel = require('../models/taskModel');
const {
  validateTitle,
  validatePriority,
  validateStatus,
} = require('../utils/validation');
const { DEFAULT_PRIORITY, DEFAULT_STATUS } = require('shared');

/** Business/validation error for the task module. */
class TaskError extends Error {}

function assertValid(...checks) {
  for (const check of checks) {
    if (!check.valid) throw new TaskError(check.message);
  }
}

async function addTask(userId, { title, description, dueDate, priority, status }) {
  const finalPriority = priority || DEFAULT_PRIORITY;
  const finalStatus = status || DEFAULT_STATUS;

  assertValid(
    validateTitle(title),
    validatePriority(finalPriority),
    validateStatus(finalStatus)
  );

  return taskModel.createTask({
    userId,
    title: title.trim(),
    description: description ? description.trim() : null,
    dueDate: dueDate || null,
    priority: finalPriority,
    status: finalStatus,
  });
}

async function getTasks(userId) {
  return taskModel.findAllByUser(userId);
}

async function getTask(userId, taskId) {
  const task = await taskModel.findById(taskId, userId);
  if (!task) throw new TaskError('Task not found.');
  return task;
}

async function editTask(userId, taskId, { title, description, dueDate, priority, status }) {
  // Ensure the task exists and belongs to the user before updating.
  await getTask(userId, taskId);

  assertValid(
    validateTitle(title),
    validatePriority(priority),
    validateStatus(status)
  );

  return taskModel.updateTask(taskId, userId, {
    title: title.trim(),
    description: description ? description.trim() : null,
    dueDate: dueDate || null,
    priority,
    status,
  });
}

async function removeTask(userId, taskId) {
  const deleted = await taskModel.deleteTask(taskId, userId);
  if (!deleted) throw new TaskError('Task not found.');
  return true;
}

async function searchTasks(userId, term) {
  if (!term || !term.trim()) {
    throw new TaskError('Search term is required.');
  }
  return taskModel.searchTasks(userId, term.trim());
}

module.exports = {
  addTask,
  getTasks,
  getTask,
  editTask,
  removeTask,
  searchTasks,
  TaskError,
};
