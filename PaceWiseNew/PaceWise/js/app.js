/* =====================================================
   app.js
   Main file. Page navigation, connecting every event listener,
   and starting the app. Loaded LAST.
   ===================================================== */

/* ----- Showing pages ----- */

// Open one of the six pages: today, tasks, focus, progress, mood or settings
function showPage(name) {
  const pages = document.querySelectorAll('.screen');
  for (let i = 0; i < pages.length; i++) {
    if (pages[i].id === name) pages[i].classList.add('on');
    else pages[i].classList.remove('on');
  }

  const buttons = document.querySelectorAll('#tabs button');
  for (let i = 0; i < buttons.length; i++) {
    if (buttons[i].dataset.go === name) {
      buttons[i].classList.add('on');
      buttons[i].setAttribute('aria-current', 'page');
    } else {
      buttons[i].classList.remove('on');
      buttons[i].removeAttribute('aria-current');
    }
  }
  renderAll();
  window.scrollTo(0, 0);
}

// Draw every page from appData. Each page has its own render function.
function renderAll() {
  renderHome();
  renderTasks();
  renderFocusInfo();
  renderProgress();
  renderMood();
}


/* ----- Navigation and shortcuts ----- */

// Any button with data-go="..." (sidebar, tab bar, shortcuts, links) opens that page
function handleNavClick(event) {
  const button = event.target.closest('[data-go]');
  if (button) showPage(button.dataset.go);
}

function goToAddTask() {
  showPage('tasks');
  focusField('#taskName');
}

function planATask() {
  showPage('tasks');
  showMessage('Tap Add to Today on a task (up to 3).');
}


/* ----- Start-up: connecting the events ----- */

function populateTaskSelector() {
  // Show unfinished tasks that belong to Today's Plan
  const selector = $('#taskSelector');
  let options = '<option value="">No task</option>';
  for (let i = 0; i < appData.tasks.length; i++) {
    const task = appData.tasks[i];
    if (!task.done && task.today) {
      options += `<option value="${escapeHtml(task.name)}">${escapeHtml(task.name)}</option>`;
    }
  }
  selector.innerHTML = options;
}

function connectEvents() {
  // Navigation and shortcuts
  document.addEventListener('click', handleNavClick);
  $('#addTaskBtn').addEventListener('click', goToAddTask);
  $('#shortcutTask').addEventListener('click', planATask);

  // Tasks page
  $('#taskForm').addEventListener('submit', addTask);
  $('#taskName').addEventListener('input', checkNameLive);
  $('#moreBtn').addEventListener('click', toggleMoreFields);
  $('#searchBox').addEventListener('input', searchTasks);
  $('#subjectFilter').addEventListener('change', filterBySubject);
  $('#filters').addEventListener('click', handleFilterClick);
  $('#todayList').addEventListener('click', listClick);
  $('#taskList').addEventListener('click', listClick);
  $('#taskList').addEventListener('submit', taskListSubmit);

  // Focus page
  $('#startBtn').addEventListener('click', startOrPause);
  $('#skipBtn').addEventListener('click', skipPhase);
  $('#resetBtn').addEventListener('click', resetTimer);
  document.addEventListener('visibilitychange', handleVisibilityChange);

  // Progress page
  $('#winsAllBtn').addEventListener('click', toggleAllWins);

  // Mood page
  $('#moods').addEventListener('click', saveMood);
  $('#moodForm').addEventListener('submit', saveNote);

  // Settings page
  $('#workMin').addEventListener('input', checkSettingsLive);
  $('#brkMin').addEventListener('input', checkSettingsLive);
  $('#setForm').addEventListener('submit', saveSettings);
  $('#backupBtn').addEventListener('click', backupData);
  $('#chooseBtn').addEventListener('click', chooseRestoreFile);
  $('#restoreFile').addEventListener('change', restoreData);
  $('#clearBtn').addEventListener('click', clearData);
}

function startApp() {
  loadData();
  fillSettingsForm();
  connectEvents();
  renderAll();
  updateClock();

  // Populate the task selector dropdown with Today's unfinished tasks
  populateTaskSelector();

  // Daily reset: if the saved day is different from today, move completed
  // tasks out of Today's Plan so they don't stay on the plan forever.
  if (appData.lastDay !== todayKey()) {
    for (let i = 0; i < appData.tasks.length; i++) {
      const task = appData.tasks[i];
      if (task.done && task.today) {
        task.today = false;
      }
    }
    appData.lastDay = todayKey();
    saveData();
  }
}

document.addEventListener('DOMContentLoaded', startApp);
