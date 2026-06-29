function htmlDepth() {
  const chunk = location.pathname.split('/html/')[1] || '';
  return (chunk.match(/\//g) || []).length;
}

function partialsBase() {
  return `${'../'.repeat(htmlDepth() + 1)}partials/`;
}

function fixPartials(root) {
  const up = htmlDepth() ? '../'.repeat(htmlDepth()) : '';
  if (!up) return;

  root.querySelectorAll('a[href]').forEach((a) => {
    const href = a.getAttribute('href');
    if (!href || href.startsWith('#') || /^[a-z]+:/.test(href) || href.startsWith('../')) return;
    a.setAttribute('href', up + href);
  });

  root.querySelectorAll('img[src^="../images/"]').forEach((img) => {
    const file = img.getAttribute('src').slice('../images/'.length);
    img.setAttribute('src', `${up}../images/${file}`);
  });
}

async function loadPart(elId, fname) {
  const el = document.getElementById(elId);
  if (!el) return;

  const res = await fetch(`${partialsBase()}${fname}`);
  if (!res.ok) return;

  el.innerHTML = await res.text();
  fixPartials(el);
  if (elId === 'site-heder') initHed();
}

function initHed() {
  const burg = document.querySelector('.heder__burg');
  const clsBtn = document.querySelector('.heder__cls');
  const ovrl = document.querySelector('.heder__ovrl');
  if (!burg || !ovrl) return;

  const opn = () => {
    ovrl.classList.add('is-opn');
    ovrl.setAttribute('aria-hidden', 'false');
    burg.setAttribute('aria-expanded', 'true');
    burg.setAttribute('aria-label', 'Закрыть меню');
    document.body.classList.add('menu-opn');
  };

  const cls = () => {
    ovrl.classList.remove('is-opn');
    ovrl.setAttribute('aria-hidden', 'true');
    burg.setAttribute('aria-expanded', 'false');
    burg.setAttribute('aria-label', 'Открыть меню');
    document.body.classList.remove('menu-opn');
  };

  burg.addEventListener('click', opn);
  clsBtn?.addEventListener('click', cls);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && ovrl.classList.contains('is-opn')) cls();
  });
}

function markNav() {
  const pg = document.body.dataset.page;
  if (!pg) return;

  document.querySelectorAll('[data-nav]').forEach((lnk) => {
    lnk.classList.toggle('is-active', lnk.dataset.nav === pg);
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  await loadPart('site-heder', 'heder.html');
  await loadPart('site-futer', 'futer.html');
  await loadPart('site-mob-fut', 'mob-futer.html');
  await loadPart('hed-mob-fut', 'mob-futer.html');
  markNav();
  await api.updateNav();
});
