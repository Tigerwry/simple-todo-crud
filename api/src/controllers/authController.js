'use strict';

const authService = require('../services/authService');
const { sign } = require('../middleware/auth');

/**
 * HTTP adapter around the existing authService.
 * Business/validation failures (AuthError) map to 4xx; everything else 500.
 */

async function register(req, res, next) {
  try {
    const { name, email, password } = req.body || {};
    const user = await authService.register({ name, email, password });
    return res.status(201).json({ user });
  } catch (err) {
    if (err instanceof authService.AuthError) {
      return res.status(400).json({ error: err.message });
    }
    return next(err);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body || {};
    const user = await authService.login({ email, password });
    const token = sign(user);
    return res.json({ token, user });
  } catch (err) {
    if (err instanceof authService.AuthError) {
      return res.status(401).json({ error: err.message });
    }
    return next(err);
  }
}

module.exports = { register, login };
