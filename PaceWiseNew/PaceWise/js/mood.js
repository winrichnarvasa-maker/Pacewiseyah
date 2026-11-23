/* =====================================================
   mood.js
   Mood check-in: pick a face, add a note, week row and history.
   ===================================================== */

// The saved mood codes (keys) must never change, or old backups would break.
const MOOD_NAMES = { ':D': 'Amazing', ':)': 'Good', ':|': 'Okay', ':(': 'Tired', ":'(": 'Overwhelmed' };
const MOOD_FACES = { ':D': '😄', ':)': '🙂', ':|': '😐', ':(': '😴', ":'(": '😣' };


function renderMood() {
  const todaysMood = appData.moods[todayKey()];

  // Highlight today's face
  const faceButtons = document.querySelectorAll('#moods button');
  for (let i = 0; i < faceButtons.length; i++) {
    if (todaysMood && faceButtons[i].dataset.m === todaysMood.m) faceButtons[i].classList.add('on');
    else faceButtons[i].classList.remove('on');
  }

  let hint = 'Tap a face to save how you feel today.';
  if (todaysMood) hint = 'Thanks for checking in. You matter.';
  $('#moodHint').innerHTML = '<svg class="icon"><use href="#i-heart"></use></svg>' + hint;
  if (document.activeElement !== $('#moodNote')) {
    $('#moodNote').value = todaysMood ? todaysMood.note : '';
  }

  // One face for each of the last 7 days
  const days = lastDays(7);
  let weekHtml = '';
  for (let i = 0; i < days.length; i++) {
    const entry = appData.moods[days[i]];
    const dayName = dayNameOf(days[i]);
    let label = dayName + ': no mood saved';
    let face = '-';
    let faceClass = 'mface none';
    if (entry) {
      label = dayName + ': ' + MOOD_NAMES[entry.m];
      if (entry.note) label = label + '. ' + entry.note;
      face = MOOD_FACES[entry.m];
      faceClass = 'mface';
    }
    weekHtml += `<div class="mday" title="${escapeHtml(label)}" aria-label="${escapeHtml(label)}"><span class="${faceClass}">${face}</span>${dayName.charAt(0)}</div>`;
  }
  $('#moodWeek').innerHTML = weekHtml;

  // Earlier entries, newest first (the dates sort correctly as text)
  const keys = Object.keys(appData.moods);
  keys.sort();
  keys.reverse();
  let historyHtml = '';
  for (let i = 0; i < keys.length && i < 30; i++) {
    const entry = appData.moods[keys[i]];
    let dateText = new Date(keys[i] + 'T00:00').toLocaleDateString('en', { weekday: 'long', month: 'short', day: 'numeric' });
    if (keys[i] === todayKey()) dateText = 'Today';
    const noteText = entry.note ? escapeHtml(entry.note) : 'No note';
    historyHtml += `<li><span class="mface">${MOOD_FACES[entry.m]}</span><div><b>${dateText}: ${MOOD_NAMES[entry.m]}</b><small>${noteText}</small></div></li>`;
  }
  if (historyHtml === '') historyHtml = '<li class="empty">No mood saved yet. Pick a face above.</li>';
  $('#moodHistory').innerHTML = historyHtml;
}

function saveMood(event) {
  const button = event.target.closest('[data-m]');
  if (!button) return;
  const oldMood = appData.moods[todayKey()];
  let oldNote = '';
  if (oldMood) oldNote = oldMood.note;              // keep the note when the face changes
  appData.moods[todayKey()] = { m: button.dataset.m, note: oldNote };
  saveData();
  renderAll();
  showMessage('Mood saved.');
}

function saveNote(event) {
  event.preventDefault();
  const todaysMood = appData.moods[todayKey()];
  if (!todaysMood) return showMessage('Pick a mood first, then add a note.', 'err');
  const note = $('#moodNote').value.trim();
  if (note.length > 80) return showMessage('Keep the note under 80 characters.', 'err');

  todaysMood.note = note;
  saveData();
  renderAll();
  showMessage(note ? 'Note saved.' : 'Note cleared.');
}
