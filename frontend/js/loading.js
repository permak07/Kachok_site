const LOAD_MS = 2200;
const LOAD_TO = 'index.html';

const fill = document.getElementById('load-fill');
const pct = document.getElementById('load-pct');
const start = performance.now();

function loadTick(now) {
  const t = Math.min((now - start) / LOAD_MS, 1);
  const n = Math.round(t * 100);
  fill.style.width = `${n}%`;
  pct.textContent = `%${n}`;
  if (t < 1) {
    requestAnimationFrame(loadTick);
    return;
  }
  sessionStorage.setItem('kachok_seen', '1');
  location.replace(LOAD_TO);
}

requestAnimationFrame(loadTick);
