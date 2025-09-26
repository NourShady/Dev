/* Light-mode iOS-like PWA app script
   Features:
   - scheduleData: timetable
   - closest upcoming lecture detection (closest in future)
   - per-lecture attendance (checkboxes) saved in localStorage
   - attendance counter displayed in header and timetable view
   - notes: add/edit/delete, saved in localStorage
   - PWA install prompt handling
*/

const scheduleData = [

  { id: "sat-2", day: 6, time: "10:00", title: "Math 1 — Dr. Samira El-Mougy", room: "T304" },
  { id: "sat-3", day: 6, time: "12:00", title: "CS1001 — Structured Programming", room: "L401" },
  { id: "sat-4", day: 6, time: "14:00", title: "UN1001 — English for CS", room: "H302" },

  { id: "sun-1", day: 0, time: "10:00", title: "UN1001 — English for CS — Dr. Heba Kandeel", room: "T304" },
  { id: "sun-2", day: 0, time: "14:00", title: "IT1001 — Electronics", room: "H406" },

  { id: "mon-1", day: 1, time: "10:00", title: "IT1001 — IT & Electronics — Dr. Yasser Gaballah", room: "H404" },
  { id: "mon-2", day: 1, time: "12:00", title: "FC1001 — Computer Basics", room: "L401" },

  { id: "tue-1", day: 2, time: "08:00", title: "MT1001 — Math 1 Section — Eng. Mahmoud El-Sayed", room: "H403" },
  { id: "tue-2", day: 2, time: "10:00", title: "CS1001 — Structured Programming — Dr. Ahmed Al-Sayed", room: "T304" },

  { id: "thu-1", day: 4, time: "12:00", title: "UN1003 — Human Rights & Anti-Corruption — Dr. Hatem El-Bakry", room: "T304" }
];

const storage = {
  get(k, fallback) { try { return JSON.parse(localStorage.getItem(k)) ?? fallback } catch (e) { return fallback } },
  set(k, v) { localStorage.setItem(k, JSON.stringify(v)) }
};

let attendance = storage.get('attendance', {});
let notes = storage.get('notes', []);

// Render timetable as cards/rows suitable for iPhone
function renderTimetable() {
  const container = document.getElementById('timetableContainer');
  container.innerHTML = '';
  const daysOrder = [6, 0, 1, 2, 3, 4, 5];
  daysOrder.forEach(day => {
    const rows = scheduleData.filter(s => s.day === day);
    if (rows.length === 0) return;
    const row = document.createElement('div'); row.className = 'row';
    const dayCell = document.createElement('div'); dayCell.className = 'cell day';
    dayCell.textContent = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][day];
    row.appendChild(dayCell);
    for (let i = 0; i < 4; i++) {
      const slot = document.createElement('div'); slot.className = 'cell slot';
      const slotTime = ['08:00', '10:00', '12:00', '14:00'][i];
      const found = rows.filter(r => r.time === slotTime);
      if (found.length) {
        found.forEach(f => {
          const div = document.createElement('div');
          div.innerHTML = `<div class="course">📜 ${escapeHtml(f.title)}</div>
          <div class="meta">⏱ ${f.time}</div>
                           <div class="meta">📌 ${f.room}</div>
                           <div class="attend"><label>🎯<input type="checkbox" data-id="${f.id}" ${attendance[f.id] ? 'checked' : ''}/> Attended</label></div>`;
          slot.appendChild(div);
        });
      } else {
        slot.innerHTML = `<div class="meta">—</div>`;
      }
      row.appendChild(slot);
    }
    container.appendChild(row);
  });

  document.querySelectorAll('.attend input[type="checkbox"]').forEach(cb => {
    cb.addEventListener('change', e => {
      const id = e.target.dataset.id;
      attendance[id] = e.target.checked;
      storage.set('attendance', attendance);
      updateAttendanceCount();
      renderNextCard(); // update next highlight
    });
  });
}

function escapeHtml(s) { return (s + '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }

function updateAttendanceCount() {
  const count = Object.values(attendance).filter(v => v).length;
  document.getElementById('attendedCount').textContent = count;
  document.getElementById('attendedCount2').textContent = count;
  storage.set('attendance', attendance);
}

// find closest upcoming lecture (in minutes)
function getNextLecture() {
  const now = new Date();
  const today = now.getDay();
  const cm = now.getHours() * 60 + now.getMinutes();
  let next = null; let min = Infinity;
  for (const cls of scheduleData) {
    let dayDiff = cls.day - today;
    if (dayDiff < 0) dayDiff += 7;
    const [h, m] = cls.time.split(':').map(Number);
    const clsMin = h * 60 + m + dayDiff * 1440;
    const diff = clsMin - cm;
    if (diff >= 0 && diff < min) {
      min = diff; next = cls;
    }
  }
  return next;
}

function renderNextCard() {
  const next = getNextLecture();
  const titleEl = document.getElementById('nextTitle');
  const metaEl = document.getElementById('nextMeta');
  const attendBtn = document.getElementById('attendBtn');
  if (!next) {
    titleEl.textContent = 'No upcoming lectures 🎉';
    metaEl.textContent = 'You are free for now.';
    attendBtn.style.display = 'none';
    document.querySelectorAll('.slot').forEach(s => s.classList.remove('highlight'));
    return;
  }
  titleEl.textContent = next.title;
  metaEl.textContent = `${next.time} • ${['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][next.day]} • ${next.room}`;
  attendBtn.style.display = 'inline-block';
  attendBtn.disabled = !!attendance[next.id];
  attendBtn.textContent = attendance[next.id] ? '✔ Attended' : 'Mark Attended';

  document.querySelectorAll('.slot').forEach(s => s.classList.remove('highlight'));
  const cb = document.querySelector(`input[type="checkbox"][data-id="${next.id}"]`);
  if (cb) {
    const el = cb.closest('.slot');
    if (el) { el.classList.add('highlight'); el.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
  }
}

function markNextAttended() {
  const next = getNextLecture();
  if (!next) return;
  attendance[next.id] = true;
  storage.set('attendance', attendance);
  updateAttendanceCount();
  renderTimetable();
  renderNextCard();
}

// Notes
function renderNotes() {
  const list = document.getElementById('notesList'); list.innerHTML = '';
  notes = storage.get('notes', []);
  if (!notes.length) { list.innerHTML = '<div class="meta">No notes yet</div>'; return; }
  notes.slice().reverse().forEach((n, idx) => {
    const div = document.createElement('div'); div.className = 'note-item';
    div.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:start">
      <strong>${escapeHtml(n.title)}</strong>
      <div style="display:flex;gap:8px">
        <button data-i="${idx}" class="btn ghost small edit">Edit</button>
        <button data-i="${idx}" class="btn ghost small del">Delete</button>
      </div></div>
      <div class="meta">${escapeHtml(n.body)}</div>`;
    list.appendChild(div);
  });
  document.querySelectorAll('.note-item .del').forEach(b => b.addEventListener('click', e => {
    const i = Number(e.target.dataset.i);
    const revIndex = notes.length - 1 - i;
    notes.splice(revIndex, 1);
    storage.set('notes', notes);
    renderNotes();
  }));
  document.querySelectorAll('.note-item .edit').forEach(b => b.addEventListener('click', e => {
    const i = Number(e.target.dataset.i);
    const revIndex = notes.length - 1 - i;
    const n = notes[revIndex];
    document.getElementById('noteTitle').value = n.title;
    document.getElementById('noteBody').value = n.body;
    notes.splice(revIndex, 1);
    storage.set('notes', notes);
    renderNotes();
  }));
}

document.addEventListener('DOMContentLoaded', () => {
  renderTimetable();
  updateAttendanceCount();
  renderNextCard();
  renderNotes();

  setInterval(() => { renderNextCard(); }, 30_000);

  document.getElementById('attendBtn').addEventListener('click', () => markNextAttended());

  document.getElementById('noteForm').addEventListener('submit', e => {
    e.preventDefault();
    const t = document.getElementById('noteTitle').value.trim();
    const b = document.getElementById('noteBody').value.trim();
    if (!t || !b) return;
    notes.push({ title: t, body: b, created: Date.now() });
    storage.set('notes', notes);
    document.getElementById('noteForm').reset();
    renderNotes();
  });

  document.getElementById('clearNotes').addEventListener('click', () => {
    if (confirm('Clear all notes?')) { notes = []; storage.set('notes', notes); renderNotes(); }
  });

  // fab -> open notes tab and focus
  document.getElementById('fabAdd').addEventListener('click', () => {
    activateTab('notes');
    document.getElementById('noteTitle').focus();
  });

  // segmented control
  document.querySelectorAll('.seg-btn').forEach(b => b.addEventListener('click', e => {
    document.querySelectorAll('.seg-btn').forEach(x => x.classList.remove('active'));
    e.target.classList.add('active');
    activateTab(e.target.dataset.tab);
    document.querySelectorAll('.seg-btn').forEach(x => x.classList.remove('hidden'));
  }));

  function activateTab(name) {
    document.querySelectorAll('[data-tab]').forEach(el => el.classList.add('hidden'));
    document.querySelectorAll(`[data-tab="${name}"]`).forEach(el => el.classList.remove('hidden'));
  }

  // PWA install prompt
  let deferredPrompt = null;
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    document.getElementById('installPrompt').style.display = 'flex';
  });
  document.getElementById('installBtn').addEventListener('click', async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    deferredPrompt = null;
    document.getElementById('installPrompt').style.display = 'none';
  });
  document.getElementById('dismissInstall').addEventListener('click', () => {
    document.getElementById('installPrompt').style.display = 'none';
  });

  document.getElementById('open-settings').addEventListener('click', () => {
    alert('Settings coming soon!');
  });
});
