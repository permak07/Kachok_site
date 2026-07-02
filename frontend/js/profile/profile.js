const PROF_EMPTY = '—';

const PROF_STAT_CATS = [
  { slug: 'bench', label: 'Жим лёжа', plain: false },
  { slug: 'pullups', label: 'Подтягиваний', plain: true },
  { slug: 'complex', label: 'комплекс', plain: true },
  { slug: 'one_rep', label: 'Жим на раз', plain: false },
  { slug: 'tonnage', label: 'Тоннаж', plain: false },
];

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

function profSetEmpty(el, text) {
  if (!el) return;
  el.innerHTML = `<p class="prof-empty">${text}</p>`;
}

function profRenderStats(cards) {
  const grid = document.getElementById('prof-stats-grid');
  if (!grid) return;

  const map = cards && typeof cards === 'object' ? cards : {};

  grid.innerHTML = PROF_STAT_CATS.map((c) => {
    const card = map[c.slug];
    const val = card?.val || PROF_EMPTY;
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

  if (!Array.isArray(list) || !list.length) {
    profSetEmpty(sec, 'Пока пусто');
    return;
  }

  sec.innerHTML = `<ul class="prof-act__lst">${list.map((r) => `
    <li class="prof-act__itm">
      <div class="prof-act__txt">${r.title || '—'}</div>
      <time class="prof-act__time">${r.dateLbl || r.date || ''}</time>
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

  await api.loadCategories();
  const benchId = api.categoryId('bench');

  const [statsRes, chartRes, recordsRes, activityRes] = await Promise.allSettled([
    api.getStats(null),
    benchId != null ? api.getStats(benchId) : Promise.resolve(null),
    api.getRecords(),
    api.getActivity(5),
  ]);

  const stats = statsRes.status === 'fulfilled' ? statsRes.value : null;
  const chartStats = chartRes.status === 'fulfilled' ? chartRes.value : null;
  profRenderStats(stats?.cards);
  profRenderChart(chartStats);
  profRenderRecords(recordsRes.status === 'fulfilled' ? recordsRes.value : null);
  profRenderActivity(activityRes.status === 'fulfilled' ? activityRes.value : null);
}

document.addEventListener('DOMContentLoaded', initProfile);
