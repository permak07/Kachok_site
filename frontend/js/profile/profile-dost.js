const PROF_BADGE_ICO = {
  medal: 'icon-badge-medal.svg',
  record: 'icon-badge-record.svg',
  top: 'icon-badge-top.svg',
  streak: 'icon-badge-streak.svg',
  gym: 'icon-badge-gym.svg',
  crown: 'icon-badge-crown.svg',
};

function profBadgeHtml(b) {
  const ico = PROF_BADGE_ICO[b.icon] || 'icon-badge-medal.svg';
  const on = b.unlocked ? ' prof-badge--on' : '';
  return `<article class="prof-badge${on}">
    <img class="prof-badge__ico" src="../../images/${ico}" alt="">
    <h3 class="prof-badge__name">${b.name}</h3>
    <p class="prof-badge__desc">${b.desc}</p>
  </article>`;
}

function profBadgesRender(list) {
  const box = document.getElementById('prof-badges-box');
  if (!box) return;

  if (!Array.isArray(list) || !list.length) {
    box.innerHTML = '<p class="prof-empty">Достижения появятся после активности на платформе</p>';
    return;
  }

  box.innerHTML = list.map(profBadgeHtml).join('');
}

document.addEventListener('DOMContentLoaded', async () => {
  const user = await initProfShell();
  if (!user) return;

  const box = document.getElementById('prof-badges-box');
  if (box) box.innerHTML = '<p class="prof-empty">Загрузка…</p>';

  try {
    const list = await api.getAchievements();
    profBadgesRender(list);
  } catch {
    profBadgesRender([]);
  }
});
