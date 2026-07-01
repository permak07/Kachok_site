function profHistFmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function profHistStatusLbl(status) {
  if (status === 'approved') return 'подтверждён';
  if (status === 'pending') return 'на модерации';
  if (status === 'rejected') return 'отклонён';
  if (status === 'draft') return 'черновик';
  return '';
}

function profHistRender(list) {
  const box = document.getElementById('prof-hist-box');
  if (!box) return;

  if (!Array.isArray(list) || !list.length) {
    box.innerHTML = '<p class="prof-empty">Записей пока нет</p>';
    return;
  }

  const rows = [...list].sort(
    (a, b) => new Date(b.date || b.created_at) - new Date(a.date || a.created_at),
  );

  box.innerHTML = `<ul class="prof-rec__lst">${rows.map((r) => {
    const st = profHistStatusLbl(r.status);
    const note = st ? ` · ${st}` : '';
    return `<li class="prof-rec__itm">
      <span>${r.category_name || '—'} · ${profHistFmtDate(r.date || r.created_at)}${note}</span>
      <strong>${r.display || r.value}</strong>
    </li>`;
  }).join('')}</ul>`;
}

document.addEventListener('DOMContentLoaded', async () => {
  const user = await initProfShell();
  if (!user) return;

  const box = document.getElementById('prof-hist-box');
  if (box) box.innerHTML = '<p class="prof-empty">Загрузка…</p>';

  try {
    const list = await api.getResults();
    profHistRender(list);
  } catch {
    profHistRender([]);
  }
});
