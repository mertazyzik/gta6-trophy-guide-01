// Leonida Trophy Atlas: checklist tracker + guide reader for GTA 6's 55 PS5 trophies.
// Progress lives in localStorage; export/import move it as a JSON file. No network
// is used at runtime: the only fetch is the app's own data/trophies.json.
const STORAGE_KEY = 'leonida-trophy-atlas-progress-v1';
const EXPORT_FILENAME = 'gta6-trophies-progress.json';

const KIND_FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'story', label: 'Story' },
  { id: 'missable', label: 'Missable' },
  { id: 'collectibles', label: 'Collectibles' },
  { id: 'activities', label: 'Activities' },
  { id: 'side-quests', label: 'Side Quests' },
  { id: 'online', label: 'Online' },
];

const ROADMAP_STAGES = [
  {
    title: 'Stage 1 — Story',
    hours: '~60–80 hours',
    points: [
      'Play the 5 chapters and the optional missions as they appear.',
      'Scan vehicles with the WAiNK app and study animals with binoculars as you travel.',
      'Do the Chapter 1 meditation on Jason’s house balcony with Lucia — the one trophy that may be missable.',
      'Progress counts toward the 100% checklist even before it is visible.',
    ],
  },
  {
    title: 'Stage 2 — 100% completion',
    hours: '~100 hours',
    points: [
      'After the story, chase the 100% checklist at Progress > Stats > 100% Completion.',
      'It needs everything of robberies, underwater discoveries, shooting ranges, drone races and Bret’s quests — but only parts of the rest: 200/277 base vehicles, 100/255 animals, 15/18 meditations, 300 stunts, 100 optional missions.',
      'Complete any 70 of the 80 Challenges along the way.',
    ],
  },
  {
    title: 'Stage 3 — Strangers & cleanup',
    hours: '~10 hours',
    points: [
      'Finish the 8 Strangers & Freaks strands that count (Kirk, Kyle, Yago, Pilot Pete and more being confirmed).',
      'Sweep up the remaining collectibles, stunts and activities.',
      'The platinum pops with the last trophy — no multiplayer or DLC needed.',
    ],
  },
];

const listEl = document.getElementById('trophyList');
const detailEl = document.getElementById('detail');
const progressText = document.getElementById('progressText');
const progressPct = document.getElementById('progressPct');
const progressFill = document.getElementById('progressFill');
const gradeCounts = document.getElementById('gradeCounts');
const emptyState = document.getElementById('emptyState');
const searchInput = document.getElementById('search');
const gradeSelect = document.getElementById('grade');
const spoilerToggle = document.getElementById('spoiler');
const kindChipsEl = document.getElementById('kindChips');

let trophies = [];
let earned = loadProgress();
let kindFilter = 'all';
let selectedId = null;

function loadProgress() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}');
    if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
      return new Set(Object.keys(raw).filter((k) => raw[k] === true).map(Number).filter((n) => Number.isInteger(n)));
    }
  } catch {
    // Corrupt save: start fresh rather than crash the page.
  }
  return new Set();
}

function saveProgress() {
  const obj = {};
  for (const id of [...earned].sort((a, b) => a - b)) obj[id] = true;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(obj));
}

function isSpoilerHidden(t) {
  return spoilerToggle.checked && t.kind === 'story' && !earned.has(t.id);
}

function visibleTrophies() {
  const q = searchInput.value.trim().toLowerCase();
  return trophies.filter((t) => {
    if (kindFilter === 'missable' && !t.missable) return false;
    if (kindFilter === 'online') return false;
    if (kindFilter !== 'all' && kindFilter !== 'missable' && t.kind !== kindFilter) return false;
    if (gradeSelect.value !== 'all' && t.grade !== gradeSelect.value) return false;
    if (q && !(t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q))) return false;
    return true;
  });
}

function tag(text, cls) {
  const span = document.createElement('span');
  span.className = 'tag ' + cls;
  span.textContent = text;
  return span;
}

function renderList() {
  const shown = visibleTrophies();
  listEl.replaceChildren();
  emptyState.hidden = shown.length > 0;
  if (kindFilter === 'online') {
    emptyState.textContent = 'No online trophies: GTA 6 has 0 online trophies, so this filter is empty by design — every trophy is earned solo.';
  } else if (shown.length === 0) {
    emptyState.textContent = 'No trophies match these filters. Clear the search or pick another kind.';
  }
  document.getElementById('listHeading').textContent =
    kindFilter === 'all' ? 'Trophy checklist' : `Trophy checklist — ${KIND_FILTERS.find((k) => k.id === kindFilter).label}`;
  for (const t of shown) {
    const li = document.createElement('li');
    const item = document.createElement('button');
    item.type = 'button';
    item.className = 'trophy-item' + (earned.has(t.id) ? ' earned' : '') + (selectedId === t.id ? ' selected' : '');
    const box = document.createElement('input');
    box.type = 'checkbox';
    box.checked = earned.has(t.id);
    box.setAttribute('aria-label', `Mark ${t.name} as earned`);
    box.addEventListener('click', (e) => e.stopPropagation());
    box.addEventListener('change', () => {
      if (box.checked) earned.add(t.id);
      else earned.delete(t.id);
      saveProgress();
      renderAll();
    });
    item.append(box);
    const main = document.createElement('div');
    main.className = 'trophy-main';
    const name = document.createElement('div');
    name.className = 'trophy-name';
    const desc = document.createElement('div');
    desc.className = 'trophy-desc';
    if (isSpoilerHidden(t)) {
      name.textContent = 'Hidden story trophy — earn it to reveal';
      desc.textContent = 'Story spoiler hidden until earned. Uncheck “Hide story spoilers” to reveal it.';
    } else {
      name.textContent = t.name;
      desc.textContent = t.description;
    }
    main.append(name, desc);
    const tags = document.createElement('div');
    tags.className = 'trophy-tags';
    tags.append(tag(t.grade, t.grade));
    if (t.kind !== t.grade) tags.append(tag(t.kind, ''));
    if (t.missable) tags.append(tag('⚠ Missable', 'missable'));
    if (t.hidden) tags.append(tag('Hidden', 'hidden-tag'));
    main.append(tags);
    item.append(main);
    item.addEventListener('click', () => {
      selectedId = t.id;
      renderAll();
    });
    li.append(item);
    listEl.append(li);
  }
}

function renderDetail() {
  const t = trophies.find((x) => x.id === selectedId);
  detailEl.replaceChildren();
  if (!t) {
    const p = document.createElement('p');
    p.className = 'detail-hint';
    p.textContent = 'Select a trophy on the left to read its guide and sources.';
    detailEl.append(p);
    return;
  }
  const h = document.createElement('h3');
  const desc = document.createElement('p');
  desc.className = 'detail-desc';
  if (isSpoilerHidden(t)) {
    h.textContent = 'Hidden story trophy';
    desc.textContent = 'Story spoiler hidden until earned.';
    const note = document.createElement('p');
    note.className = 'spoiler-note';
    note.textContent = 'Tick its checkbox in the list to mark it earned and reveal its name, description and guide — or turn off “Hide story spoilers”.';
    detailEl.append(h, desc, note);
    return;
  }
  h.textContent = t.name;
  desc.textContent = t.description;
  detailEl.append(h, desc);
  const tags = document.createElement('div');
  tags.className = 'trophy-tags';
  tags.append(tag(t.grade, t.grade));
  if (t.kind !== t.grade) tags.append(tag(t.kind, ''));
  tags.append(tag(t.hidden ? 'Hidden trophy' : 'Visible trophy', 'hidden-tag'));
  if (t.missable) tags.append(tag('⚠ Potentially missable', 'missable'));
  detailEl.append(tags);
  const guideH = document.createElement('h4');
  guideH.textContent = 'How to get it';
  const guide = document.createElement('p');
  guide.textContent = t.guide;
  detailEl.append(guideH, guide);
  if (t.missable) {
    const warn = document.createElement('p');
    warn.className = 'spoiler-note';
    warn.textContent = 'Potentially missable: do the first meditation in Chapter 1 (Jason’s house balcony with Lucia, after “Down to Earth”). It is unconfirmed whether skipping it locks the trophy.';
    detailEl.append(warn);
  }
  const srcH = document.createElement('h4');
  srcH.textContent = 'Sources';
  const srcList = document.createElement('ul');
  for (const s of t.sources ?? []) {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = s.url;
    a.rel = 'noopener';
    a.textContent = s.name;
    li.append(a);
    srcList.append(li);
  }
  detailEl.append(srcH, srcList);
}

function renderProgress() {
  const n = earned.size;
  const total = trophies.length || 55;
  progressText.textContent = `${n} of ${total} earned`;
  progressPct.textContent = `${Math.round((n / total) * 100)}%`;
  progressFill.style.width = `${(n / total) * 100}%`;
  const counts = ['platinum', 'gold', 'silver', 'bronze'].map((g) => {
    const done = trophies.filter((t) => t.grade === g && earned.has(t.id)).length;
    const all = trophies.filter((t) => t.grade === g).length;
    return `${done}/${all} ${g}`;
  });
  gradeCounts.textContent = counts.join(' · ');
}

function renderRoadmap() {
  const stagesEl = document.getElementById('stages');
  stagesEl.replaceChildren();
  for (const s of ROADMAP_STAGES) {
    const div = document.createElement('div');
    div.className = 'stage';
    const h = document.createElement('h3');
    h.textContent = s.title;
    const hours = document.createElement('p');
    hours.className = 'hours';
    hours.textContent = s.hours;
    const ul = document.createElement('ul');
    for (const p of s.points) {
      const li = document.createElement('li');
      li.textContent = p;
      ul.append(li);
    }
    div.append(h, hours, ul);
    stagesEl.append(div);
  }
}

function renderChips() {
  kindChipsEl.replaceChildren();
  for (const k of KIND_FILTERS) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'chip';
    b.textContent = k.label;
    b.setAttribute('aria-pressed', String(kindFilter === k.id));
    b.addEventListener('click', () => {
      kindFilter = k.id;
      renderAll();
    });
    kindChipsEl.append(b);
  }
}

function renderAll() {
  renderChips();
  renderList();
  renderDetail();
  renderProgress();
}

document.getElementById('exportBtn').addEventListener('click', () => {
  const obj = {};
  for (const id of [...earned].sort((a, b) => a - b)) obj[id] = true;
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([JSON.stringify(obj, null, 1)], { type: 'application/json' }));
  a.download = EXPORT_FILENAME;
  a.click();
  URL.revokeObjectURL(a.href);
});

document.getElementById('importFile').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  try {
    const raw = JSON.parse(await file.text());
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new Error('not an object');
    const ids = new Set(trophies.map((t) => t.id));
    const next = new Set();
    for (const [key, value] of Object.entries(raw)) {
      const id = Number(key);
      if (!Number.isInteger(id) || !ids.has(id) || value !== true) throw new Error('bad entry');
      next.add(id);
    }
    earned = next;
    saveProgress();
    renderAll();
  } catch {
    alert('That file is not a valid progress export (an object of trophy id → true).');
  } finally {
    e.target.value = '';
  }
});

searchInput.addEventListener('input', renderList);
gradeSelect.addEventListener('change', renderList);
spoilerToggle.addEventListener('change', renderAll);

const doc = await (await fetch('data/trophies.json')).json();
trophies = doc.trophies.slice().sort((a, b) => a.id - b.id);
renderRoadmap();
renderAll();
