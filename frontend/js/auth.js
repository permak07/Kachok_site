function goProfile() {
  window.location.href = 'profile.html';
}

document.querySelectorAll('.auth__eye').forEach((btn) => {
  btn.addEventListener('click', () => {
    const input = btn.closest('.auth__in-wrap')?.querySelector('input');
    if (!input) return;
    input.type = input.type === 'password' ? 'text' : 'password';
  });
});

document.getElementById('login-go')?.addEventListener('click', goProfile);

document.querySelector('.auth__form--login')?.addEventListener('submit', (e) => {
  e.preventDefault();
  goProfile();
});

document.querySelector('.auth__form--reg')?.addEventListener('submit', (e) => {
  e.preventDefault();
  const email = e.target.email.value.trim() || 'test@mail.com';
  window.location.href = `confirm-email.html?email=${encodeURIComponent(email)}`;
});
