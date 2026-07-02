const API = (() => {
  const meta = document.querySelector('meta[name="api-base"]');
  const fromMeta = meta?.getAttribute('content')?.trim();
  if (fromMeta) return fromMeta.replace(/\/$/, '');
  const host = location.hostname;
  const isLocal = !host
    || host === 'localhost'
    || host === '127.0.0.1'
    || host === '0.0.0.0'
    || host === '[::1]';
  if (isLocal) return 'http://127.0.0.1:8000';
  return '';
})();

function isHtmlBody(text) {
  return typeof text === 'string' && /^\s*</.test(text);
}

function apiErrorMessage(res, data, text) {
  const detail = data?.detail;
  if (typeof detail === 'string' && detail && !isHtmlBody(detail)) return detail;
  if (Array.isArray(detail) && detail.length) return 'Проверь введённые данные';

  if (res.status === 401) return 'Неверный email или пароль';
  if (res.status === 403) return 'Доступ запрещён';
  if (res.status === 404) return 'Сервис не найден';
  if (res.status === 422) return 'Проверь введённые данные';
  if (res.status === 501) return 'Сервер не настроен. Запусти бэкенд на порту 8000.';
  if (res.status >= 500) return 'Ошибка на сервере. Попробуй позже.';
  if (isHtmlBody(text)) return 'Не удалось связаться с сервером. Проверь, что бэкенд запущен.';
  if (typeof text === 'string' && text.trim() && !data?.detail) return text.trim();
  return 'Не удалось выполнить запрос. Попробуй позже.';
}
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

  let res;
  try {
    res = await fetch(`${API}${path}`, { ...options, headers });
  } catch {
    throw new Error('Не удалось связаться с сервером. Проверь, что бэкенд запущен.');
  }

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
    throw new Error(apiErrorMessage(res, data, text));
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

let categoriesBySlug = null;

async function loadCategories() {
  if (categoriesBySlug) return categoriesBySlug;
  const list = await getCategories();
  categoriesBySlug = {};
  list.forEach((c) => {
    categoriesBySlug[c.slug] = c.id;
  });
  return categoriesBySlug;
}

function categoryId(slug) {
  return categoriesBySlug?.[slug] ?? null;
}

async function getLeaders(category) {
  const q = new URLSearchParams({ category });
  return request(`/leaders?${q}`);
}

async function getStats(categoryId) {
  const q = categoryId != null ? `?category_id=${categoryId}` : '';
  return request(`/users/me/stats${q}`);
}

async function getRecords() {
  return request('/users/me/records');
}

async function getAchievements() {
  return request('/users/me/achievements');
}

async function getActivity(limit = 10) {
  const q = new URLSearchParams({ limit: String(limit) });
  return request(`/users/me/activity?${q}`);
}

async function getResults(categoryId) {
  const q = categoryId != null ? `?category_id=${categoryId}` : '';
  return request(`/users/me/results${q}`);
}

async function createResult(body) {
  return request('/users/me/results', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

async function publishResult(id) {
  return request(`/users/me/results/${id}/publish`, { method: 'POST' });
}

async function updateResult(id, body) {
  return request(`/users/me/results/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

async function deleteResult(id) {
  await request(`/users/me/results/${id}`, { method: 'DELETE' });
}

async function adminRequest(path, options = {}) {
  const headers = { ...options.headers };
  if (options.body && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }
  const token = getAdminToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(`${API}${path}`, { ...options, headers });
  } catch {
    throw new Error('Не удалось связаться с сервером. Проверь, что бэкенд запущен.');
  }

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
    if (res.status === 401) {
      clearAdminToken();
      throw new Error('Сессия администратора истекла. Войди снова через форму входа.');
    }
    throw new Error(apiErrorMessage(res, data, text));
  }
  return data;
}

async function getAdminOverview() {
  return adminRequest('/admin/overview');
}

async function getAdminResults(status = 'pending') {
  const q = new URLSearchParams({ status });
  return adminRequest(`/admin/results?${q}`);
}

async function adminApproveResult(id) {
  return adminRequest(`/admin/results/${id}/approve`, { method: 'POST' });
}

async function adminRejectResult(id) {
  return adminRequest(`/admin/results/${id}/reject`, { method: 'POST' });
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
  let res;
  try {
    res = await fetch(`${API}/auth/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
  } catch {
    throw new Error('Не удалось связаться с сервером. Проверь, что бэкенд запущен.');
  }
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
    throw new Error(apiErrorMessage(res, data, text));
  }
  setAdminToken(data.access_token);
  return data;
}

async function requireAdmin() {
  if (!getAdminToken()) return null;
  try {
    await getAdminOverview();
    return { role: 'admin' };
  } catch {
    clearAdminToken();
    return null;
  }
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
  loadCategories,
  categoryId,
  getLeaders,
  getStats,
  getRecords,
  getAchievements,
  getActivity,
  getResults,
  createResult,
  publishResult,
  updateResult,
  deleteResult,
  getAdminOverview,
  getAdminResults,
  adminApproveResult,
  adminRejectResult,
  updateProfile,
  signOut,
  requireUser,
  adminSignIn,
  requireAdmin,
  adminSignOut,
};
