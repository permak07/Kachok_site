const IND_NAV = [
  { view: 'all', label: 'Все', file: 'indicators.html' },
  { view: 'bench', label: 'Жим', file: 'bench.html' },
  { view: 'pull', label: 'Подтягивания', file: 'pull.html' },
  { view: 'complex', label: 'комплекс', file: 'complex.html' },
  { view: 'ton', label: 'на тоннаж', file: 'ton.html' },
  { view: 'rep', label: 'на раз', file: 'rep.html' },
];

const IND_TITLE = {
  all: 'Показатели',
  bench: 'Жим',
  pull: 'Подтягивания',
  complex: 'Комплекс',
  ton: 'Тоннаж',
  rep: 'На раз',
};

function indViewId() {
  const file = location.pathname.split('/').pop().replace('.html', '');
  return file === 'indicators' ? 'all' : file;
}

function indRender(viewId) {
  const title = IND_TITLE[viewId] || IND_TITLE.all;
  const nav = IND_NAV.map((item) => {
    const active = item.view === viewId ? ' is-active' : '';
    return `<a class="ind-filt__btn${active}" href="${item.file}">${item.label}</a>`;
  }).join('');

  document.title = `${title} — Показатели — Качки в Иркутске`;

  document.getElementById('ind-root').innerHTML = `
    <header class="ind-head">
      <h1 class="ind-head__ttl">Твои <span class="ind-acc">показатели</span></h1>
      <p class="ind-head__sub">Отслеживай прогресс по ключевым упражнениям</p>
    </header>
    <nav class="ind-filt">${nav}</nav>
    <p class="ind-empty">Пока нет данных</p>
  `;
}

document.addEventListener('DOMContentLoaded', async () => {
  const user = await api.requireUser();
  if (!user) {
    location.href = '../login.html';
    return;
  }
  indRender(indViewId());
});
