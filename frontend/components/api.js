// ============================================================
//  API client + session management (reusable component)
//  Talks to the additive Express layer that reuses the existing
//  authService / taskService. Same-origin, so base path is /api.
// ============================================================

const TOKEN_KEY = 'todo_token';
const USER_KEY = 'todo_user';

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setSession(token, user) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function getUser() {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY));
  } catch {
    return null;
  }
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

async function request(path, { method = 'GET', body, auth = true } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (auth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  let res;
  try {
    res = await fetch(`/api${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (networkErr) {
    const err = new Error('Cannot reach the server. Is it running?');
    err.status = 0;
    throw err;
  }

  // Expired/invalid session -> bounce to login (except on auth calls).
  if (res.status === 401 && auth) {
    clearSession();
    if (!location.pathname.endsWith('login.html')) {
      location.href = '/pages/login.html';
    }
  }

  let data = null;
  try {
    data = await res.json();
  } catch {
    /* no body */
  }

  if (!res.ok) {
    const err = new Error((data && data.error) || `Request failed (${res.status})`);
    err.status = res.status;
    throw err;
  }
  return data;
}

export const api = {
  register: (payload) => request('/auth/register', { method: 'POST', body: payload, auth: false }),
  login: (payload) => request('/auth/login', { method: 'POST', body: payload, auth: false }),
  listTasks: () => request('/tasks'),
  searchTasks: (q) => request(`/tasks/search?q=${encodeURIComponent(q)}`),
  createTask: (payload) => request('/tasks', { method: 'POST', body: payload }),
  updateTask: (id, payload) => request(`/tasks/${id}`, { method: 'PUT', body: payload }),
  deleteTask: (id) => request(`/tasks/${id}`, { method: 'DELETE' }),
};

/** Redirect guards used by pages. */
export function requireAuth() {
  if (!getToken()) {
    location.href = '/pages/login.html';
    return false;
  }
  return true;
}

export function redirectIfAuthed() {
  if (getToken()) {
    location.href = '/pages/dashboard.html';
  }
}
