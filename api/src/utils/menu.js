'use strict';

const readline = require('node:readline');
const { stdin: input, stdout: output } = require('node:process');

/**
 * Console UI helpers.
 *
 * We use a persistent 'line' listener with an internal queue instead of
 * readline/promises' `question()`. `question()` pauses the input stream
 * between calls, which silently drops buffered lines when stdin is piped
 * (scripted runs / tests). A single always-on listener works reliably for
 * both interactive TTY sessions and piped input.
 */

let rl = null;
const lineQueue = [];
let pendingResolve = null;
let closed = false;

function getInterface() {
  if (!rl) {
    rl = readline.createInterface({ input, output });
    rl.on('line', (l) => {
      if (pendingResolve) {
        const resolve = pendingResolve;
        pendingResolve = null;
        resolve(l);
      } else {
        lineQueue.push(l);
      }
    });
    rl.on('close', () => {
      closed = true;
      if (pendingResolve) {
        const resolve = pendingResolve;
        pendingResolve = null;
        resolve(null);
      }
    });
  }
  return rl;
}

function closeInterface() {
  if (rl) {
    rl.close();
    rl = null;
  }
}

function nextLine() {
  getInterface();
  if (lineQueue.length > 0) return Promise.resolve(lineQueue.shift());
  if (closed) return Promise.resolve(null);
  return new Promise((resolve) => {
    pendingResolve = resolve;
  });
}

/**
 * Ask a question and return the trimmed answer.
 * Returns `null` on EOF (Ctrl+D / exhausted piped input) so callers can
 * shut down gracefully instead of spinning on empty input.
 */
async function ask(questionText) {
  output.write(questionText);
  const answer = await nextLine();
  return answer === null ? null : answer.trim();
}

/**
 * Keep asking with `validator` until it returns { valid: true }.
 * If the validator returns a `value`, that normalised value is returned.
 * Returns `null` on EOF.
 */
async function askValidated(questionText, validator) {
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const answer = await ask(questionText);
    if (answer === null) return null; // EOF
    const result = validator(answer);
    if (result.valid) {
      return result.value !== undefined ? result.value : answer;
    }
    console.log(`  ⚠️  ${result.message}`);
  }
}

/** Present a numbered list of choices and return the chosen value (null on EOF). */
async function askChoice(label, choices) {
  const list = choices.map((c, i) => `  ${i + 1}. ${c}`).join('\n');
  // eslint-disable-next-line no-constant-condition
  while (true) {
    console.log(`${label}\n${list}`);
    const answer = await ask('Choose an option: ');
    if (answer === null) return null; // EOF
    const idx = Number(answer);
    if (Number.isInteger(idx) && idx >= 1 && idx <= choices.length) {
      return choices[idx - 1];
    }
    console.log('  ⚠️  Invalid choice, please try again.');
  }
}

async function confirm(questionText) {
  const answer = await ask(`${questionText} (yes/no): `);
  if (answer === null) return false; // EOF -> treat as "no"
  const normalised = answer.toLowerCase();
  return normalised === 'yes' || normalised === 'y';
}

function line(char = '-', length = 50) {
  console.log(char.repeat(length));
}

function header(text) {
  line('=');
  console.log(text);
  line('=');
}

/** Pretty-print a single task record. */
function printTask(task) {
  line();
  console.log(`  ID          : ${task.id}`);
  console.log(`  Title       : ${task.title}`);
  console.log(`  Description : ${task.description || '(none)'}`);
  console.log(`  Due Date    : ${task.dueDate || '(none)'}`);
  console.log(`  Priority    : ${task.priority}`);
  console.log(`  Status      : ${task.status}`);
  console.log(`  Created At  : ${task.createdAt}`);
  console.log(`  Updated At  : ${task.updatedAt}`);
}

function printTasks(tasks) {
  if (!tasks.length) {
    console.log('\nNo tasks found.\n');
    return;
  }
  console.log(`\nFound ${tasks.length} task(s):`);
  tasks.forEach(printTask);
  line();
  console.log('');
}

module.exports = {
  getInterface,
  closeInterface,
  ask,
  askValidated,
  askChoice,
  confirm,
  line,
  header,
  printTask,
  printTasks,
};
