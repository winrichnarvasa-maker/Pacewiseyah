/* =====================================================
   settings.js
   Settings page: name, timer minutes, and clearing all data.
   (Backup and restore are in storage.js.)
   ===================================================== */

// Read and check the minutes. Returns { err } or { work, brk }.
function readMinutes() {
  const workText = $('#workMin').value;
  const breakText = $('#brkMin').value;
  const work = Number(workText);
  const brk = Number(breakText);
  if (workText === '' || !isWholeNumber(work, 1, 90)) return { err: 'Work minutes must be a whole number from 1 to 90.' };
  if (breakText === '' || !isWholeNumber(brk, 1, 30)) return { err: 'Break minutes must be a whole number from 1 to 30.' };
  return { work: work, brk: brk };
}

function checkSettingsLive() {
  const result = readMinutes();
  $('#setHint').textContent = result.err || '';
}

function saveSettings(event) {
  event.preventDefault();
  const result = readMinutes();
  if (result.err) return showMessage(result.err, 'err');

  const timerWasUntouched = secondsLeft === phaseSeconds();
  appData.work = result.work;
  appData.brk = result.brk;
  appData.name = $('#userName').value.trim().slice(0, 20);
  if (!timerId && timerWasUntouched) secondsLeft = phaseSeconds();
  if (secondsLeft > phaseSeconds()) secondsLeft = phaseSeconds();
  saveData();
  renderAll();
  updateClock();
  if (timerId || !timerWasUntouched) showMessage('Settings saved. New times start with the next round.');
  else showMessage('Settings saved.');
}

// Fill the settings boxes from the saved data
function fillSettingsForm() {
  $('#userName').value = appData.name;
  $('#workMin').value = appData.work;
  $('#brkMin').value = appData.brk;
  $('#setHint').textContent = '';
}

// Put everything back to a clean start (used by restore and clear)
function resetScreenState() {
  pauseTimer();
  phase = 'work';
  isLongBreak = false;
  secondsLeft = appData.work * 60;
  editTaskId = null;
  editStepKey = null;
  openStepForms = [];
}

function clearData() {
  if (!confirm('Delete ALL tasks, wins, moods, and settings? This cannot be undone.')) return;
  appData = blankData();
  resetScreenState();
  currentFilter = 'all';
  searchText = '';
  subjectFilter = '';
  $('#searchBox').value = '';
  saveData();
  fillSettingsForm();
  renderAll();
  updateClock();
  showMessage('All data cleared.');
}
