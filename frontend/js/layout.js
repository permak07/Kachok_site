function getBase() {
  const scr = document.querySelector('script[src*="layout.js"]');
  if (!scr) return new URL('../', window.location.href).href.replace(/\/$/, '');

  const scrUrl = new URL(scr.src, window.location.href);
  return scrUrl.href.replace(/\/js\/layout\.js$/, '');
}

function path(p) {
  return new URL(p, `${getBase()}/`).href;
}

function loadCss(href, id) {
  if (document.getElementById(id)) return;

  const lnk = document.createElement('link');
  lnk.rel = 'stylesheet';
  lnk.href = href;
  lnk.id = id;
  document.head.appendChild(lnk);
}

async function loadPart(elId, fname) {
  const el = document.getElementById(elId);
  if (!el) return;

  const res = await fetch(path(`partials/${fname}`));
  if (!res.ok) {
    console.error(`не загрузилось ${fname}, нужен локальный сервер`);
    return;
  }

  el.innerHTML = await res.text();

  if (elId === 'site-heder') {
    initHed();
  }

  markNav();
}

function initHed() {
  const burg = document.querySelector('.heder__burg');
  const clsBtn = document.querySelector('.heder__cls');
  const ovrl = document.querySelector('.heder__ovrl');

  if (!burg || !ovrl) return;

  const opn = () => {
    ovrl.hidden = false;
    document.body.classList.add('menu-opn');
    burg.setAttribute('aria-expanded', 'true');
  };

  const cls = () => {
    ovrl.hidden = true;
    document.body.classList.remove('menu-opn');
    burg.setAttribute('aria-expanded', 'false');
  };

  burg.addEventListener('click', opn);
  clsBtn?.addEventListener('click', cls);

  ovrl.addEventListener('click', (e) => {
    if (e.target === ovrl) cls();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') cls();
  });
}

function markNav() {
  const pg = document.body.dataset.page;
  if (!pg) return;

  document.querySelectorAll('[data-nav]').forEach((lnk) => {
    lnk.classList.toggle('is-active', lnk.dataset.nav === pg);
  });
}

function fixImgs() {
  document.querySelectorAll('#site-heder img, #site-futer img').forEach((img) => {
    const src = img.getAttribute('src');
    if (!src) return;

    const clean = src.replace(/^\.\.\//, '').split('?')[0];
    img.src = `${path(clean)}?v=2`;
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  loadCss(path('css/base.css'), 'base-css');
  loadCss(path('partials/heder.css'), 'hed-css');
  loadCss(path('partials/futer.css'), 'fut-css');

  await loadPart('site-heder', 'heder.html');
  await loadPart('site-futer', 'futer.html');

  fixImgs();
});
