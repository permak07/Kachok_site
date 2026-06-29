function showSetMsg(text, isErr) {
  const el = document.getElementById('set-msg');
  if (!el) return;
  el.textContent = text;
  el.hidden = !text;
  el.classList.toggle('is-err', !!isErr);
}

async function initSettings() {
  const user = await initProfShell();
  if (!user) return;

  try {
    const profile = await api.getProfile();
    const form = document.getElementById('prof-set-form');
    if (!form) return;
    if (profile.gym_name) form.gym_name.value = profile.gym_name;
    if (profile.city) form.city.value = profile.city;
    if (profile.weight_class) form.weight_class.value = profile.weight_class;
  } catch (e) {
    showSetMsg(e.message, true);
  }
}

document.addEventListener('DOMContentLoaded', initSettings);

document.getElementById('prof-set-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = e.target;
  showSetMsg('');

  const weight = form.weight_class.value.trim();
  const data = {
    gym_name: form.gym_name.value.trim(),
    city: form.city.value.trim(),
  };
  if (weight) data.weight_class = Number(weight);

  try {
    await api.updateProfile(data);
    showSetMsg('Сохранено');
    setTimeout(() => { location.href = 'profile.html'; }, 600);
  } catch (err) {
    showSetMsg(err.message, true);
  }
});
