'use strict';

const taskService = require('../services/taskService');

/**
 * HTTP adapter around the existing taskService.
 * Every handler is scoped to req.user.id, mirroring the console app's
 * per-user isolation guarantees.
 */

function handleError(res, next, err) {
  if (err instanceof taskService.TaskError) {
    const code = /not found/i.test(err.message) ? 404 : 400;
    return res.status(code).json({ error: err.message });
  }
  return next(err);
}

async function list(req, res, next) {
  try {
    const tasks = await taskService.getTasks(req.user.id);
    return res.json({ tasks });
  } catch (err) {
    return handleError(res, next, err);
  }
}

async function create(req, res, next) {
  try {
    const task = await taskService.addTask(req.user.id, req.body || {});
    return res.status(201).json({ task });
  } catch (err) {
    return handleError(res, next, err);
  }
}

async function getOne(req, res, next) {
  try {
    const task = await taskService.getTask(req.user.id, Number(req.params.id));
    return res.json({ task });
  } catch (err) {
    return handleError(res, next, err);
  }
}

async function update(req, res, next) {
  try {
    const task = await taskService.editTask(req.user.id, Number(req.params.id), req.body || {});
    return res.json({ task });
  } catch (err) {
    return handleError(res, next, err);
  }
}

async function remove(req, res, next) {
  try {
    await taskService.removeTask(req.user.id, Number(req.params.id));
    return res.json({ success: true });
  } catch (err) {
    return handleError(res, next, err);
  }
}

async function search(req, res, next) {
  try {
    const tasks = await taskService.searchTasks(req.user.id, req.query.q || '');
    return res.json({ tasks });
  } catch (err) {
    return handleError(res, next, err);
  }
}

module.exports = { list, create, getOne, update, remove, search };
