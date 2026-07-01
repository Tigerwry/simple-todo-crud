'use strict';

const {
  EMAIL_REGEX,
  MIN_PASSWORD_LENGTH,
  PRIORITIES,
  STATUSES,
} = require('shared');

/**
 * Small, reusable validators. Each returns { valid, message } so callers
 * (services) can decide how to surface the error to the console UI.
 */

function isNonEmpty(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function validateName(name) {
  if (!isNonEmpty(name)) {
    return { valid: false, message: 'Name is required.' };
  }
  return { valid: true };
}

function validateEmail(email) {
  if (!isNonEmpty(email)) {
    return { valid: false, message: 'Email is required.' };
  }
  if (!EMAIL_REGEX.test(email.trim())) {
    return { valid: false, message: 'Invalid email format.' };
  }
  return { valid: true };
}

function validatePassword(password) {
  if (!isNonEmpty(password)) {
    return { valid: false, message: 'Password is required.' };
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    return {
      valid: false,
      message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`,
    };
  }
  return { valid: true };
}

function validateTitle(title) {
  if (!isNonEmpty(title)) {
    return { valid: false, message: 'Title is required.' };
  }
  return { valid: true };
}

function validatePriority(priority) {
  if (!PRIORITIES.includes(priority)) {
    return { valid: false, message: `Priority must be one of: ${PRIORITIES.join(', ')}.` };
  }
  return { valid: true };
}

function validateStatus(status) {
  if (!STATUSES.includes(status)) {
    return { valid: false, message: `Status must be one of: ${STATUSES.join(', ')}.` };
  }
  return { valid: true };
}

/**
 * Optional due date in YYYY-MM-DD form. Empty is allowed (nullable column).
 */
function validateDueDate(dueDate) {
  if (!isNonEmpty(dueDate)) {
    return { valid: true, value: null };
  }
  const trimmed = dueDate.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return { valid: false, message: 'Due date must be in YYYY-MM-DD format.' };
  }
  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) {
    return { valid: false, message: 'Due date is not a real date.' };
  }
  return { valid: true, value: trimmed };
}

module.exports = {
  isNonEmpty,
  validateName,
  validateEmail,
  validatePassword,
  validateTitle,
  validatePriority,
  validateStatus,
  validateDueDate,
};
