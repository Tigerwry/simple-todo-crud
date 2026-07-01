'use strict';

const bcrypt = require('bcrypt');
const userModel = require('../models/userModel');
const {
  validateName,
  validateEmail,
  validatePassword,
} = require('../utils/validation');

const SALT_ROUNDS = Number(process.env.BCRYPT_SALT_ROUNDS) || 10;

/**
 * Custom error used for expected/business failures (e.g. duplicate email,
 * wrong password) so the UI can show a friendly message instead of a stack.
 */
class AuthError extends Error {}

/**
 * Register a new user.
 * - name required
 * - email unique + valid format
 * - password >= 4 chars, stored hashed with bcrypt
 * @returns {Promise<{id:number,name:string,email:string}>}
 */
async function register({ name, email, password }) {
  for (const check of [
    validateName(name),
    validateEmail(email),
    validatePassword(password),
  ]) {
    if (!check.valid) throw new AuthError(check.message);
  }

  const normalisedEmail = email.trim().toLowerCase();

  const existing = await userModel.findByEmail(normalisedEmail);
  if (existing) {
    throw new AuthError('An account with this email already exists.');
  }

  const hashed = await bcrypt.hash(password, SALT_ROUNDS);
  return userModel.createUser({
    name: name.trim(),
    email: normalisedEmail,
    password: hashed,
  });
}

/**
 * Authenticate a user by email + password.
 * Uses a single generic message for wrong email OR wrong password.
 * @returns {Promise<{id:number,name:string,email:string}>}
 */
async function login({ email, password }) {
  if (!email || !password) {
    throw new AuthError('Email and password are required.');
  }

  const normalisedEmail = email.trim().toLowerCase();
  const user = await userModel.findByEmail(normalisedEmail);
  if (!user) {
    throw new AuthError('Invalid email or password.');
  }

  const match = await bcrypt.compare(password, user.password);
  if (!match) {
    throw new AuthError('Invalid email or password.');
  }

  return { id: user.id, name: user.name, email: user.email };
}

module.exports = { register, login, AuthError };
