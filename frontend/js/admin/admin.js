const ADM_NAV = [
  { id: 'overview', label: 'Обзор' },
  { id: 'results', label: 'Модерация' },
  { id: 'users', label: 'Пользователи' },
];

const ADM_VIEWS = {
  overview: {
    title: 'Обзор',
    sub: 'Сводка по платформе',
    cards: [
      { lbl: 'Пользователи', val: '—' },
      { lbl: 'На модерации', val: '—' },
      { lbl: 'Категории', val: '—' },
    ],
  },
  results: {
    title: 'Модерация результатов',
    sub: 'Одобрение записей атлетов',
    empty: 'Пока пусто',
  },
  users: {
    title: 'Пользователи',
    sub: 'Список зарегистрированных атлетов',
    empty: 'Пока пусто',
  },
};

function admNavHtml(viewId) {
  return ADM_NAV.map((item) => {
    const active = item.id === viewId ? ' is-active' : '';
    return `<button class="adm-side__btn${active}" type="button" data-view="${item.id}">${item.label}</button>`;
  }).join('');
}

function admOverviewHtml(v) {
  const cards = v.cards.map((c) => `
    <article class="adm-card">
      <span class="adm-card__lbl">${c.lbl}</span>
      <strong class="adm-card__val">${c.val}</strong>
    </article>`).join('');
  return `<div class="adm-cards">${cards}</div>`;
}

function admResultsHtml(list) {
  if (!list.length) return '<p class="adm-empty">Пока пусто</p>';
  const rows = list.map((r) => `
    <li class="adm-res">
      <span>${r.display_name || r.username || '—'}</span>
      <strong>${r.display || r.value}</strong>
      <span>${r.category_name || r.category || ''}</span>
    </li>`).join('');
  return `<ul class="adm-res-lst">${rows}</ul>`;
}

async function admRender(viewId) {
  const v = ADM_VIEWS[viewId] || ADM_VIEWS.overview;
  let body = viewId === 'overview'
    ? admOverviewHtml(v)
    : `<p class="adm-empty">Загрузка…</p>`;

  document.getElementById('adm-main').innerHTML = `
    <header class="adm-head">
      <h1 class="adm-head__ttl">${v.title}</h1>
      <p class="adm-head__sub">${v.sub}</p>
    </header>
    ${body}
  `;

  document.querySelectorAll('.adm-side__btn').forEach((btn) => {
    btn.classList.toggle('is-active', btn.dataset.view === viewId);
  });

  if (viewId === 'results') {
    try {
      const data = await api.getAdminResults('pending');
      const list = data.results || data.items || data || [];
      body = admResultsHtml(Array.isArray(list) ? list : []);
    } catch {
      body = `<p class="adm-empty">${v.empty}</p>`;
    }
    document.getElementById('adm-main').innerHTML = `
      <header class="adm-head">
        <h1 class="adm-head__ttl">${v.title}</h1>
        <p class="adm-head__sub">${v.sub}</p>
      </header>
      ${body}
    `;
  }

  if (viewId === 'overview') {
    try {
      const cats = await api.getCategories();
      const val = document.querySelector('.adm-card:nth-child(3) .adm-card__val');
      if (val && cats?.length) val.textContent = String(cats.length);
    } catch {}
  }
}

function admRenderSync(viewId) {
  admRender(viewId);
}

document.addEventListener('DOMContentLoaded', async () => {
  const admin = await api.requireAdmin();
  if (!admin) {
    location.href = '../login-admin.html';
    return;
  }

  document.getElementById('adm-nav').innerHTML = admNavHtml('overview');
  document.getElementById('adm-nav').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-view]');
    if (btn) admRenderSync(btn.dataset.view);
  });
  admRenderSync('overview');

  document.getElementById('adm-out')?.addEventListener('click', () => {
    api.adminSignOut();
    location.href = '../login-admin.html';
  });
});
