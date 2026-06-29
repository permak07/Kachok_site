const IND_HIST_PREVIEW = 2;

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

function indCardHtml(id, highlight) {
  const c = IND_CARDS[id];
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
  return row ? row[1] : '';
}

function indBindHistModal(hist) {
  const dlg = document.getElementById('ind-hist-dlg');
  const openBtn = document.getElementById('ind-hist-more');
  const closeBtn = document.getElementById('ind-hist-close');
  if (!dlg || !openBtn) return;

  const list = dlg.querySelector('.ind-hist__lst');
  if (list) list.innerHTML = hist.map(indHistItemHtml).join('');

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
  dlg.addEventListener('click', (e) => {
    if (e.target === dlg) close();
  });
  document.addEventListener('keydown', (e) => {
    if (!dlg.hidden && e.key === 'Escape') close();
  });
}

function indRender(viewId) {
  const view = IND_VIEWS[viewId] || IND_VIEWS.all;
  const multi = view.cards.length > 1;
  const rank = indRankFromCmp(view.cmp);
  const histPreview = view.hist.slice(0, IND_HIST_PREVIEW);
  const hasMoreHist = view.hist.length > IND_HIST_PREVIEW;

  const nav = IND_NAV.map((item) => {
    const active = item.view === viewId ? ' is-active' : '';
    return `<a class="ind-filt__btn${active}" href="${item.file}">${indEsc(item.label)}</a>`;
  }).join('');

  const cards = view.cards.map((id) => indCardHtml(id, !multi)).join('');
  const bars = view.bars.map((h) => `<span style="height:${h}%"></span>`).join('');
  const cmp = view.cmp.map(([lbl, val]) => {
    const rankRow = /ранг/i.test(lbl) ? ' ind-cmp__itm--rank' : '';
    return `<li class="ind-cmp__itm${rankRow}"><span>${indEsc(lbl)}</span><strong>${indEsc(val)}</strong></li>`;
  }).join('');
  const hist = histPreview.map(indHistItemHtml).join('');
  const moreBtn = hasMoreHist
    ? `<button class="ind-hist__more" type="button" id="ind-hist-more">Подробнее</button>`
    : '';
  const histModal = hasMoreHist
    ? `<div class="ind-modal" id="ind-hist-dlg" role="dialog" aria-modal="true" aria-labelledby="ind-hist-dlg-ttl" hidden>
        <div class="ind-modal__back" aria-hidden="true"></div>
        <div class="ind-modal__box">
          <header class="ind-modal__head">
            <h2 class="ind-modal__ttl" id="ind-hist-dlg-ttl">История</h2>
            <button class="ind-modal__close" type="button" id="ind-hist-close" aria-label="Закрыть">&times;</button>
          </header>
          <ul class="ind-hist__lst ind-hist__lst--all"></ul>
        </div>
      </div>`
    : '';

  document.title = `${view.pageTitle} — Показатели — Качки в Иркутске`;

  document.getElementById('ind-root').innerHTML = `
      <header class="ind-head">
        <h1 class="ind-head__ttl">Твои <span class="ind-acc">показатели</span></h1>
        <p class="ind-head__sub">Отслеживай прогресс по ключевым упражнениям</p>
      </header>
      <nav class="ind-filt" aria-label="Фильтр упражнений">${nav}</nav>
      <div class="ind-cards${multi ? ' ind-cards--multi' : ''}">${cards}</div>
      <div class="ind-body">
        <section class="ind-chart">
          <h2 class="ind-sec-ttl">${indEsc(view.chartTitle)}</h2>
          <div class="ind-chart__box">
            <div class="ind-bars" aria-hidden="true">${bars}</div>
          </div>
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

  if (hasMoreHist) indBindHistModal(view.hist);
}

document.addEventListener('DOMContentLoaded', async () => {
  const user = await api.requireUser();
  if (!user) {
    location.href = '../login.html';
    return;
  }
  indRender(indViewId());
});
