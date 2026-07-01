'use strict';

const jwt = require('jsonwebtoken');

/**
 * JWT helpers + auth guard for the REST layer.
 * This is additive and completely independent of the console app —
 * it only reuses the existing services through the controllers.
 */
const SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
const EXPIRES_IN = '2h';

/** Create a signed token from a public user object. */
function sign(user) {
  return jwt.sign(
    { id: user.id, name: user.name, email: user.email },
    SECRET,
    { expiresIn: EXPIRES_IN }
  );
}

/** Express middleware: require a valid Bearer token, attach req.user. */
function authenticate(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'Authentication required.' });
  }

  try {
    req.user = jwt.verify(token, SECRET);
    return next();
  } catch (err) {
    return res.status(401).json({ error: 'Session expired. Please log in again.' });
  }
}

module.exports = { sign, authenticate };
