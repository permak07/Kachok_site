function profName(username) {
  const [a, b] = username.split('_');
  if (!b) return username;
  return `${a.charAt(0).toUpperCase()}${a.slice(1)} ${b.charAt(0).toUpperCase()}.`;
}

async function initProfile() {
  // const user = await api.requireUser();
  // if (!user) {
  //   location.href = 'login.html';
  //   return;
  // }
  const user = { username: 'georgiy_v' };
  const el = document.getElementById('prof-name');
  if (el) el.textContent = profName(user.username);
}

initProfile();

document.getElementById('prof-out')?.addEventListener('click', async () => {
  await api.signOut();
  location.href = 'index.html';
});
