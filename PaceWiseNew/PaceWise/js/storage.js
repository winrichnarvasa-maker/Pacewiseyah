/* =====================================================
   storage.js
   Saving and loading: appData, localStorage, cleaning data,
   backup file, restore file.
   ===================================================== */

const STORAGE_KEY = 'pacewise_data';   // name used in localStorage

// appData holds ALL the saved information
let appData = blankData();


// A fresh, empty data object
function blankData() {
  return { tasks: [], wins: [], moods: {}, sessions: [], work: 25, brk: 5, name: '', lastDay: '' };
}

function isDateText(value) {
  if (typeof value !== 'string' || value.length !== 10) return false;
  if (value.charAt(4) !== '-' || value.charAt(7) !== '-') return false;
  const year = Number(value.slice(0, 4));
  const month = Number(value.slice(5, 7));
  const day = Number(value.slice(8, 10));
  return year > 0 && month >= 1 && month <= 12 && day >= 1 && day <= 31;
}

function isWholeNumber(value, min, max) {
  return Number.isInteger(value) && value >= min && value <= max;
}

function cleanSteps(rawSteps) {
  const steps = [];
  if (!Array.isArray(rawSteps)) return steps;
  for (let i = 0; i < rawSteps.length; i++) {
    const step = rawSteps[i];
    if (step && typeof step.text === 'string' && step.text.trim() !== '') {
      steps.push({ id: String(step.id || makeId()), text: step.text.trim().slice(0, 80), done: !!step.done });
    }
  }
  return steps;
}

function cleanTasks(rawTasks) {
  const tasks = [];
  for (let i = 0; i < rawTasks.length; i++) {
    const task = rawTasks[i];
    if (!task || typeof task.name !== 'string' || task.name.trim() === '') continue;
    let subject = '';
    if (typeof task.subject === 'string') subject = task.subject.trim().slice(0, 30);
    let due = '';
    if (isDateText(task.due)) due = task.due;
    tasks.push({
      id: String(task.id || makeId()),
      name: task.name.trim().slice(0, 60),
      subject: subject,
      due: due,
      today: !!task.today,
      done: !!task.done,
      steps: cleanSteps(task.steps)
    });
  }
  return tasks;
}

// Keep the "only 3 tasks in Today" rule true, even for restored files
function limitTodayTasks(tasks) {
  let active = 0;
  for (let i = 0; i < tasks.length; i++) {
    if (tasks[i].today && !tasks[i].done) {
      active++;
      if (active > MAX_TODAY) tasks[i].today = false;
    }
  }
}

function cleanWins(rawWins) {
  const wins = [];
  if (!Array.isArray(rawWins)) return wins;
  for (let i = 0; i < rawWins.length; i++) {
    const win = rawWins[i];
    if (win && typeof win.text === 'string' && Number.isFinite(win.ts)) {
      wins.push({ id: String(win.id || makeId()), type: String(win.type || 'step'), text: win.text.slice(0, 120), ts: win.ts, ref: String(win.ref || '') });
    }
  }
  return wins;
}

function cleanSessions(rawSessions) {
  const sessions = [];
  if (!Array.isArray(rawSessions)) return sessions;
  for (let i = 0; i < rawSessions.length; i++) {
    const session = rawSessions[i];
    if (session && Number.isFinite(session.ts) && Number.isFinite(session.min)) {
      const cleaned = { ts: session.ts, min: session.min };
      // Task name is optional - preserve it if present (for new feature)
      if (typeof session.task === 'string') {
        cleaned.task = session.task;
      }
      sessions.push(cleaned);
    }
  }
  return sessions;
}

function cleanMoods(rawMoods) {
  const moods = {};
  if (!rawMoods || typeof rawMoods !== 'object') return moods;
  for (const key in rawMoods) {
    const entry = rawMoods[key];
    if (isDateText(key) && entry && MOOD_NAMES[entry.m]) {
      let note = '';
      if (typeof entry.note === 'string') note = entry.note.slice(0, 80);
      moods[key] = { m: entry.m, note: note };
    }
  }
  return moods;
}

// Clean any data (from localStorage or a backup file) so the app cannot crash on it.
// Returns a good data object, or null if the data is not a PaceWise backup.
function normalizeData(raw) {
  if (!raw || typeof raw !== 'object' || !Array.isArray(raw.tasks)) return null;
  const clean = blankData();
  clean.tasks = cleanTasks(raw.tasks);
  limitTodayTasks(clean.tasks);
  clean.wins = cleanWins(raw.wins);
  clean.sessions = cleanSessions(raw.sessions);
  clean.moods = cleanMoods(raw.moods);
  if (typeof raw.name === 'string') clean.name = raw.name.trim().slice(0, 20);   // older backups have no name
  if (isDateText(raw.lastDay)) clean.lastDay = raw.lastDay;                    // new field, optional, validate with isDateText
  if (isWholeNumber(raw.work, 1, 90)) clean.work = raw.work;
  if (isWholeNumber(raw.brk, 1, 30)) clean.brk = raw.brk;
  return clean;
}

function loadData() {
  try {
    const savedText = localStorage.getItem(STORAGE_KEY);
    if (savedText) {
      const loaded = normalizeData(JSON.parse(savedText));
      if (!loaded) throw new Error('bad data');
      appData = loaded;
    }
  } catch (error) {
    appData = blankData();
    showMessage('Saved data could not be read. Starting fresh.', 'err');
  }
  secondsLeft = appData.work * 60;
}

function saveData() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(appData));
  } catch (error) {
    showMessage('Could not save data in this browser.', 'err');
  }
}

/* ----- Backup and restore (a .json file) ----- */

// Download appData as a .json file
function backupData() {
  try {
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([JSON.stringify(appData, null, 2)], { type: 'application/json' }));
    link.download = 'pacewise-backup-' + todayKey() + '.json';
    document.body.appendChild(link);
    link.click();
    link.remove();
    showMessage('Backup file saved.');
  } catch (error) {
    showMessage('Backup failed in this browser.', 'err');
  }
}

function chooseRestoreFile() {
  $('#restoreFile').click();
}

function restoreData(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();

  reader.onload = function () {
    try {
      const restored = normalizeData(JSON.parse(reader.result));
      if (!restored) throw new Error('bad file');
      if (!confirm('Replace your current data with this backup?')) return;
      appData = restored;
      resetScreenState();
      saveData();
      fillSettingsForm();
      renderAll();
      updateClock();
      showMessage('Data restored.');
    } catch (error) {
      showMessage('This file is not a valid PaceWise backup.', 'err');
    }
  };
  reader.onerror = function () {
    showMessage('Could not read the file.', 'err');
  };
  reader.readAsText(file);
  event.target.value = '';      // lets the same file be chosen again later
}
