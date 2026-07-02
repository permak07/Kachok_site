const EX_NAV = [
  { view: 'rep', label: 'на раз', file: 'upraznen.html' },
  { view: 'ton', label: 'на тоннаж', file: 'ton.html' },
  { view: 'complex', label: 'комплекс', file: 'complex.html' },
  { view: 'pull', label: 'подтягивания', file: 'pull.html' },
  { view: 'bench', label: 'Жим', file: 'bench.html' },
];

const EX_CAT = {
  rep: 'one_rep',
  bench: 'bench',
  pull: 'pullups',
  complex: 'complex',
  ton: 'tonnage',
};

const EX_VIEWS = {
  rep: {
    pageTitle: 'Упражнения',
    head: ['Твои', 'упражнения'],
    sub: '',
    cardTitle: 'Жим лёжа — на раз (1ПМ)',
    btnRec: 'записать свой результат',
  },
  bench: {
    pageTitle: 'Жим',
    head: ['Жим', 'лёжа'],
    sub: 'Макс. за подход · кг',
    cardTitle: 'Рабочие веса · на раз',
    btnRec: 'записать свой результат',
  },
  pull: {
    pageTitle: 'Подтягивания',
    head: ['Подтяги', 'вания'],
    sub: 'Макс. за подход · повторы',
    cardTitle: 'Уровни · повторы',
    cardHint: 'Запиши максимум за один подход без отдыха.',
    btnRec: 'записать свой результат',
  },
  complex: {
    pageTitle: 'Комплекс',
    head: ['Ком', 'плекс'],
    sub: 'Время прохождения · силовой комплекс',
    cardTitle: 'Жим + присед + становая',
    btnRec: 'записать свой результат',
  },
  ton: {
    pageTitle: 'Тоннаж',
    head: ['Заруба на', 'тоннаж'],
    sub: '10 минут · максимальный суммарный вес за подходы',
    cardTitle: 'Заруба на тоннаж',
    cardHint: 'Запиши суммарный тоннаж за 10 минут.',
    btnRec: 'записать свой результат',
  },
};

let exResults = [];
let exDelId = null;
let exLoadErr = '';

function exViewId() {
  const file = location.pathname.split('/').pop().replace('.html', '');
  return file === 'upraznen' ? 'rep' : file;
}

function exNavHtml(viewId) {
  return EX_NAV.map((item) => {
    const active = item.view === viewId ? ' is-active' : '';
    return `<a class="ex-filt__btn${active}" href="${item.file}">${item.label}</a>`;
  }).join('');
}

function exMapResult(r) {
  const status = String(r.status || '').toLowerCase();
  let st = 'pending';
  if (status === 'approved') st = 'ok';
  else if (status === 'draft') st = 'draft';
  else if (status === 'rejected') st = 'rejected';
  return {
    id: r.id,
    val: r.display || String(r.value),
    st,
    num: r.value,
  };
}

async function exFetchResults(viewId) {
  exLoadErr = '';
  await api.loadCategories();
  const id = api.categoryId(EX_CAT[viewId]);
  if (!id) {
    exLoadErr = 'Категория не найдена';
    return [];
  }
  const list = await api.getResults(id);
  return Array.isArray(list) ? list.map(exMapResult) : [];
}

function exNumVal(viewId, val) {
  if (viewId === 'complex') {
    const raw = String(val).trim();
    if (raw.includes(':')) {
      const [m, s] = raw.split(':').map((n) => parseInt(n, 10) || 0);
      return m * 60 + s;
    }
    return parseInt(raw, 10) || 0;
  }
  if (viewId === 'pull') return parseInt(String(val).replace(/\D/g, ''), 10) || 0;
  return parseFloat(String(val).replace(/[^\d.,]/g, '').replace(',', '.')) || 0;
}

function exFormatVal(viewId, raw) {
  const t = raw.trim();
  if (viewId === 'complex') return t;
  if (viewId === 'pull') return `${parseInt(t, 10) || t}`;
  const n = parseFloat(t.replace(',', '.'));
  if (!n || n <= 0) throw new Error('Введи положительное число');
  return `${n} кг`;
}

function exSortResults(viewId, results) {
  return [...results].sort((a, b) => {
    const na = a.num ?? exNumVal(viewId, a.val);
    const nb = b.num ?? exNumVal(viewId, b.val);
    return viewId === 'complex' ? nb - na : na - nb;
  });
}

async function exAddResult(viewId, raw, note) {
  await api.loadCategories();
  const categoryId = api.categoryId(EX_CAT[viewId]);
  if (!categoryId) throw new Error('Категория не найдена');
  const val = exFormatVal(viewId, raw);
  const value = exNumVal(viewId, raw);
  if (!value || value <= 0) throw new Error('Введи корректное значение');
  await api.createResult({
    category_id: categoryId,
    value,
    date: new Date().toISOString().slice(0, 19),
    note: note.trim() || null,
    publish: true,
  });
}

async function exRemoveResult(id) {
  await api.deleteResult(id);
}

function exStepIcon(st) {
  if (st === 'ok') return '✓';
  if (st === 'rejected') return '✕';
  if (st === 'draft') return '○';
  return '…';
}

function exLegendHtml() {
  return `<div class="ex-leg">
    <span class="ex-leg__it ex-leg__it--pend"><i></i> на модерации</span>
    <span class="ex-leg__it ex-leg__it--ok"><i></i> подтверждён</span>
    <span class="ex-leg__it ex-leg__it--rej"><i></i> отклонён</span>
  </div>`;
}

function exStepClass(st) {
  if (st === 'ok') return 'ex-step--ok';
  if (st === 'rejected') return 'ex-step--rej';
  if (st === 'draft') return 'ex-step--draft';
  return 'ex-step--pend';
}

function exStepsHtml(viewId, results) {
  if (exLoadErr) {
    return `<p class="ex-empty ex-empty--err">${exLoadErr}</p>`;
  }
  if (!results.length) {
    return '<p class="ex-empty">Пока нет результатов — запиши первый</p>';
  }

  return exSortResults(viewId, results)
    .map((r) => {
      const cls = exStepClass(r.st);
      return `<button class="ex-step ${cls}" type="button" data-ex-del="${r.id}" data-ex-val="${r.val}" data-ex-hint="удалить">${exStepIcon(r.st)} ${r.val}</button>`;
    })
    .join('');
}

function exRecField(viewId) {
  if (viewId === 'pull') {
    return { lbl: 'Повторы за подход', unit: 'раз', placeholder: '18', type: 'number' };
  }
  if (viewId === 'complex') {
    return { lbl: 'Время прохождения', unit: 'мм:сс', placeholder: '2:45', type: 'text' };
  }
  if (viewId === 'ton') {
    return { lbl: 'Суммарный тоннаж', unit: 'кг', placeholder: '3850', type: 'number' };
  }
  return { lbl: 'Результат', unit: 'кг', placeholder: '120', type: 'number' };
}

function exModalsHtml() {
  return `
    <div class="ex-modal" id="ex-rec-dlg" hidden>
      <div class="ex-modal__back" data-ex-close="rec"></div>
      <div class="ex-modal__box">
        <header class="ex-modal__head">
          <h2 class="ex-modal__ttl" id="ex-rec-ttl">Записать результат</h2>
          <button class="ex-modal__close" type="button" data-ex-close="rec">&times;</button>
        </header>
        <p class="ex-modal__sub" id="ex-rec-sub"></p>
        <form class="ex-modal__form" id="ex-rec-form">
          <label class="ex-modal__lbl" id="ex-rec-lbl" for="ex-rec-val">Результат</label>
          <div class="ex-modal__row">
            <input class="ex-modal__in" id="ex-rec-val" name="value" required>
            <span class="ex-modal__unit" id="ex-rec-unit">кг</span>
          </div>
          <label class="ex-modal__lbl" for="ex-rec-note">Заметка</label>
          <input class="ex-modal__in ex-modal__in--note" id="ex-rec-note" name="note" placeholder="необязательно">
          <label class="ex-modal__chk">
            <input type="checkbox" id="ex-rec-honest">
            <span>Подтверждаю — выполнил честно</span>
          </label>
          <p class="ex-modal__err" id="ex-rec-err" hidden></p>
          <p class="ex-modal__note">Результат уйдёт админу на проверку. Пока он оранжевый — на модерации.</p>
          <div class="ex-modal__acts">
            <button class="ex-modal__btn ex-modal__btn--sec" type="button" data-ex-close="rec">Отмена</button>
            <button class="ex-modal__btn ex-modal__btn--pri" type="submit" id="ex-rec-send" disabled>Отправить на модерацию</button>
          </div>
        </form>
      </div>
    </div>
    <div class="ex-modal" id="ex-del-dlg" hidden>
      <div class="ex-modal__back" data-ex-close="del"></div>
      <div class="ex-modal__box ex-modal__box--sm">
        <header class="ex-modal__head">
          <h2 class="ex-modal__ttl">Удалить результат?</h2>
          <button class="ex-modal__close" type="button" data-ex-close="del">&times;</button>
        </header>
        <p class="ex-modal__sub" id="ex-del-sub"></p>
        <div class="ex-modal__acts">
          <button class="ex-modal__btn ex-modal__btn--sec" type="button" data-ex-close="del">Отмена</button>
          <button class="ex-modal__btn ex-modal__btn--danger" type="button" id="ex-del-ok">Удалить</button>
        </div>
      </div>
    </div>`;
}

function exModalOpen(id) {
  document.getElementById(id).hidden = false;
  document.body.classList.add('ex-modal-opn');
}

function exModalClose(id) {
  document.getElementById(id).hidden = true;
  if (!document.querySelector('.ex-modal:not([hidden])')) {
    document.body.classList.remove('ex-modal-opn');
  }
}

function exEnsureModals() {
  if (document.getElementById('ex-del-dlg')) return;
  document.body.insertAdjacentHTML('beforeend', exModalsHtml());
}

function exBindModals(viewId, v) {
  exEnsureModals();

  const recDlg = document.getElementById('ex-rec-dlg');
  const delDlg = document.getElementById('ex-del-dlg');
  const recForm = document.getElementById('ex-rec-form');
  const recVal = document.getElementById('ex-rec-val');
  const recNote = document.getElementById('ex-rec-note');
  const recHonest = document.getElementById('ex-rec-honest');
  const recSend = document.getElementById('ex-rec-send');
  const recErr = document.getElementById('ex-rec-err');
  const field = exRecField(viewId);

  const showRecErr = (msg) => {
    if (!recErr) return;
    recErr.textContent = msg || '';
    recErr.hidden = !msg;
  };

  const openRec = () => {
    showRecErr('');
    document.getElementById('ex-rec-ttl').textContent = 'Записать результат';
    document.getElementById('ex-rec-sub').textContent = v.cardTitle || v.sub || v.head.join(' ');
    document.getElementById('ex-rec-lbl').textContent = field.lbl;
    document.getElementById('ex-rec-unit').textContent = field.unit;
    recVal.type = field.type;
    recVal.placeholder = field.placeholder;
    recVal.value = '';
    recNote.value = '';
    recHonest.checked = false;
    recSend.disabled = true;
    exModalOpen('ex-rec-dlg');
    recVal.focus();
  };

  const openDel = (id, val) => {
    exDelId = id;
    document.getElementById('ex-del-sub').textContent = `Результат ${val} будет удалён без восстановления.`;
    exModalOpen('ex-del-dlg');
  };

  document.querySelectorAll('[data-ex-open="rec"]').forEach((btn) => {
    btn.onclick = openRec;
  });

  recDlg.querySelectorAll('[data-ex-close="rec"]').forEach((el) => {
    el.onclick = () => exModalClose('ex-rec-dlg');
  });
  delDlg.querySelectorAll('[data-ex-close="del"]').forEach((el) => {
    el.onclick = () => {
      exDelId = null;
      exModalClose('ex-del-dlg');
    };
  });

  recHonest.onchange = () => {
    recSend.disabled = !recHonest.checked;
  };

  recForm.onsubmit = async (e) => {
    e.preventDefault();
    if (!recHonest.checked) return;
    recSend.disabled = true;
    showRecErr('');
    try {
      await exAddResult(viewId, recVal.value, recNote.value);
      exModalClose('ex-rec-dlg');
      await exRender(viewId);
    } catch (err) {
      showRecErr(err.message || 'Не удалось сохранить');
      recSend.disabled = !recHonest.checked;
    }
  };

  document.getElementById('ex-del-ok').onclick = async () => {
    if (!exDelId) return;
    try {
      await exRemoveResult(exDelId);
      exDelId = null;
      exModalClose('ex-del-dlg');
      await exRender(viewId);
    } catch (err) {
      alert(err.message || 'Не удалось удалить');
    }
  };

  document.querySelectorAll('[data-ex-del]').forEach((btn) => {
    btn.onclick = () => openDel(Number(btn.dataset.exDel), btn.dataset.exVal);
  });

  document.onkeydown = (e) => {
    if (e.key !== 'Escape') return;
    if (!recDlg.hidden) exModalClose('ex-rec-dlg');
    else if (!delDlg.hidden) {
      exDelId = null;
      exModalClose('ex-del-dlg');
    }
  };
}

function exActionsHtml(v) {
  return `<div class="ex-actions">
    <button class="ex-btn ex-btn--rec" type="button" data-ex-open="rec">${v.btnRec}</button>
  </div>`;
}

function exHeadHtml(v) {
  const acc = v.head[1] ? `<span class="ex-acc">${v.head[1]}</span>` : '';
  const sub = v.sub ? `<p class="ex-head__sub">${v.sub}</p>` : '';
  return `<header class="ex-head">
    <h1 class="ex-head__ttl">${v.head[0]}${acc}</h1>
    ${sub}
  </header>`;
}

function exRenderHtml(v, viewId, results) {
  const hint = v.cardHint ? `<p class="ex-card__hint">${v.cardHint}</p>` : '';
  return `
    ${exHeadHtml(v)}
    <nav class="ex-filt">${exNavHtml(viewId)}</nav>
    <div class="ex-body">
      <section class="ex-card">
        <h2 class="ex-card__ttl">${v.cardTitle}</h2>
        ${hint}
        ${exLegendHtml()}
        <div class="ex-steps">${exStepsHtml(viewId, results)}</div>
      </section>
      ${exActionsHtml(v)}
    </div>`;
}

async function exRender(viewId) {
  const v = EX_VIEWS[viewId] || EX_VIEWS.rep;
  document.title = `${v.pageTitle} — Упражнения — Качки в Иркутске`;
  document.getElementById('ex-root').innerHTML = exRenderHtml(v, viewId, []);
  document.querySelector('.ex-steps').innerHTML = '<p class="ex-empty">Загрузка…</p>';

  try {
    exResults = await exFetchResults(viewId);
  } catch (err) {
    exLoadErr = err.message || 'Не удалось загрузить';
    exResults = [];
  }

  document.getElementById('ex-root').innerHTML = exRenderHtml(v, viewId, exResults);
  exBindModals(viewId, v);
}

document.addEventListener('DOMContentLoaded', async () => {
  const user = await api.requireUser();
  if (!user) {
    location.href = '../login.html';
    return;
  }
  await exRender(exViewId());
});
