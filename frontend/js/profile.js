//  проверяет, что пользователь залогинен, показывает юзернаме 
// и почту, по «выйти» вызывает api.signOut() и уводит на главную

async function initProfile() {
  const user = await api.requireUser();
  if (!user) {
    location.href = 'login.html';
    return;
  }

  const info = document.getElementById('prof-info');
  if (info) info.textContent = `${user.username} · ${user.email}`;
}

initProfile();

document.getElementById('prof-out')?.addEventListener('click', async () => {
  await api.signOut();
  location.href = 'index.html';
});
