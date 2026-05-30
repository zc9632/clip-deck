'use strict';

const listEl = document.getElementById('list');
const emptyEl = document.getElementById('empty');
const searchEl = document.getElementById('search');
const counterEl = document.getElementById('counter');
const clearBtn = document.getElementById('clear');
const quitBtn = document.getElementById('quit');

let items = [];
let filtered = [];
let selection = 0;
let query = '';

function fmtTime(ts) {
  const d = new Date(ts);
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function tagText(t) {
  switch (t) {
    case 'text': return 'TXT';
    case 'richText': return 'RTF';
    case 'image': return 'IMG';
    case 'files': return 'FILE';
  }
  return '?';
}

function previewLine(it) {
  const raw = it.preview ?? '';
  return raw.replace(/\n/g, ' ↵ ');
}

function applyFilter() {
  const q = query.trim().toLowerCase();
  filtered = q
    ? items.filter((it) => (it.preview || '').toLowerCase().includes(q))
    : items.slice();
  if (selection >= filtered.length) selection = Math.max(0, filtered.length - 1);
}

function render() {
  applyFilter();
  counterEl.textContent = `${filtered.length}/${items.length}`;

  if (filtered.length === 0) {
    listEl.innerHTML = '';
    emptyEl.classList.add('visible');
    return;
  }
  emptyEl.classList.remove('visible');

  const html = filtered
    .map((it, i) => {
      const isSel = i === selection;
      const tag = tagText(it.type);
      const thumb =
        it.type === 'image' && it.thumbnail
          ? `<div class="thumb image"><img src="${it.thumbnail}" alt="" /></div>`
          : `<div class="thumb ${it.type === 'image' ? 'image-icon' : it.type}">${tag.slice(0, 1)}</div>`;
      const idxStr = i < 9 ? String(i + 1) : '·';
      return `
        <div class="row ${isSel ? 'selected' : ''}" data-id="${it.id}" data-i="${i}">
          <div class="idx">${idxStr}</div>
          ${thumb}
          <div class="body">
            <div class="meta">
              <span class="tag ${it.type}">${tag}</span>
              <span>${fmtTime(it.ts)}</span>
            </div>
            <div class="preview">${escapeHtml(previewLine(it))}</div>
          </div>
        </div>`;
    })
    .join('');
  listEl.innerHTML = html;

  const selRow = listEl.querySelector('.row.selected');
  if (selRow) selRow.scrollIntoView({ block: 'nearest' });
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function commit(index) {
  const it = filtered[index];
  if (!it) return;
  window.cb.select(it.id);
}

// ---------- events ----------

window.cb.onItems((next) => {
  items = next || [];
  render();
});

window.cb.getItems().then((it) => {
  items = it || [];
  selection = 0;
  render();
  searchEl.focus();
});

searchEl.addEventListener('input', () => {
  query = searchEl.value;
  selection = 0;
  render();
});

document.addEventListener('keydown', (e) => {
  // Cmd+Q quits the app entirely.
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'q') {
    e.preventDefault();
    window.cb.quit();
    return;
  }
  // Cmd+1..9 quick select
  if ((e.metaKey || e.ctrlKey) && /^[1-9]$/.test(e.key)) {
    e.preventDefault();
    const idx = parseInt(e.key, 10) - 1;
    if (filtered[idx]) commit(idx);
    return;
  }
  switch (e.key) {
    case 'Escape':
      e.preventDefault();
      window.cb.close();
      return;
    case 'Enter':
      e.preventDefault();
      commit(selection);
      return;
    case 'ArrowDown':
      e.preventDefault();
      if (filtered.length) {
        selection = Math.min(selection + 1, filtered.length - 1);
        render();
      }
      return;
    case 'ArrowUp':
      e.preventDefault();
      if (filtered.length) {
        selection = Math.max(selection - 1, 0);
        render();
      }
      return;
  }
});

listEl.addEventListener('click', (e) => {
  const row = e.target.closest('.row');
  if (!row) return;
  const i = parseInt(row.dataset.i, 10);
  if (isNaN(i)) return;
  selection = i;
  render();
});

listEl.addEventListener('dblclick', (e) => {
  const row = e.target.closest('.row');
  if (!row) return;
  const i = parseInt(row.dataset.i, 10);
  if (!isNaN(i)) commit(i);
});

clearBtn.addEventListener('click', () => {
  window.cb.clear();
  searchEl.focus();
});

quitBtn.addEventListener('click', () => {
  window.cb.quit();
});

// Re-focus search when window becomes visible
window.addEventListener('focus', () => {
  searchEl.focus();
  searchEl.select();
});
