function showErr(form, msg) {
  let el = form.querySelector('.auth__err');
  if (!el) {
    el = document.createElement('p');
    el.className = 'auth__err';
    form.querySelector('.auth__btn')?.before(el);
  }
  el.textContent = msg;
  el.hidden = !msg;
}

function showCnfErr(msg) {
  const box = document.querySelector('.cnf__box');
  if (!box) return;
  let el = box.querySelector('.auth__err');
  if (!el) {
    el = document.createElement('p');
    el.className = 'auth__err';
    box.prepend(el);
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

async function doLogin(form) {
  showErr(form, '');
  try {
    await api.signIn(form.email.value.trim(), form.password.value);
    location.href = 'profile.html';
  } catch (e) {
    showErr(form, e.message);
  }
}

document.getElementById('login-go')?.addEventListener('click', () => {
  const form = document.querySelector('.auth__form--login');
  if (form) doLogin(form);
});

document.querySelector('.auth__form--login')?.addEventListener('submit', (e) => {
  e.preventDefault();
  doLogin(e.target);
});

document.querySelector('.auth__form--reg')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = e.target;
  showErr(form, '');

  if (form.password.value !== form.password_confirm.value) {
    showErr(form, 'Пароли не совпадают');
    return;
  }

  const email = form.email.value.trim();
  try {
    await api.registerUser(
      form.first_name.value,
      form.last_name.value,
      email,
      form.password.value,
    );
    location.href = `confirm-email.html?email=${encodeURIComponent(email)}`;
  } catch (err) {
    showErr(form, err.message);
  }
});

document.getElementById('cnf-resend')?.addEventListener('click', async () => {
  const email = new URLSearchParams(location.search).get('email');
  if (!email) {
    showCnfErr('Email не указан. Вернитесь к регистрации.');
    return;
  }
  showCnfErr('');
  try {
    await api.resendCode(email);
    showCnfErr('Код отправлен повторно');
  } catch (e) {
    showCnfErr(e.message);
  }
});

document.getElementById('cnf-ok')?.addEventListener('click', async () => {
  const email = new URLSearchParams(location.search).get('email');
  const code = document.getElementById('cnf-code')?.value.trim();

  if (!email) {
    alert('Email не указан. Вернитесь к регистрации.');
    return;
  }
  if (!code) {
    alert('Введите код');
    return;
  }

  showCnfErr('');
  try {
    await api.confirmUser(email, code);
    location.href = 'login.html';
  } catch (e) {
    showCnfErr(e.message);
  }
});
