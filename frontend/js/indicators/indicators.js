const IND_NAV = [
  { view: 'all', label: 'Все', file: 'indicators.html' },
  { view: 'bench', label: 'Жим', file: 'bench.html' },
  { view: 'pull', label: 'Подтягивания', file: 'pull.html' },
  { view: 'complex', label: 'комплекс', file: 'complex.html' },
  { view: 'ton', label: 'на тоннаж', file: 'ton.html' },
  { view: 'rep', label: 'на раз', file: 'rep.html' },
];

const IND_CAT = {
  bench: 'bench',
  pull: 'pullups',
  complex: 'complex',
  ton: 'tonnage',
  rep: 'one_rep',
};

const IND_LABELS = {
  bench: 'Жим лёжа',
  pull: 'Подтягивания',
  complex: 'Комплекс',
  ton: 'Тоннаж',
  rep: 'Жим на раз',
};

const IND_CMP = {
  all: [
    ['Твой жим', '—'],
    ['Средний по залу', '—'],
    ['Топ-10 Иркутска', '—'],
    ['Твой ранг', '—'],
  ],
  bench: [
    ['Твой жим', '—'],
    ['Средний по залу', '—'],
    ['Топ-10 Иркутска', '—'],
    ['Твой ранг', '—'],
  ],
  pull: [
    ['Твой результат', '—'],
    ['Средний по залу', '—'],
    ['Топ-10 Иркутска', '—'],
    ['Твой ранг', '—'],
  ],
  complex: [
    ['Твоё время', '—'],
    ['Средний по залу', '—'],
    ['Топ-10 Иркутска', '—'],
    ['Твой ранг', '—'],
  ],
  ton: [
    ['Твой тоннаж', '—'],
    ['Средний по залу', '—'],
    ['Топ-10 Иркутска', '—'],
    ['Твой ранг', '—'],
  ],
  rep: [
    ['Твой максимум', '—'],
    ['Средний по залу', '—'],
    ['Топ-10 Иркутска', '—'],
    ['Твой ранг', '—'],
  ],
};

const IND_CHART = {
  all: 'Динамика показателей',
  bench: 'Динамика жима — 6 месяцев',
  pull: 'Динамика подтягиваний — 6 месяцев',
  complex: 'Динамика комплекса — 6 месяцев',
  ton: 'Динамика тоннажа — 6 месяцев',
  rep: 'Динамика жима на раз — 6 месяцев',
};

const IND_HIST_PREVIEW = 2;
let indCards = {};

function indViewId() {
  const file = location.pathname.split('/').pop().replace('.html', '');
  return file === 'indicators' ? 'all' : file;
}

function indEsc(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function indShell(viewId) {
  const cards = viewId === 'all' ? ['bench', 'pull', 'complex'] : [viewId];
  indCards = {};
  cards.forEach((id) => {
    indCards[id] = { lbl: IND_LABELS[id], val: '—', delta: '—', acc: false };
  });
  return {
    pageTitle: viewId === 'all' ? 'Показатели' : IND_LABELS[viewId],
    cards,
    chartTitle: IND_CHART[viewId] || IND_CHART.all,
    bars: [],
    cmp: (IND_CMP[viewId] || IND_CMP.all).map(([a, b]) => [a, b]),
    hist: [],
  };
}

function indApplyApi(data, shell) {
  if (!data || typeof data !== 'object') return shell;
  if (data.cards && typeof data.cards === 'object') {
    Object.keys(data.cards).forEach((id) => {
      if (IND_LABELS[id]) indCards[id] = { ...indCards[id], ...data.cards[id] };
    });
  }
  return {
    pageTitle: data.pageTitle || shell.pageTitle,
    cards: data.cardIds || data.cardsList || shell.cards,
    chartTitle: data.chartTitle || shell.chartTitle,
    bars: Array.isArray(data.bars) ? data.bars : shell.bars,
    cmp: Array.isArray(data.cmp) && data.cmp.length ? data.cmp : shell.cmp,
    hist: Array.isArray(data.hist) ? data.hist : shell.hist,
  };
}

async function indLoadView(viewId) {
  const shell = indShell(viewId);
  try {
    await api.loadCategories();
    let categoryId = null;
    if (viewId !== 'all') {
      categoryId = api.categoryId(IND_CAT[viewId]);
      if (!categoryId) return shell;
    }
    const data = await api.getStats(categoryId);
    return indApplyApi(data, shell);
  } catch {
    return shell;
  }
}

function indShowLoading(viewId) {
  const nav = IND_NAV.map((item) => {
    const active = item.view === viewId ? ' is-active' : '';
    return `<a class="ind-filt__btn${active}" href="${item.file}">${indEsc(item.label)}</a>`;
  }).join('');
  document.getElementById('ind-root').innerHTML = `
    <header class="ind-head">
      <h1 class="ind-head__ttl">Твои <span class="ind-acc">показатели</span></h1>
      <p class="ind-head__sub">Отслеживай прогресс по ключевым упражнениям</p>
    </header>
    <nav class="ind-filt">${nav}</nav>
    <p class="ind-empty">Загрузка…</p>
  `;
}

function indCardHtml(id, highlight) {
  const c = indCards[id];
  if (!c) return '';
  const acc = highlight || c.acc ? ' ind-card__val--acc' : '';
  const deltaCls = c.deltaDown ? ' ind-card__delta--down' : '';
  return `<article class="ind-card">
    <span class="ind-card__lbl">${indEsc(c.lbl)}</span>
    <strong class="ind-card__val${acc}">${indEsc(c.val)}</strong>
    <span class="ind-card__delta${deltaCls}">${indEsc(c.delta)}</span>
  </article>`;
}

function indHistItemHtml(row) {
  return `<li class="ind-hist__itm">
    <div class="ind-hist__info">
      <span class="ind-hist__name">${indEsc(row.name)}</span>
      <time class="ind-hist__date" datetime="${row.date}">${indEsc(row.dateLbl)}</time>
    </div>
    <strong class="ind-hist__val">${indEsc(row.val)}</strong>
  </li>`;
}

function indRankFromCmp(cmp) {
  const row = cmp.find(([lbl]) => /ранг/i.test(lbl));
  const val = row ? row[1] : '';
  return val && val !== '—' ? val : '';
}

function indBindHistModal(hist) {
  const dlg = document.getElementById('ind-hist-dlg');
  const openBtn = document.getElementById('ind-hist-more');
  const closeBtn = document.getElementById('ind-hist-close');
  if (!dlg || !openBtn) return;

  dlg.querySelector('.ind-hist__lst').innerHTML = hist.map(indHistItemHtml).join('');

  const open = () => {
    dlg.hidden = false;
    document.body.classList.add('ind-modal-opn');
    closeBtn?.focus();
  };
  const close = () => {
    dlg.hidden = true;
    document.body.classList.remove('ind-modal-opn');
    openBtn.focus();
  };

  openBtn.addEventListener('click', open);
  closeBtn?.addEventListener('click', close);
  dlg.querySelector('.ind-modal__back')?.addEventListener('click', close);
  document.addEventListener('keydown', (e) => {
    if (!dlg.hidden && e.key === 'Escape') close();
  });
}

function indRender(viewId, view) {
  const v = view;
  const multi = v.cards.length > 1;
  const rank = indRankFromCmp(v.cmp);
  const histPreview = v.hist.slice(0, IND_HIST_PREVIEW);
  const hasMoreHist = v.hist.length > IND_HIST_PREVIEW;

  const nav = IND_NAV.map((item) => {
    const active = item.view === viewId ? ' is-active' : '';
    return `<a class="ind-filt__btn${active}" href="${item.file}">${indEsc(item.label)}</a>`;
  }).join('');

  const cards = v.cards.map((id) => indCardHtml(id, !multi)).join('');
  const bars = v.bars.length
    ? v.bars.map((h) => `<span style="height:${h}%"></span>`).join('')
    : '';
  const chartBody = bars
    ? `<div class="ind-bars">${bars}</div>`
    : '<p class="ind-empty">Нет данных для графика</p>';
  const cmp = v.cmp.map(([lbl, val]) => {
    const rankRow = /ранг/i.test(lbl) ? ' ind-cmp__itm--rank' : '';
    return `<li class="ind-cmp__itm${rankRow}"><span>${indEsc(lbl)}</span><strong>${indEsc(val)}</strong></li>`;
  }).join('');
  const hist = histPreview.length
    ? histPreview.map(indHistItemHtml).join('')
    : '<li class="ind-empty">Пока нет записей</li>';
  const moreBtn = hasMoreHist
    ? '<button class="ind-hist__more" type="button" id="ind-hist-more">Подробнее</button>'
    : '';
  const histModal = hasMoreHist
    ? `<div class="ind-modal" id="ind-hist-dlg" hidden>
        <div class="ind-modal__back"></div>
        <div class="ind-modal__box">
          <header class="ind-modal__head">
            <h2 class="ind-modal__ttl">История</h2>
            <button class="ind-modal__close" type="button" id="ind-hist-close">&times;</button>
          </header>
          <ul class="ind-hist__lst ind-hist__lst--all"></ul>
        </div>
      </div>`
    : '';

  document.title = `${v.pageTitle} — Показатели — Качки в Иркутске`;

  document.getElementById('ind-root').innerHTML = `
    <header class="ind-head">
      <h1 class="ind-head__ttl">Твои <span class="ind-acc">показатели</span></h1>
      <p class="ind-head__sub">Отслеживай прогресс по ключевым упражнениям</p>
    </header>
    <nav class="ind-filt">${nav}</nav>
    <div class="ind-cards${multi ? ' ind-cards--multi' : ''}">${cards}</div>
    <div class="ind-body">
      <section class="ind-chart">
        <h2 class="ind-sec-ttl">${indEsc(v.chartTitle)}</h2>
        <div class="ind-chart__box">${chartBody}</div>
      </section>
      <aside class="ind-aside">
        <div class="ind-aside-top">
          ${rank ? `<div class="ind-rank"><p class="ind-sec-ttl">ранг</p><strong>${indEsc(rank)}</strong></div>` : ''}
          <section class="ind-cmp">
            <h2 class="ind-sec-ttl">Сравнение со средним</h2>
            <ul class="ind-cmp__lst">${cmp}</ul>
          </section>
        </div>
        <section class="ind-hist">
          <h2 class="ind-sec-ttl">История</h2>
          <ul class="ind-hist__lst">${hist}</ul>
          ${moreBtn}
        </section>
      </aside>
    </div>
    ${histModal}
  `;

  if (hasMoreHist) indBindHistModal(v.hist);
}

document.addEventListener('DOMContentLoaded', async () => {
  const user = await api.requireUser();
  if (!user) {
    location.href = '../login.html';
    return;
  }
  const viewId = indViewId();
  indShowLoading(viewId);
  const view = await indLoadView(viewId);
  indRender(viewId, view);
});
