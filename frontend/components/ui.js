// ============================================================
//  Reusable UI helpers (badges, toasts, states, decorations)
//  Pure DOM/string helpers — no framework, no dependencies.
// ============================================================

/** The five accents, for systematic modulo rotation. */
export const ACCENTS = [
  'var(--c1)',
  'var(--c2)',
  'var(--c3)',
  'var(--c4)',
  'var(--c5)',
];

export function accent(i) {
  return ACCENTS[i % ACCENTS.length];
}

export function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/* ---------- Badges ---------- */
const PRIORITY_CLASS = { Low: 'badge-low', Medium: 'badge-medium', High: 'badge-high' };
const PRIORITY_EMOJI = { Low: '🌱', Medium: '⚡', High: '🔥' };
const STATUS_CLASS = { Pending: 'badge-pending', Completed: 'badge-completed' };
const STATUS_EMOJI = { Pending: '⏳', Completed: '✅' };

export function priorityBadge(priority) {
  const cls = PRIORITY_CLASS[priority] || 'badge-medium';
  const emoji = PRIORITY_EMOJI[priority] || '⚡';
  return `<span class="badge ${cls}">${emoji} ${escapeHtml(priority)}</span>`;
}

export function statusBadge(status) {
  const cls = STATUS_CLASS[status] || 'badge-pending';
  const emoji = STATUS_EMOJI[status] || '⏳';
  return `<span class="badge ${cls}">${emoji} ${escapeHtml(status)}</span>`;
}

/* ---------- Toasts ---------- */
function toastLayer() {
  let layer = document.querySelector('.toast-layer');
  if (!layer) {
    layer = document.createElement('div');
    layer.className = 'toast-layer';
    layer.setAttribute('aria-live', 'polite');
    document.body.appendChild(layer);
  }
  return layer;
}

export function toast(message, type = 'info') {
  const emoji = { success: '🎉', error: '💥', info: '✨' }[type] || '✨';
  const el = document.createElement('div');
  el.className = `toast toast-${type}`;
  el.setAttribute('role', 'status');
  el.innerHTML = `<span class="toast-emoji" aria-hidden="true">${emoji}</span><span>${escapeHtml(message)}</span>`;
  toastLayer().appendChild(el);
  setTimeout(() => {
    el.classList.add('leaving');
    el.addEventListener('animationend', () => el.remove(), { once: true });
  }, 3200);
}

/* ---------- State renderers (empty / loading / error) ---------- */
export function loadingState() {
  return `
    <div class="state" role="status">
      <div class="spinner" aria-hidden="true"></div>
      <h3>Loading your chaos…</h3>
      <p class="muted-text">Fetching your tasks from the void.</p>
    </div>`;
}

export function skeletonState() {
  return `<div class="skeleton"></div><div class="skeleton"></div><div class="skeleton"></div>`;
}

export function emptyState(searching = false) {
  return searching
    ? `<div class="state">
         <div class="state-emoji animate-wiggle" aria-hidden="true">🔍</div>
         <h3>No matches!</h3>
         <p>Nothing matched your search. Try a different word.</p>
       </div>`
    : `<div class="state">
         <div class="state-emoji animate-bounce-subtle" aria-hidden="true">🗒️</div>
         <h3>No tasks yet!</h3>
         <p>Your list is emptier than deep space. Smash that button and add your first task.</p>
         <button class="btn btn-primary" data-action="add-first">✨ Add your first task</button>
       </div>`;
}

export function errorState(message) {
  return `<div class="state state-error">
      <div class="state-emoji" aria-hidden="true">💥</div>
      <h3>Something broke</h3>
      <p>${escapeHtml(message)}</p>
      <button class="btn btn-outline" data-action="retry">🔁 Try again</button>
    </div>`;
}

/* ---------- Decorations ---------- */
const SHAPES = ['✨', '⭐', '💫', '🔥', '⚡', '🎯', '💜', '🚀', '💎', '🌈', '🎨', '💥'];

/** Scatter animated emoji across a fixed floating layer. */
export function mountFloatingShapes(count = 9) {
  let layer = document.querySelector('.floating-layer');
  if (!layer) {
    layer = document.createElement('div');
    layer.className = 'floating-layer';
    layer.setAttribute('aria-hidden', 'true');
    document.body.appendChild(layer);
  }
  const positions = [
    [8, 12], [88, 8], [15, 78], [80, 70], [45, 20],
    [92, 40], [5, 45], [60, 88], [30, 55], [70, 30],
    [50, 65], [20, 30],
  ];
  for (let i = 0; i < count; i += 1) {
    const span = document.createElement('span');
    span.className = 'floating-shape';
    span.textContent = SHAPES[i % SHAPES.length];
    const [left, top] = positions[i % positions.length];
    span.style.left = `${left}%`;
    span.style.top = `${top}%`;
    span.style.fontSize = `${1.6 + (i % 4) * 0.7}rem`;
    span.style.animationDelay = `${(i % 5) * 0.4}s`;
    layer.appendChild(span);
  }
}

/** Two oversized background words for depth. */
export function mountBackgroundWords(topRight = 'DO', bottomLeft = 'IT') {
  const tr = document.createElement('div');
  tr.className = 'bg-word tr';
  tr.setAttribute('aria-hidden', 'true');
  tr.textContent = topRight;
  const bl = document.createElement('div');
  bl.className = 'bg-word bl';
  bl.setAttribute('aria-hidden', 'true');
  bl.textContent = bottomLeft;
  document.body.append(tr, bl);
}
