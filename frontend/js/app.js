// ============================================================
//  app.js — shared chrome + auth pages (login / register)
//  Dashboard-specific task logic lives in task.js.
// ============================================================

import {
  api,
  setSession,
  clearSession,
  getUser,
  requireAuth,
  redirectIfAuthed,
} from '/components/api.js';
import { toast, mountFloatingShapes, mountBackgroundWords } from '/components/ui.js';

/* ---------- Shared decorations (maximalist chrome) ---------- */
function mountChrome(words) {
  mountFloatingShapes(window.innerWidth < 640 ? 6 : 9);
  if (words) mountBackgroundWords(words[0], words[1]);
}

/* ---------- Small validation helpers (mirror the backend) ---------- */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function setError(form, field, message) {
  const el = form.querySelector(`[data-error="${field}"]`);
  if (el) el.textContent = message || '';
}

function clearErrors(form) {
  form.querySelectorAll('[data-error]').forEach((el) => {
    el.textContent = '';
  });
}

/* ---------- Login page ---------- */
function initLogin() {
  redirectIfAuthed();
  const form = document.getElementById('login-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearErrors(form);
    const email = form.email.value.trim();
    const password = form.password.value;

    let bad = false;
    if (!EMAIL_RE.test(email)) {
      setError(form, 'email', 'Enter a valid email.');
      bad = true;
    }
    if (!password) {
      setError(form, 'password', 'Password is required.');
      bad = true;
    }
    if (bad) return;

    const btn = form.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.textContent = 'Logging in…';
    try {
      const { token, user } = await api.login({ email, password });
      setSession(token, user);
      toast(`Welcome back, ${user.name}!`, 'success');
      setTimeout(() => (location.href = '/pages/dashboard.html'), 500);
    } catch (err) {
      toast(err.message, 'error');
      setError(form, 'password', err.message);
      btn.disabled = false;
      btn.textContent = '🚀 Log in';
    }
  });
}

/* ---------- Register page ---------- */
function initRegister() {
  redirectIfAuthed();
  const form = document.getElementById('register-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearErrors(form);
    const name = form.name.value.trim();
    const email = form.email.value.trim();
    const password = form.password.value;

    let bad = false;
    if (!name) {
      setError(form, 'name', 'Name is required.');
      bad = true;
    }
    if (!EMAIL_RE.test(email)) {
      setError(form, 'email', 'Enter a valid email.');
      bad = true;
    }
    if (password.length < 4) {
      setError(form, 'password', 'Password must be at least 4 characters.');
      bad = true;
    }
    if (bad) return;

    const btn = form.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.textContent = 'Creating…';
    try {
      await api.register({ name, email, password });
      toast('Account created! Please log in.', 'success');
      setTimeout(() => (location.href = '/pages/login.html'), 800);
    } catch (err) {
      toast(err.message, 'error');
      // Surface duplicate-email style errors on the email field.
      setError(form, 'email', err.message);
      btn.disabled = false;
      btn.textContent = '🎉 Create account';
    }
  });
}

/* ---------- Dashboard chrome (greeting + logout) ---------- */
function initDashboardChrome() {
  if (!requireAuth()) return;
  const user = getUser();
  const hello = document.getElementById('hello-name');
  if (hello && user) hello.textContent = user.name;

  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      clearSession();
      toast('Logged out. See you soon! 👋', 'info');
      setTimeout(() => (location.href = '/pages/login.html'), 400);
    });
  }
}

/* ---------- Boot ---------- */
document.addEventListener('DOMContentLoaded', () => {
  const page = document.body.dataset.page;
  if (page === 'login') {
    mountChrome(['LOG', 'IN']);
    initLogin();
  } else if (page === 'register') {
    mountChrome(['JOIN', 'US']);
    initRegister();
  } else if (page === 'dashboard') {
    mountChrome(['DO', 'IT']);
    initDashboardChrome();
  }
});
