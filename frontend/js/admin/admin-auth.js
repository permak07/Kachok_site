function showAdminErr(form, msg) {
  let el = form.querySelector('.auth__err');
  if (!el) {
    el = document.createElement('p');
    el.className = 'auth__err';
    form.querySelector('.auth__btn')?.before(el);
  }
  el.textContent = msg;
  el.hidden = !msg;
}

document.querySelectorAll('.auth__eye').forEach((btn) => {
  btn.addEventListener('click', () => {
    const input = btn.closest('.auth__in-wrap')?.querySelector('input');
    if (!input) return;
    input.type = input.type === 'password' ? 'text' : 'password';
  });
});

document.addEventListener('DOMContentLoaded', async () => {
  if (await api.requireAdmin()) {
    location.href = 'admin/admin.html';
    return;
  }

  const form = document.querySelector('.auth__form--admin');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    showAdminErr(form, '');
    const login = form.login.value.trim();
    const password = form.password.value;
    try {
      await api.adminSignIn(login, password);
      location.href = 'admin/admin.html';
    } catch (err) {
      showAdminErr(form, err.message);
    }
  });
});
