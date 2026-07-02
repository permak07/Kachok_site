const ADM_NAV = [
  { id: 'overview', label: 'Обзор' },
  { id: 'results', label: 'Модерация' },
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
};

let admViewId = 'overview';
let admToastTimer = null;

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

function admToast(msg, isErr) {
  let el = document.getElementById('adm-toast');
  if (!el) {
    el = document.createElement('p');
    el.id = 'adm-toast';
    el.className = 'adm-toast';
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.classList.toggle('adm-toast--err', !!isErr);
  el.hidden = false;
  clearTimeout(admToastTimer);
  admToastTimer = setTimeout(() => { el.hidden = true; }, 4500);
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
        admToast('Результат одобрен');
        await admRender(admViewId);
      } catch (err) {
        admToast(err.message || 'Не удалось одобрить', true);
        if (/войди снова/i.test(err.message || '')) {
          setTimeout(() => { location.href = '../login-admin.html'; }, 1200);
        }
        btn.disabled = false;
      }
    };
  });

  document.querySelectorAll('[data-adm-no]').forEach((btn) => {
    btn.onclick = async () => {
      btn.disabled = true;
      try {
        await api.adminRejectResult(Number(btn.dataset.admNo));
        admToast('Результат отклонён');
        await admRender(admViewId);
      } catch (err) {
        admToast(err.message || 'Не удалось отклонить', true);
        if (/войди снова/i.test(err.message || '')) {
          setTimeout(() => { location.href = '../login-admin.html'; }, 1200);
        }
        btn.disabled = false;
      }
    };
  });
}

async function admLoadOverview() {
  const cards = [
    { lbl: 'Пользователи', val: '—' },
    { lbl: 'На модерации', val: '—' },
    { lbl: 'Категории', val: '—' },
  ];

  const o = await api.getAdminOverview();
  if (o.users != null) cards[0].val = String(o.users);
  if (o.pending != null) cards[1].val = String(o.pending);
  if (o.categories != null) cards[2].val = String(o.categories);
  return cards;
}

async function admRender(viewId) {
  admViewId = viewId;
  const v = ADM_VIEWS[viewId] || ADM_VIEWS.overview;

  admSetMain(`${admHeadHtml(v)}<p class="adm-empty">Загрузка…</p>`);

  document.querySelectorAll('.adm-side__btn').forEach((btn) => {
    btn.classList.toggle('is-active', btn.dataset.view === viewId);
  });

  try {
    if (viewId === 'overview') {
      const cards = await admLoadOverview();
      admSetMain(`${admHeadHtml(v)}${admOverviewHtml(cards)}`);
      return;
    }

    if (viewId === 'results') {
      const data = await api.getAdminResults('pending');
      const list = Array.isArray(data) ? data : [];
      admSetMain(`${admHeadHtml(v)}${admResultsHtml(list)}`);
      admBindResults(list);
    }
  } catch (err) {
    admToast(err.message || 'Ошибка загрузки', true);
    if (/войди снова/i.test(err.message || '')) {
      setTimeout(() => { location.href = '../login-admin.html'; }, 1200);
      return;
    }
    admSetMain(`${admHeadHtml(v)}<p class="adm-empty">${err.message || 'Не удалось загрузить данные'}</p>`);
  }
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
