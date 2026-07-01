'use strict';

// Load environment variables from the repo-root .env as early as possible.
const path = require('node:path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const { testConnection, closePool } = require('./config/db');
const { run } = require('./app');
const { closeInterface } = require('./utils/menu');

async function main() {
  // Fail fast with a clear message if the database is not reachable.
  try {
    await testConnection();
  } catch (err) {
    console.error('\n❌ Could not connect to the MySQL database.');
    console.error('   Check your .env settings and that the "todo_app" schema exists.');
    console.error(`   Details: ${err.message}\n`);
    process.exit(1);
  }

  await run();
  await closePool();
  process.exit(0);
}

// Graceful shutdown on Ctrl+C.
process.on('SIGINT', async () => {
  console.log('\n\nInterrupted. Shutting down...');
  closeInterface();
  await closePool();
  process.exit(0);
});

main().catch(async (err) => {
  console.error('\n❌ Unexpected error:', err.message);
  closeInterface();
  await closePool();
  process.exit(1);
});
