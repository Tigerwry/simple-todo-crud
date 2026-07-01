'use strict';

const authService = require('./services/authService');
const taskService = require('./services/taskService');
const {
  ask,
  askValidated,
  askChoice,
  confirm,
  closeInterface,
  header,
  printTask,
  printTasks,
} = require('./utils/menu');
const {
  validateName,
  validateEmail,
  validatePassword,
  validateTitle,
  validateDueDate,
} = require('./utils/validation');
const { PRIORITIES, STATUSES } = require('shared');

/** Session state for the currently logged-in user (null when logged out). */
let currentUser = null;

// ------------------------------------------------------------------
//  USER MODULE
// ------------------------------------------------------------------

async function handleRegister() {
  header('Register');
  try {
    const name = await askValidated('Name: ', validateName);
    const email = await askValidated('Email: ', validateEmail);
    const password = await askValidated('Password (min 4 chars): ', validatePassword);
    if (name === null || email === null || password === null) return; // EOF

    const user = await authService.register({ name, email, password });
    console.log(`\n✅ Registered successfully! Welcome, ${user.name}. Please log in.\n`);
  } catch (err) {
    if (err instanceof authService.AuthError) {
      console.log(`\n❌ ${err.message}\n`);
    } else {
      throw err;
    }
  }
}

async function handleLogin() {
  header('Login');
  try {
    const email = await ask('Email: ');
    const password = await ask('Password: ');
    if (email === null || password === null) return; // EOF

    currentUser = await authService.login({ email, password });
    console.log(`\n✅ Welcome back, ${currentUser.name}!\n`);
    await taskMenu();
  } catch (err) {
    if (err instanceof authService.AuthError) {
      console.log(`\n❌ ${err.message}\n`);
    } else {
      throw err;
    }
  }
}

// ------------------------------------------------------------------
//  TASK MODULE
// ------------------------------------------------------------------

/** Shared prompt sequence for Add/Edit. `defaults` pre-fills for editing. */
async function promptTaskFields(defaults = {}) {
  const title = await askValidated(
    defaults.title ? `Title [${defaults.title}]: ` : 'Title: ',
    (value) => {
      if (defaults.title && value === '') return { valid: true, value: defaults.title };
      return validateTitle(value);
    }
  );

  const descInput = await ask(
    defaults.description ? `Description [${defaults.description}]: ` : 'Description: '
  );
  const description = descInput === '' && defaults.description !== undefined
    ? defaults.description
    : descInput;

  const dueDate = await askValidated(
    defaults.dueDate ? `Due date YYYY-MM-DD [${defaults.dueDate}]: ` : 'Due date (YYYY-MM-DD, optional): ',
    (value) => {
      if (value === '' && defaults.dueDate !== undefined) {
        return { valid: true, value: defaults.dueDate };
      }
      return validateDueDate(value);
    }
  );

  const priority = await askChoice('Priority:', PRIORITIES);
  const status = await askChoice('Status:', STATUSES);

  return { title, description, dueDate, priority, status };
}

async function handleAddTask() {
  header('Add Task');
  try {
    const fields = await promptTaskFields();
    const task = await taskService.addTask(currentUser.id, fields);
    console.log('\n✅ Task added:');
    printTask(task);
    console.log('');
  } catch (err) {
    if (err instanceof taskService.TaskError) {
      console.log(`\n❌ ${err.message}\n`);
    } else {
      throw err;
    }
  }
}

async function handleViewTasks() {
  header('View All Tasks');
  const tasks = await taskService.getTasks(currentUser.id);
  printTasks(tasks);
}

async function handleEditTask() {
  header('Edit Task');
  try {
    const idInput = await ask('Enter task ID to edit: ');
    const taskId = Number(idInput);
    if (!Number.isInteger(taskId)) {
      console.log('\n❌ Invalid task ID.\n');
      return;
    }

    const existing = await taskService.getTask(currentUser.id, taskId);
    console.log('\nCurrent values (press Enter to keep the shown value):');
    printTask(existing);
    console.log('');

    const fields = await promptTaskFields(existing);
    const updated = await taskService.editTask(currentUser.id, taskId, fields);
    console.log('\n✅ Task updated:');
    printTask(updated);
    console.log('');
  } catch (err) {
    if (err instanceof taskService.TaskError) {
      console.log(`\n❌ ${err.message}\n`);
    } else {
      throw err;
    }
  }
}

async function handleDeleteTask() {
  header('Delete Task');
  try {
    const idInput = await ask('Enter task ID to delete: ');
    const taskId = Number(idInput);
    if (!Number.isInteger(taskId)) {
      console.log('\n❌ Invalid task ID.\n');
      return;
    }

    const task = await taskService.getTask(currentUser.id, taskId);
    printTask(task);

    const sure = await confirm('\nAre you sure you want to delete this task?');
    if (!sure) {
      console.log('\nDeletion cancelled.\n');
      return;
    }

    await taskService.removeTask(currentUser.id, taskId);
    console.log('\n✅ Task deleted.\n');
  } catch (err) {
    if (err instanceof taskService.TaskError) {
      console.log(`\n❌ ${err.message}\n`);
    } else {
      throw err;
    }
  }
}

async function handleSearchTasks() {
  header('Search Tasks');
  try {
    const term = await ask('Search by title/description: ');
    const tasks = await taskService.searchTasks(currentUser.id, term);
    printTasks(tasks);
  } catch (err) {
    if (err instanceof taskService.TaskError) {
      console.log(`\n❌ ${err.message}\n`);
    } else {
      throw err;
    }
  }
}

// ------------------------------------------------------------------
//  MENUS
// ------------------------------------------------------------------

async function taskMenu() {
  // eslint-disable-next-line no-constant-condition
  while (currentUser) {
    const choice = await askChoice(
      `\nTask Menu (logged in as ${currentUser.name})`,
      [
        'Add Task',
        'View All Tasks',
        'Edit Task',
        'Delete Task',
        'Search Tasks',
        'Logout',
      ]
    );

    if (choice === null) {
      // EOF on stdin — log out and let the main menu also exit.
      currentUser = null;
      break;
    }

    switch (choice) {
      case 'Add Task':
        await handleAddTask();
        break;
      case 'View All Tasks':
        await handleViewTasks();
        break;
      case 'Edit Task':
        await handleEditTask();
        break;
      case 'Delete Task':
        await handleDeleteTask();
        break;
      case 'Search Tasks':
        await handleSearchTasks();
        break;
      case 'Logout':
        console.log(`\n👋 Logged out. Goodbye, ${currentUser.name}!\n`);
        currentUser = null;
        break;
      default:
        break;
    }
  }
}

async function mainMenu() {
  header('Welcome to Todo App');
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const choice = await askChoice('\nMain Menu', ['Register', 'Login', 'Exit']);

    // `null` == EOF (Ctrl+D / end of piped input) — exit cleanly.
    if (choice === null || choice === 'Exit') {
      console.log('\nGoodbye! 👋\n');
      break;
    }

    if (choice === 'Register') {
      await handleRegister();
    } else if (choice === 'Login') {
      await handleLogin();
    }
  }
}

/** Entry point for the interactive loop. Always closes readline on exit. */
async function run() {
  try {
    await mainMenu();
  } finally {
    closeInterface();
  }
}

module.exports = { run };
