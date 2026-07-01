const PROF_EMPTY = '—';

const PROF_STAT_CATS = [
  { slug: 'bench', label: 'Жим лёжа', plain: false },
  { slug: 'pullups', label: 'Подтягиваний', plain: true },
  { slug: 'complex', label: 'комплекс', plain: true },
];

const PROF_BADGE_ICO = {
  medal: 'icon-badge-medal.svg',
  record: 'icon-badge-record.svg',
  top: 'icon-badge-top.svg',
  streak: 'icon-badge-streak.svg',
  gym: 'icon-badge-gym.svg',
  crown: 'icon-badge-crown.svg',
};

function profName(username) {
  const [a, b] = username.split('_');
  if (!b) return username;
  return `${a.charAt(0).toUpperCase()}${a.slice(1)} ${b.charAt(0).toUpperCase()}.`;
}

function profMeta(profile) {
  const parts = [];
  if (profile.gym_name) parts.push(profile.gym_name);
  if (profile.city) parts.push(profile.city);
  if (profile.weight_class) parts.push(`Весовая ${profile.weight_class} кг`);
  return parts.join(' · ');
}

function profFmtDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
}

function profSetEmpty(el, text) {
  if (!el) return;
  el.innerHTML = `<p class="prof-empty">${text}</p>`;
}

function profRenderStats(records) {
  const grid = document.getElementById('prof-stats-grid');
  if (!grid) return;

  const map = {};
  if (Array.isArray(records)) {
    records.forEach((r) => {
      if (r.category_slug) map[r.category_slug] = r.display || String(r.value);
    });
  }

  grid.innerHTML = PROF_STAT_CATS.map((c) => {
    const val = map[c.slug] || PROF_EMPTY;
    const cls = c.plain ? ' class="prof-stat__plain"' : '';
    return `<article class="prof-stat">
      <strong${cls}>${val}</strong>
      <span>${c.label}</span>
    </article>`;
  }).join('');
}

function profRenderChart(stats) {
  const box = document.getElementById('prof-chart-box');
  if (!box) return;

  const bars = Array.isArray(stats?.bars) ? stats.bars : [];
  if (!bars.length) {
    profSetEmpty(box, 'Нет данных — добавь результат в упражнениях');
    return;
  }

  box.innerHTML = `<div class="prof-bars">${bars.map((h) => `<span style="height:${h}%"></span>`).join('')}</div>`;
}

function profRenderRecords(records) {
  const sec = document.getElementById('prof-rec-box');
  if (!sec) return;

  if (!Array.isArray(records) || !records.length) {
    profSetEmpty(sec, 'Пока пусто');
    return;
  }

  sec.innerHTML = `<ul class="prof-rec__lst">${records.map((r) => `
    <li class="prof-rec__itm">
      <span>${r.category_name || r.category_slug || '—'}</span>
      <strong>${r.display || r.value}</strong>
    </li>`).join('')}</ul>`;
}

function profRenderActivity(list) {
  const sec = document.getElementById('prof-act-box');
  if (!sec) return;

  const rows = Array.isArray(list)
    ? [...list].sort((a, b) => new Date(b.created_at || b.date) - new Date(a.created_at || a.date)).slice(0, 5)
    : [];

  if (!rows.length) {
    profSetEmpty(sec, 'Пока пусто');
    return;
  }

  sec.innerHTML = `<ul class="prof-act__lst">${rows.map((r) => `
    <li class="prof-act__itm">
      <div class="prof-act__txt">${r.category_name || '—'}: ${r.display || r.value}</div>
      <time class="prof-act__time">${profFmtDate(r.created_at || r.date)}</time>
    </li>`).join('')}</ul>`;
}

async function initProfile() {
  const user = await initProfShell();
  if (!user) return;

  let profile = user;
  try {
    profile = await api.getProfile();
  } catch {
    /* fallback: /auth/me */
  }

  const nameEl = document.getElementById('prof-name');
  if (nameEl) nameEl.textContent = profName(profile.username);

  const metaEl = document.getElementById('prof-meta');
  if (metaEl) metaEl.textContent = profMeta(profile) || PROF_EMPTY;

  const sinceEl = document.getElementById('prof-since');
  if (sinceEl && profile.created_at) {
    sinceEl.textContent = `Участник с ${new Date(profile.created_at).getFullYear()}`;
  }

  const [records, stats, activity] = await Promise.allSettled([
    api.getRecords(),
    api.getStats(null),
    api.getResults(),
  ]);

  profRenderStats(records.status === 'fulfilled' ? records.value : null);
  profRenderChart(stats.status === 'fulfilled' ? stats.value : null);
  profRenderRecords(records.status === 'fulfilled' ? records.value : null);
  profRenderActivity(activity.status === 'fulfilled' ? activity.value : null);
}

document.addEventListener('DOMContentLoaded', initProfile);
