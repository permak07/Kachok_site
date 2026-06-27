async function loadPart(elId, fname) {
  const el = document.getElementById(elId);
  if (!el) return;

  const res = await fetch(`../partials/${fname}`);
  if (!res.ok) return;

  el.innerHTML = await res.text();
  if (elId === 'site-heder') initHed();
}

function initHed() {
  const burg = document.querySelector('.heder__burg');
  const clsBtn = document.querySelector('.heder__cls');
  const ovrl = document.querySelector('.heder__ovrl');
  if (!burg || !ovrl) return;

  burg.addEventListener('click', () => {
    ovrl.hidden = false;
    document.body.classList.add('menu-opn');
  });

  clsBtn?.addEventListener('click', () => {
    ovrl.hidden = true;
    document.body.classList.remove('menu-opn');
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
});
