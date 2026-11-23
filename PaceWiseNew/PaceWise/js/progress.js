/* =====================================================
   progress.js
   Daily progress and productivity: wins, focus minutes, weekly summary,
   plus the Home page and the Progress page drawing.
   ===================================================== */

const WINS_SHOWN = 6;                  // Small Wins shown before "View all"

let showAllWins = false;       // Small Wins: false = latest few, true = the whole week


/* ----- Wins and counting ----- */

function addWin(type, text, ref) {
  appData.wins.push({ id: makeId(), type: type, text: text, ts: Date.now(), ref: ref || '' });
}

function removeWin(type, ref) {
  const keptWins = [];
  for (let i = 0; i < appData.wins.length; i++) {
    const win = appData.wins[i];
    if (!(win.type === type && win.ref === ref)) keptWins.push(win);
  }
  appData.wins = keptWins;
}

// How many wins of one type ('step', 'task' or 'round') happened on a day
function countWinsOnDay(day, type) {
  let count = 0;
  for (let i = 0; i < appData.wins.length; i++) {
    const win = appData.wins[i];
    if (win.type === type && dayKey(win.ts) === day) count++;
  }
  return count;
}

// Focus minutes saved on a day
function minutesOnDay(day) {
  let total = 0;
  for (let i = 0; i < appData.sessions.length; i++) {
    if (dayKey(appData.sessions[i].ts) === day) total = total + appData.sessions[i].min;
  }
  return total;
}

// Finished focus rounds on a day
function roundsOnDay(day) {
  let count = 0;
  for (let i = 0; i < appData.sessions.length; i++) {
    if (dayKey(appData.sessions[i].ts) === day) count++;
  }
  return count;
}

function todayRounds() {
  return roundsOnDay(todayKey());
}

// Add up the last 7 days (used by the Progress page)
function getWeekSummary() {
  const days = lastDays(7);
  const week = { days: days, tasks: 0, steps: 0, minutes: 0, sessions: 0 };
  for (let i = 0; i < days.length; i++) {
    week.tasks = week.tasks + countWinsOnDay(days[i], 'task');
    week.steps = week.steps + countWinsOnDay(days[i], 'step');
    week.minutes = week.minutes + minutesOnDay(days[i]);
    week.sessions = week.sessions + roundsOnDay(days[i]);
  }
  return week;
}


/* ----- Small pieces of HTML for the summary boxes ----- */

// One small stat tile (icon + number + label)
function statTileHtml(icon, value, label) {
  return `<div class="stat"><span class="sico"><svg class="icon"><use href="#${icon}"></use></svg></span><div><b>${value}</b><span>${label}</span></div></div>`;
}

// One tile used inside the weekly and focus summaries
function summaryBoxHtml(value, label) {
  return `<div><b>${value}</b><span>${label}</span></div>`;
}


/* ----- PAGE 1: Home ----- */

function renderHome() {
  // Greeting and date
  const hour = new Date().getHours();
  let part = 'evening';
  if (hour < 12) part = 'morning';
  else if (hour < 18) part = 'afternoon';
  let greeting = 'Good ' + part;
  if (appData.name) greeting = greeting + ', ' + appData.name;
  $('#greeting').textContent = greeting + '!';
  $('#todayDate').textContent = new Date().toLocaleDateString('en', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

  // Numbers for the four tiles
  const todayTasks = getTodayTasks();
  let tasksDone = 0;
  for (let i = 0; i < todayTasks.length; i++) {
    if (todayTasks[i].done) tasksDone++;
  }
  const stepsToday = countWinsOnDay(todayKey(), 'step');
  let moodText = 'Not set';
  const todaysMood = appData.moods[todayKey()];
  if (todaysMood) moodText = MOOD_NAMES[todaysMood.m];

  $('#statRow').innerHTML =
    statTileHtml('i-check', tasksDone + ' / ' + todayTasks.length, "Today's tasks done") +
    statTileHtml('i-star', stepsToday, 'Steps completed today') +
    statTileHtml('i-timer', todayRounds(), 'Focus sessions completed') +
    statTileHtml('i-smile', moodText, "Today's mood");

  // Today's Plan: a short summary, one row for each task
  $('#planCount').textContent = tasksDone + ' / ' + todayTasks.length + ' tasks';
  let percent = 0;
  if (todayTasks.length > 0) percent = Math.round(tasksDone / todayTasks.length * 100);
  $('#planBar').style.width = percent + '%';
  $('#planPct').textContent = todayTasks.length > 0 ? percent + '% done' : 'No tasks planned yet';

  let html = '';
  for (let i = 0; i < todayTasks.length; i++) {
    const task = todayTasks[i];
    let meta = task.subject;
    if (dueLabel(task)) meta = meta ? meta + ' · ' + dueLabel(task) : dueLabel(task);
    let checkClass = 'check';
    let checkLabel = 'Mark task as done';
    let rowClass = 'planItem';
    if (task.done) {
      checkClass = 'check on';
      checkLabel = 'Mark task as not done';
      rowClass = 'planItem dim';
    }
    html += `<li class="${rowClass}">
      <span class="num">${i + 1}</span>
      <div class="pmain"><b class="pname">${escapeHtml(task.name)}</b>${meta ? '<small>' + escapeHtml(meta) + '</small>' : ''}${meterHtml(task)}</div>
      <button type="button" class="${checkClass}" data-act="toggle" data-id="${task.id}" aria-label="${checkLabel}"></button>
    </li>`;
  }
  if (html === '') html = '<li class="empty">Nothing here yet. Use "Plan a task" to pick up to 3.</li>';
  $('#todayList').innerHTML = html;
}


/* ----- PAGE 3: Focus numbers (the timer itself is in timer.js) ----- */

function renderFocusInfo() {
  const rounds = todayRounds();
  $('#focusStats').innerHTML =
    summaryBoxHtml(rounds, 'Rounds today') +
    summaryBoxHtml(minutesOnDay(todayKey()), 'Focus minutes') +
    summaryBoxHtml(4 - (rounds % 4), 'Rounds to long break');

  let tip = '';
  if (rounds === 0) tip = 'Ready when you are. Press Start for your first round.';
  else if (rounds % 4 === 0) tip = 'Four rounds done. You earned a long break!';
  else tip = (4 - (rounds % 4)) + ' more round(s) until your long break.';
  $('#focusTip').textContent = tip;
}


/* ----- PAGE 4: Progress ----- */

// Draw the 7-day bar chart of focus minutes
function drawBars(box, days) {
  // Find the biggest day so the tallest bar fills the chart
  let biggest = 1;
  for (let i = 0; i < days.length; i++) {
    if (minutesOnDay(days[i]) > biggest) biggest = minutesOnDay(days[i]);
  }

  let html = '';
  for (let i = 0; i < days.length; i++) {
    const minutes = minutesOnDay(days[i]);
    const isToday = days[i] === todayKey();
    const dayName = dayNameOf(days[i]);

    let height = 5;                                                  // an empty day gets a tiny bar
    if (minutes > 0) height = Math.max(12, Math.round(minutes / biggest * 100));
    let barClass = '';
    if (isToday) barClass = 'now';
    else if (minutes > 0) barClass = 'on';

    html += `<div class="col ${isToday ? 'now' : ''}" title="${dayName}: ${minutes} min"><div class="track"><i class="${barClass}" style="height:${height}%"></i></div>${dayName.charAt(0)}</div>`;
  }
  box.innerHTML = html;
}

// One Small Win card
function winHtml(win) {
  const time = new Date(win.ts).toLocaleTimeString('en', { hour: 'numeric', minute: '2-digit' });
  let day = '';
  if (dayKey(win.ts) !== todayKey()) day = DAY_NAMES[new Date(win.ts).getDay()].slice(0, 3) + ' ';
  let icon = 'i-check';
  if (win.type === 'round') icon = 'i-timer';
  return `<li class="win ${escapeHtml(win.type)}"><span class="wico"><svg class="icon"><use href="#${icon}"></use></svg></span><div class="wtxt">${escapeHtml(win.text)}<small>${day}${time}</small></div></li>`;
}

function renderWeeklySummary() {
  const week = getWeekSummary();
  $('#stats').innerHTML =
    summaryBoxHtml(week.tasks, 'Tasks done') +
    summaryBoxHtml(week.steps, 'Steps done') +
    summaryBoxHtml(week.minutes, 'Focus minutes') +
    summaryBoxHtml(week.sessions, 'Focus sessions');

  // Best day = the day with the most focus minutes
  let bestDay = '';
  let bestMinutes = 0;
  for (let i = 0; i < week.days.length; i++) {
    const minutes = minutesOnDay(week.days[i]);
    if (minutes > bestMinutes) {
      bestMinutes = minutes;
      bestDay = week.days[i];
    }
  }
  if (bestDay) $('#bestDay').textContent = 'Best day: ' + dayNameOf(bestDay) + ' (' + bestMinutes + ' min)';
  else $('#bestDay').textContent = 'Best day: finish a focus round to see it here.';

  drawBars($('#bars'), week.days);
}

// Tasks that are marked done
function renderCompletedTasks() {
  let html = '';
  let count = 0;
  for (let i = appData.tasks.length - 1; i >= 0; i--) {          // newest first
    const task = appData.tasks[i];
    if (!task.done) continue;
    count++;
    html += `<li><span class="wico"><svg class="icon"><use href="#i-check"></use></svg></span><div><b>${escapeHtml(task.name)}</b><div class="tags">${tagsHtml(task)}</div></div></li>`;
  }
  if (html === '') html = '<li class="empty">No completed tasks yet. Finish one and it shows up here.</li>';
  $('#doneList').innerHTML = html;
  $('#doneCount').textContent = count + ' done';
}

// Small Wins: the wins of the last 7 days, newest first
function renderWins() {
  const weekStart = lastDays(7)[0];
  const weekWins = [];
  for (let i = appData.wins.length - 1; i >= 0; i--) {
    if (dayKey(appData.wins[i].ts) >= weekStart) weekWins.push(appData.wins[i]);   // 'YYYY-MM-DD' text sorts in date order
  }

  let shownCount = weekWins.length;
  if (!showAllWins && shownCount > WINS_SHOWN) shownCount = WINS_SHOWN;

  let html = '';
  for (let i = 0; i < shownCount; i++) {
    html += winHtml(weekWins[i]);
  }
  if (html === '') html = '<li class="empty">No wins yet. Your first small step counts.</li>';
  $('#winsList').innerHTML = html;

  // The button only appears when there is more to show
  const button = $('#winsAllBtn');
  button.hidden = weekWins.length <= WINS_SHOWN;
  button.textContent = showAllWins ? 'Show less' : 'View all (' + weekWins.length + ')';
  $('#winsSub').textContent = showAllWins ? 'Everything from the last 7 days.' : 'Celebrate every step forward.';
}

function renderProgress() {
  renderWeeklySummary();
  renderCompletedTasks();
  renderWins();
}

function toggleAllWins() {
  showAllWins = !showAllWins;
  renderWins();
}
