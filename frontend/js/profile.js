function profName(username) {
  const [a, b] = username.split('_');
  if (!b) return username;
  return `${a.charAt(0).toUpperCase()}${a.slice(1)} ${b.charAt(0).toUpperCase()}.`;
}

function profMeta(profile) {
  const parts = [];
  if (profile.gym_name) parts.push(profile.gym_name);
  if (profile.city) parts.push(profile.city);
  if (profile.weight_class) parts.push(`Весовая ${profile.weight_class} кг`);
  return parts.join(' · ');
}

async function initProfile() {
  const user = await api.requireUser();
  if (!user) {
    location.href = 'login.html';
    return;
  }

  let profile = user;
  try {
    profile = await api.getProfile();
  } catch {
    /* fallback: данные из /auth/me */
  }

  const nameEl = document.getElementById('prof-name');
  if (nameEl) nameEl.textContent = profName(profile.username);

  const metaEl = document.getElementById('prof-meta');
  if (metaEl) metaEl.textContent = profMeta(profile) || '—';

  const sinceEl = document.getElementById('prof-since');
  if (sinceEl && profile.created_at) {
    sinceEl.textContent = `Участник с ${new Date(profile.created_at).getFullYear()}`;
  }
}

initProfile();

document.getElementById('prof-out')?.addEventListener('click', async () => {
  await api.signOut();
  location.href = 'index.html';
});
