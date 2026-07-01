// ============================================================
//  task.js — dashboard task board
//  Stats, search, grid render, and Add/Edit/Delete modals.
// ============================================================

import { api, requireAuth } from '/components/api.js';
import {
  toast,
  priorityBadge,
  statusBadge,
  escapeHtml,
  accent,
  loadingState,
  skeletonState,
  emptyState,
  errorState,
} from '/components/ui.js';
import { openModal, closeModal, wireOverlay, confirmDialog } from '/components/modal.js';

/* ---------- State ---------- */
let allTasks = [];
let currentSearch = '';
let searchTimer = null;

/* ---------- Element refs ---------- */
const grid = document.getElementById('task-grid');
const statsEl = document.getElementById('stats');
const searchInput = document.getElementById('search-input');
const addBtn = document.getElementById('add-task-btn');

const overlay = document.getElementById('task-modal');
const form = document.getElementById('task-form');
const modalTitle = document.getElementById('modal-title');

/* ---------- Stats ---------- */
function renderStats(tasks) {
  const total = tasks.length;
  const completed = tasks.filter((t) => t.status === 'Completed').length;
  const pending = total - completed;
  const high = tasks.filter((t) => t.priority === 'High').length;

  const cards = [
    { label: 'Total Tasks', value: total, emoji: '📦', color: 'var(--c1)', shadow: 'var(--c3)' },
    { label: 'Completed', value: completed, emoji: '✅', color: 'var(--c2)', shadow: 'var(--c4)' },
    { label: 'Pending', value: pending, emoji: '⏳', color: 'var(--c3)', shadow: 'var(--c1)' },
    { label: 'High Priority', value: high, emoji: '🔥', color: 'var(--c4)', shadow: 'var(--c2)' },
  ];

  statsEl.innerHTML = cards
    .map(
      (c) => `
      <div class="stat-card" style="--stat-color:${c.color};--stat-shadow:${c.shadow}">
        <span class="stat-emoji" aria-hidden="true">${c.emoji}</span>
        <div class="stat-value">${c.value}</div>
        <div class="stat-label">${c.label}</div>
      </div>`
    )
    .join('');
}

/* ---------- Task grid ---------- */
function taskCard(task, index) {
  const color = accent(index);
  const shadow = accent(index + 2);
  const completed = task.status === 'Completed';
  return `
    <article class="task-card card-enter ${completed ? 'is-completed' : ''}"
             style="--task-color:${color};--task-shadow:${shadow};animation-delay:${(index % 6) * 0.05}s"
             data-id="${task.id}">
      <div class="task-card-top">
        <h3 class="task-title">${escapeHtml(task.title)}</h3>
      </div>
      <div class="task-badges">
        ${priorityBadge(task.priority)}
        ${statusBadge(task.status)}
      </div>
      ${task.description ? `<p class="task-desc">${escapeHtml(task.description)}</p>` : ''}
      ${task.dueDate ? `<div class="task-meta">📅 Due ${escapeHtml(task.dueDate)}</div>` : ''}
      <div class="task-actions">
        <button class="btn btn-sm btn-outline" data-action="edit" data-id="${task.id}">✏️ Edit</button>
        <button class="btn btn-sm btn-danger" data-action="delete" data-id="${task.id}">🗑️ Delete</button>
      </div>
    </article>`;
}

function renderTasks(tasks) {
  if (!tasks.length) {
    grid.innerHTML = emptyState(Boolean(currentSearch));
    return;
  }
  grid.innerHTML = tasks.map(taskCard).join('');
}

/* ---------- Data loading ---------- */
async function loadTasks() {
  grid.innerHTML = loadingState();
  try {
    const { tasks } = currentSearch
      ? await api.searchTasks(currentSearch)
      : await api.listTasks();
    allTasks = tasks;
    renderStats(allTasks);
    renderTasks(tasks);
  } catch (err) {
    grid.innerHTML = errorState(err.message);
  }
}

/* ---------- Modal: add / edit ---------- */
function openAdd() {
  form.reset();
  form.id.value = '';
  modalTitle.textContent = '✨ Add Task';
  clearFormErrors();
  openModal(overlay);
}

function openEdit(task) {
  form.reset();
  form.id.value = task.id;
  form.title.value = task.title;
  form.description.value = task.description || '';
  form.dueDate.value = task.dueDate || '';
  form.priority.value = task.priority;
  form.status.value = task.status;
  modalTitle.textContent = '✏️ Edit Task';
  clearFormErrors();
  openModal(overlay);
}

function clearFormErrors() {
  form.querySelectorAll('[data-error]').forEach((el) => {
    el.textContent = '';
  });
}

async function submitTask(e) {
  e.preventDefault();
  clearFormErrors();

  const id = form.id.value;
  const payload = {
    title: form.title.value.trim(),
    description: form.description.value.trim(),
    dueDate: form.dueDate.value || null,
    priority: form.priority.value,
    status: form.status.value,
  };

  if (!payload.title) {
    form.querySelector('[data-error="title"]').textContent = 'Title is required.';
    return;
  }

  const btn = form.querySelector('button[type="submit"]');
  btn.disabled = true;
  btn.textContent = 'Saving…';
  try {
    if (id) {
      await api.updateTask(Number(id), payload);
      toast('Task updated! 🎯', 'success');
    } else {
      await api.createTask(payload);
      toast('Task added! 🚀', 'success');
    }
    closeModal();
    await loadTasks();
  } catch (err) {
    toast(err.message, 'error');
    form.querySelector('[data-error="title"]').textContent = err.message;
  } finally {
    btn.disabled = false;
    btn.textContent = '💾 Save Task';
  }
}

/* ---------- Delete ---------- */
async function deleteTask(id) {
  const task = allTasks.find((t) => String(t.id) === String(id));
  const ok = await confirmDialog({
    title: 'Delete this task?',
    message: task ? `“${escapeHtml(task.title)}” will be gone forever.` : 'This cannot be undone.',
    confirmText: '🗑️ Yes, delete',
    emoji: '🚨',
  });
  if (!ok) return;
  try {
    await api.deleteTask(Number(id));
    toast('Task deleted.', 'info');
    await loadTasks();
  } catch (err) {
    toast(err.message, 'error');
  }
}

/* ---------- Events ---------- */
function wireEvents() {
  addBtn.addEventListener('click', openAdd);
  form.addEventListener('submit', submitTask);
  wireOverlay(overlay);

  // Debounced live search.
  searchInput.addEventListener('input', () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      currentSearch = searchInput.value.trim();
      loadTasks();
    }, 300);
  });

  // Delegated actions on the grid (edit / delete / empty-state / retry).
  grid.addEventListener('click', (e) => {
    const actionEl = e.target.closest('[data-action]');
    if (!actionEl) return;
    const action = actionEl.dataset.action;
    const id = actionEl.dataset.id;

    if (action === 'edit') {
      const task = allTasks.find((t) => String(t.id) === String(id));
      if (task) openEdit(task);
    } else if (action === 'delete') {
      deleteTask(id);
    } else if (action === 'add-first') {
      openAdd();
    } else if (action === 'retry') {
      loadTasks();
    }
  });
}

/* ---------- Boot ---------- */
document.addEventListener('DOMContentLoaded', () => {
  if (!requireAuth()) return;
  if (!grid) return; // not the dashboard
  wireEvents();
  loadTasks();
});
