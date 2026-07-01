const LDR_NAV = [
  { view: 'all', label: 'Все', file: 'leaders.html' },
  { view: 'bench', label: 'Жим', file: 'bench.html' },
  { view: 'pull', label: 'Подтягивания', file: 'pull.html' },
  { view: 'complex', label: 'комплекс', file: 'complex.html' },
  { view: 'ton', label: 'на тоннаж', file: 'ton.html' },
  { view: 'rep', label: 'на раз', file: 'rep.html' },
];

const LDR_SLUG = {
  all: 'bench',
  bench: 'bench',
  pull: 'pullups',
  complex: 'complex',
  ton: 'tonnage',
  rep: 'one_rep',
};

const LDR_TITLE = {
  all: 'Лидеры',
  bench: 'Жим',
  pull: 'Подтягивания',
  complex: 'Комплекс',
  ton: 'Тоннаж',
  rep: 'На раз',
};

const LDR_MEDAL = { 1: '🥇', 2: '🥈', 3: '🥉' };

function ldrViewId() {
  const file = location.pathname.split('/').pop().replace('.html', '');
  return file === 'leaders' ? 'all' : file;
}

function ldrPodiumOrder(list) {
  const map = {};
  list.forEach((p) => { map[p.rank] = p; });
  return [map[2], map[1], map[3]].filter(Boolean);
}

function ldrPodiumCard(p) {
  const place = p.rank === 1 ? ' ldr-pod__card--1' : p.rank === 2 ? ' ldr-pod__card--2' : ' ldr-pod__card--3';
  const gym = p.gym_name || '—';
  const wc = p.weight_class ? `${p.weight_class} кг` : '—';
  return `<article class="ldr-pod__card${place}">
    <span class="ldr-pod__med">${LDR_MEDAL[p.rank] || p.rank}</span>
    <strong class="ldr-pod__name">${p.display_name}</strong>
    <span class="ldr-pod__gym">${gym}</span>
    <span class="ldr-pod__wc">${wc}</span>
    <span class="ldr-pod__val">${p.display}</span>
  </article>`;
}

function ldrTableRow(row, meId) {
  const mine = meId && row.user_id === meId ? ' ldr-tbl__row--me' : '';
  const gym = row.gym_name || '—';
  const wc = row.weight_class ? `${row.weight_class} кг` : '—';
  return `<tr class="ldr-tbl__row${mine}">
    <td class="ldr-tbl__rank">${row.rank}</td>
    <td class="ldr-tbl__name">${row.display_name}</td>
    <td class="ldr-tbl__gym">${gym}</td>
    <td class="ldr-tbl__wc">${wc}</td>
    <td class="ldr-tbl__val">${row.display}</td>
  </tr>`;
}

function ldrNavHtml(viewId) {
  return LDR_NAV.map((item) => {
    const active = item.view === viewId ? ' is-active' : '';
    return `<a class="ldr-filt__btn${active}" href="${item.file}">${item.label}</a>`;
  }).join('');
}

function ldrShowMsg(text, viewId) {
  const nav = viewId ? `<nav class="ldr-filt">${ldrNavHtml(viewId)}</nav>` : '';
  document.getElementById('ldr-root').innerHTML = `
    <header class="ldr-head">
      <h1 class="ldr-head__ttl">Топ <span class="ldr-acc">атлетов</span></h1>
    </header>
    ${nav}
    <p class="ldr-msg">${text}</p>
  `;
}

function ldrErrText(err) {
  const msg = err?.message || '';
  if (msg && msg !== 'Not Found' && msg !== 'Failed to fetch') return msg;
  return 'Не загрузилось';
}

async function ldrRender(viewId) {
  const slug = LDR_SLUG[viewId] || 'bench';
  const title = LDR_TITLE[viewId] || 'Лидеры';
  const root = document.getElementById('ldr-root');

  root.innerHTML = `
    <header class="ldr-head">
      <h1 class="ldr-head__ttl">Топ <span class="ldr-acc">атлетов</span></h1>
      <p class="ldr-head__sub">Загрузка…</p>
    </header>
    <nav class="ldr-filt">${ldrNavHtml(viewId)}</nav>
    <p class="ldr-msg">Загрузка…</p>
  `;

  let data;
  let me = null;
  try {
    [data, me] = await Promise.all([api.getLeaders(slug), api.me()]);
  } catch (e) {
    ldrShowMsg(ldrErrText(e), viewId);
    return;
  }

  document.title = `${title} — Лидеры — Качки в Иркутске`;

  const meId = data.current_user?.user_id ?? me?.id ?? null;
  const sub = viewId === 'all'
    ? `Сейчас — ${data.category.name.toLowerCase()}`
    : `Рейтинг: ${data.category.name.toLowerCase()}`;

  const podium = data.podium.length
    ? `<div class="ldr-pod">${ldrPodiumOrder(data.podium).map(ldrPodiumCard).join('')}</div>`
    : '';

  const table = data.table.length
    ? `<div class="ldr-tbl-wrap">
        <table class="ldr-tbl">
          <thead>
            <tr>
              <th>#</th>
              <th>Атлет</th>
              <th>Зал</th>
              <th>Вес</th>
              <th>Результат</th>
            </tr>
          </thead>
          <tbody>${data.table.map((r) => ldrTableRow(r, meId)).join('')}</tbody>
        </table>
      </div>`
    : '';

  const empty = !data.podium.length && !data.table.length
    ? '<p class="ldr-msg">Пока никого в таблице</p>'
    : '';

  root.innerHTML = `
    <header class="ldr-head">
      <h1 class="ldr-head__ttl">Топ <span class="ldr-acc">атлетов</span></h1>
      <p class="ldr-head__sub">${sub}</p>
    </header>
    <nav class="ldr-filt">${ldrNavHtml(viewId)}</nav>
    ${podium}
    ${table}
    ${empty}
  `;
}

document.addEventListener('DOMContentLoaded', () => {
  ldrRender(ldrViewId());
});
