'use strict';

// Load environment variables from the repo-root .env (same file the CLI uses).
const path = require('node:path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const express = require('express');
const cors = require('cors');

const { testConnection } = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const taskRoutes = require('./routes/taskRoutes');

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const FRONTEND_DIR = path.resolve(__dirname, '../../frontend');

app.use(cors());
app.use(express.json());

// ---- REST API (reuses the existing service layer) ----
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);

// Unknown API routes -> JSON 404 (before static fallthrough).
app.use('/api', (req, res) => res.status(404).json({ error: 'Not found' }));

// ---- Static frontend ----
app.use(express.static(FRONTEND_DIR));
app.get('/', (req, res) => res.redirect('/pages/login.html'));

// Central error handler for anything the controllers pass to next(err).
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error.' });
});

async function start() {
  try {
    await testConnection();
  } catch (err) {
    console.error('\n❌ Could not connect to the MySQL database.');
    console.error(`   Details: ${err.message}\n`);
    process.exit(1);
  }

  app.listen(PORT, () => {
    console.log(`\n🚀 Todo App server running`);
    console.log(`   API:      http://localhost:${PORT}/api`);
    console.log(`   Frontend: http://localhost:${PORT}/pages/login.html\n`);
  });
}

// Only auto-start when run directly (keeps the module testable).
if (require.main === module) {
  start();
}

module.exports = app;
