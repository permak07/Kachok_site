const ADM_NAV = [
  { id: 'overview', label: 'Обзор' },
  { id: 'results', label: 'Модерация' },
  { id: 'users', label: 'Пользователи' },
];

const ADM_VIEWS = {
  overview: {
    title: 'Обзор',
    sub: 'Сводка по платформе',
  },
  results: {
    title: 'Модерация результатов',
    sub: 'Одобрение записей атлетов',
    empty: 'Нет записей на модерации',
  },
  users: {
    title: 'Пользователи',
    sub: 'Список зарегистрированных атлетов',
    empty: 'Список пользователей пока недоступен',
  },
};

let admViewId = 'overview';

function admNavHtml(viewId) {
  return ADM_NAV.map((item) => {
    const active = item.id === viewId ? ' is-active' : '';
    return `<button class="adm-side__btn${active}" type="button" data-view="${item.id}">${item.label}</button>`;
  }).join('');
}

function admHeadHtml(v) {
  return `<header class="adm-head">
    <h1 class="adm-head__ttl">${v.title}</h1>
    <p class="adm-head__sub">${v.sub}</p>
  </header>`;
}

function admOverviewHtml(cards) {
  const items = cards.map((c) => `
    <article class="adm-card">
      <span class="adm-card__lbl">${c.lbl}</span>
      <strong class="adm-card__val">${c.val}</strong>
    </article>`).join('');
  return `<div class="adm-cards">${items}</div>`;
}

function admResultsHtml(list) {
  if (!list.length) return '<p class="adm-empty">Нет записей на модерации</p>';
  const rows = list.map((r) => `
    <li class="adm-res">
      <div class="adm-res__info">
        <strong>${r.display_name || r.username || '—'}</strong>
        <span>${r.category_name || r.category_slug || ''}</span>
        ${r.note ? `<span class="adm-res__note">${r.note}</span>` : ''}
      </div>
      <strong class="adm-res__val">${r.display || r.value}</strong>
      <div class="adm-res__acts">
        <button class="adm-btn adm-btn--ok" type="button" data-adm-ok="${r.id}">Одобрить</button>
        <button class="adm-btn adm-btn--no" type="button" data-adm-no="${r.id}">Отклонить</button>
      </div>
    </li>`).join('');
  return `<ul class="adm-res-lst">${rows}</ul>`;
}

function admSetMain(html) {
  document.getElementById('adm-main').innerHTML = html;
}

function admBindResults(list) {
  document.querySelectorAll('[data-adm-ok]').forEach((btn) => {
    btn.onclick = async () => {
      btn.disabled = true;
      try {
        await api.adminApproveResult(Number(btn.dataset.admOk));
        await admRender(admViewId);
      } catch (err) {
        alert(err.message || 'Не удалось одобрить');
        btn.disabled = false;
      }
    };
  });

  document.querySelectorAll('[data-adm-no]').forEach((btn) => {
    btn.onclick = async () => {
      btn.disabled = true;
      try {
        await api.adminRejectResult(Number(btn.dataset.admNo));
        await admRender(admViewId);
      } catch (err) {
        alert(err.message || 'Не удалось отклонить');
        btn.disabled = false;
      }
    };
  });

  if (!list.length) return;
}

async function admLoadOverview() {
  const cards = [
    { lbl: 'Пользователи', val: '—' },
    { lbl: 'На модерации', val: '—' },
    { lbl: 'Категории', val: '—' },
  ];

  try {
    const o = await api.getAdminOverview();
    if (o.users != null) cards[0].val = String(o.users);
    if (o.pending != null) cards[1].val = String(o.pending);
    if (o.categories != null) cards[2].val = String(o.categories);
    return cards;
  } catch {
    const tasks = await Promise.allSettled([
      api.getAdminResults('pending'),
      api.getCategories(),
    ]);
    if (tasks[0].status === 'fulfilled') {
      const list = Array.isArray(tasks[0].value) ? tasks[0].value : [];
      cards[1].val = String(list.length);
    }
    if (tasks[1].status === 'fulfilled') {
      cards[2].val = String(tasks[1].value.length);
    }
    return cards;
  }
}

async function admRender(viewId) {
  admViewId = viewId;
  const v = ADM_VIEWS[viewId] || ADM_VIEWS.overview;

  admSetMain(`${admHeadHtml(v)}<p class="adm-empty">Загрузка…</p>`);

  document.querySelectorAll('.adm-side__btn').forEach((btn) => {
    btn.classList.toggle('is-active', btn.dataset.view === viewId);
  });

  if (viewId === 'overview') {
    const cards = await admLoadOverview();
    admSetMain(`${admHeadHtml(v)}${admOverviewHtml(cards)}`);
    return;
  }

  if (viewId === 'results') {
    let list = [];
    try {
      const data = await api.getAdminResults('pending');
      list = Array.isArray(data) ? data : [];
    } catch {
      list = [];
    }
    admSetMain(`${admHeadHtml(v)}${admResultsHtml(list)}`);
    admBindResults(list);
    return;
  }

  admSetMain(`${admHeadHtml(v)}<p class="adm-empty">${v.empty}</p>`);
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
    if (btn) admRender(btn.dataset.view);
  });
  admRender('overview');

  document.getElementById('adm-out')?.addEventListener('click', () => {
    api.adminSignOut();
    location.href = '../login-admin.html';
  });
});
