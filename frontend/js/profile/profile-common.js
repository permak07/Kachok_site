async function initProfShell() {
  const user = await api.requireUser();
  if (!user) {
    location.href = '../login.html';
    return null;
  }

  const side = document.getElementById('prof-side');
  if (side && !side.dataset.ready) {
    const res = await fetch('../../partials/prof-side.html');
    if (res.ok) side.innerHTML = await res.text();
    side.dataset.ready = '1';

    const tab = document.body.dataset.profTab;
    document.querySelectorAll('.prof-side__lnk[data-tab]').forEach((lnk) => {
      lnk.classList.toggle('is-active', lnk.dataset.tab === tab);
    });

    document.getElementById('prof-out')?.addEventListener('click', async () => {
      await api.signOut();
      location.href = '../index.html';
    });
  }

  return user;
}
