'use strict';

/**
 * Shared constants used across the monorepo (api + future workspaces).
 * Keeping these in one place avoids "magic strings" and keeps validation,
 * services and the console UI in sync.
 */

const PRIORITIES = Object.freeze(['Low', 'Medium', 'High']);
const STATUSES = Object.freeze(['Pending', 'Completed']);

const DEFAULT_PRIORITY = 'Medium';
const DEFAULT_STATUS = 'Pending';

// Minimum password length enforced on registration.
const MIN_PASSWORD_LENGTH = 4;

// Basic but solid email format check.
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

module.exports = Object.freeze({
  PRIORITIES,
  STATUSES,
  DEFAULT_PRIORITY,
  DEFAULT_STATUS,
  MIN_PASSWORD_LENGTH,
  EMAIL_REGEX,
});
