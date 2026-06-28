// один файл для всех запросов к бэку,
//  хранения JWT в localStorage и переключения «Войти»/«Профиль» в шапке.

const API = 'http://localhost:8000';
const TOKEN_KEY = 'access_token';

function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
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

async function signOut() {
  try {
    await request('/auth/logout', { method: 'POST' });
  } catch {
    /* JWT без blacklist — выход на клиенте */
  }
  clearToken();
}

async function requireUser() {
  return me();
}

window.api = {
  getToken,
  setToken,
  clearToken,
  me,
  updateNav,
  registerUser,
  signIn,
  confirmUser,
  signOut,
  requireUser,
};
