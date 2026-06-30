const API = 'http://localhost:8000';
const TOKEN_KEY = 'access_token';
const ADMIN_TOKEN_KEY = 'admin_token';

function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

function getAdminToken() {
  return localStorage.getItem(ADMIN_TOKEN_KEY);
}

function setAdminToken(token) {
  localStorage.setItem(ADMIN_TOKEN_KEY, token);
}

function clearAdminToken() {
  localStorage.removeItem(ADMIN_TOKEN_KEY);
}

function makeUsername(first, last) {
  return `${first.trim()}_${last.trim()}`
    .toLowerCase()
    .replace(/\s+/g, '_')
    .slice(0, 50);
}

async function request(path, options = {}) {
  const headers = { ...options.headers };
  if (options.body && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API}${path}`, { ...options, headers });
  let data = null;
  const text = await res.text();
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { detail: text };
    }
  }

  if (!res.ok) {
    const detail = data?.detail;
    const msg = typeof detail === 'string' ? detail : 'Ошибка запроса';
    throw new Error(msg);
  }
  return data;
}

async function me() {
  if (!getToken()) return null;
  try {
    return await request('/auth/me');
  } catch {
    clearToken();
    return null;
  }
}

async function updateNav() {
  const user = await me();
  const on = !!user;
  document.querySelectorAll('[data-log="out"]').forEach((n) => { n.hidden = on; });
  document.querySelectorAll('[data-log="in"]').forEach((n) => { n.hidden = !on; });
}

async function registerUser(firstName, lastName, email, password) {
  return request('/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      username: makeUsername(firstName, lastName),
      email,
      password,
    }),
  });
}

async function signIn(email, password) {
  const data = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  setToken(data.access_token);
  return data;
}

async function confirmUser(email, code) {
  const q = new URLSearchParams({ email, code });
  return request(`/auth/confirm-email?${q}`, { method: 'POST' });
}

async function resendCode(email) {
  const q = new URLSearchParams({ email });
  return request(`/auth/resend-code?${q}`, { method: 'POST' });
}

async function getProfile() {
  return request('/users/me/profile');
}

async function getCategories() {
  return request('/categories');
}

async function getLeaders(category) {
  const q = new URLSearchParams({ category });
  return request(`/leaders?${q}`);
}

async function getIndicators(category) {
  const q = category ? `?category=${encodeURIComponent(category)}` : '';
  return request(`/users/me/indicators${q}`);
}

async function getResults(category) {
  const q = new URLSearchParams({ category });
  return request(`/users/me/results?${q}`);
}

async function createResult(body) {
  return request('/users/me/results', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

async function deleteResult(id) {
  return request(`/users/me/results/${id}`, { method: 'DELETE' });
}

async function adminRequest(path, options = {}) {
  const headers = { ...options.headers };
  if (options.body && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }
  const token = getAdminToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API}${path}`, { ...options, headers });
  let data = null;
  const text = await res.text();
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { detail: text };
    }
  }
  if (!res.ok) {
    const detail = data?.detail;
    throw new Error(typeof detail === 'string' ? detail : 'Ошибка запроса');
  }
  return data;
}

async function getAdminResults(status = 'pending') {
  const q = new URLSearchParams({ status });
  return adminRequest(`/admin/results?${q}`);
}

async function updateProfile(data) {
  return request('/users/me/profile', {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

async function signOut() {
  try {
    await request('/auth/logout', { method: 'POST' });
  } catch {}
  clearToken();
}

async function requireUser() {
  return me();
}

async function adminSignIn(username, password) {
  const res = await fetch(`${API}/auth/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  let data = null;
  const text = await res.text();
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { detail: text };
    }
  }
  if (!res.ok) {
    const detail = data?.detail;
    throw new Error(typeof detail === 'string' ? detail : 'Ошибка входа');
  }
  setAdminToken(data.access_token);
  return data;
}

async function requireAdmin() {
  if (!getAdminToken()) return null;
  return { role: 'admin' };
}

function adminSignOut() {
  clearAdminToken();
}

window.api = {
  getToken,
  setToken,
  clearToken,
  getAdminToken,
  setAdminToken,
  clearAdminToken,
  me,
  updateNav,
  registerUser,
  signIn,
  confirmUser,
  resendCode,
  getProfile,
  getCategories,
  getLeaders,
  getIndicators,
  getResults,
  createResult,
  deleteResult,
  getAdminResults,
  updateProfile,
  signOut,
  requireUser,
  adminSignIn,
  requireAdmin,
  adminSignOut,
};
