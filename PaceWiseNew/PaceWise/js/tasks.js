/* =====================================================
   tasks.js
   Tasks and steps: add, edit, delete, complete, Today's Plan limit,
   search, filters, and the Tasks page drawing.
   ===================================================== */

const MAX_TODAY = 3;                   // Today's Plan limit

// Things the Tasks page remembers while the page is open (not saved)
let currentFilter = 'all';     // all / pending / done / due
let searchText = '';           // text typed in the search box
let subjectFilter = '';        // '' means all subjects
let editTaskId = null;         // id of the task being edited
let editStepKey = null;        // 'taskId:stepId' of the step being edited
let openStepForms = [];        // ids of tasks whose "add step" form is open


/* ----- Finding and counting tasks ----- */

function findTask(id) {
  for (let i = 0; i < appData.tasks.length; i++) {
    if (appData.tasks[i].id === id) return appData.tasks[i];
  }
  return null;
}

function findStep(task, stepId) {
  for (let i = 0; i < task.steps.length; i++) {
    if (task.steps[i].id === stepId) return task.steps[i];
  }
  return null;
}

// All tasks chosen for Today (finished ones stay until removed)
function getTodayTasks() {
  const list = [];
  for (let i = 0; i < appData.tasks.length; i++) {
    if (appData.tasks[i].today) list.push(appData.tasks[i]);
  }
  return list;
}

// How many tasks in Today are NOT finished yet (this is what the limit of 3 counts)
function countActiveToday() {
  let count = 0;
  for (let i = 0; i < appData.tasks.length; i++) {
    if (appData.tasks[i].today && !appData.tasks[i].done) count++;
  }
  return count;
}

function countDoneSteps(task) {
  let count = 0;
  for (let i = 0; i < task.steps.length; i++) {
    if (task.steps[i].done) count++;
  }
  return count;
}

function allStepsDone(task) {
  for (let i = 0; i < task.steps.length; i++) {
    if (!task.steps[i].done) return false;
  }
  return true;
}

// Due date helper. Returns '' (nothing), 'soon' (today to 2 days away) or 'over' (past)
function dueState(task) {
  if (task.done || !task.due) return '';
  const oneDay = 24 * 60 * 60 * 1000;
  const daysLeft = Math.round((new Date(task.due + 'T00:00') - new Date(todayKey() + 'T00:00')) / oneDay);
  if (daysLeft < 0) return 'over';
  if (daysLeft <= 2) return 'soon';
  return '';
}

function dueLabel(task) {
  const state = dueState(task);
  if (state === 'over') return 'Overdue';
  if (state === 'soon') return 'Due soon';
  if (task.due) return 'Due ' + new Date(task.due + 'T00:00').toLocaleDateString('en', { month: 'short', day: 'numeric' });
  return '';
}


/* ----- Drawing the Tasks page ----- */

// The small chips under a task name: subject and due date
function tagsHtml(task) {
  let html = '';
  if (task.subject) html += `<span class="tag">${escapeHtml(task.subject)}</span>`;
  if (task.due) html += `<span class="tag ${dueState(task)}">${dueLabel(task)}</span>`;
  return html;
}

// The progress bar with a "3/5 steps" label
function meterHtml(task) {
  const total = task.steps.length;
  const done = countDoneSteps(task);

  let percent = 0;
  if (task.done) percent = 100;
  else if (total > 0) percent = Math.round(done / total * 100);

  let label = 'No steps yet';
  if (total > 0) label = done + '/' + total + ' steps';
  else if (task.done) label = 'Done';

  return `<div class="meterRow"><div class="meter"><i style="width:${percent}%"></i></div><span>${label}</span></div>`;
}

// The steps of one task. canEdit = true shows Edit / Remove buttons.
function stepsHtml(task, canEdit) {
  if (task.steps.length === 0) return '';
  let html = '';
  for (let i = 0; i < task.steps.length; i++) {
    const step = task.steps[i];

    // This step is being edited: show a small form
    if (canEdit && editStepKey === task.id + ':' + step.id) {
      html += `<li><form class="stepEdit" data-t="${task.id}" data-s="${step.id}" novalidate>
        <input type="text" name="s" value="${escapeHtml(step.text)}" maxlength="80" aria-label="Edit step">
        <button class="link ac" type="submit">Save</button>
        <button class="link mut" type="button" data-act="cancelstep" data-id="${task.id}">Cancel</button></form></li>`;
      continue;
    }

    let circleLabel = 'Mark step as done';
    let circleClass = 'circle';
    let textClass = 'stxt';
    if (step.done) {
      circleLabel = 'Mark step as not done';
      circleClass = 'circle on';
      textClass = 'stxt dim';
    }
    const circle = `<button type="button" class="${circleClass}" data-act="step" data-id="${task.id}" data-s="${step.id}" aria-label="${circleLabel}"></button>`;

    let tools = '';
    if (canEdit) {
      tools = `<span class="stepTools"><button type="button" data-act="editstep" data-id="${task.id}" data-s="${step.id}">Edit</button><button type="button" data-act="delstep" data-id="${task.id}" data-s="${step.id}">Remove</button></span>`;
    }
    html += `<li>${circle}<span class="${textClass}">${escapeHtml(step.text)}</span>${tools}</li>`;
  }
  return html;
}

// Fill the subject drop-down with the subjects that exist
function renderSubjects() {
  const subjects = [];
  for (let i = 0; i < appData.tasks.length; i++) {
    const subject = appData.tasks[i].subject;
    if (subject && subjects.indexOf(subject) === -1) subjects.push(subject);
  }
  subjects.sort();
  if (subjectFilter && subjects.indexOf(subjectFilter) === -1) subjectFilter = '';

  let options = '<option value="">All subjects</option>';
  for (let i = 0; i < subjects.length; i++) {
    options += `<option value="${escapeHtml(subjects[i])}">${escapeHtml(subjects[i])}</option>`;
  }
  const dropdown = $('#subjectFilter');
  dropdown.innerHTML = options;
  dropdown.value = subjectFilter;
}

// Does this task pass the status filter, subject filter and search text?
function taskPassesFilters(task) {
  if (currentFilter === 'pending' && task.done) return false;
  if (currentFilter === 'done' && !task.done) return false;
  if (currentFilter === 'due' && dueState(task) === '') return false;
  if (subjectFilter && task.subject !== subjectFilter) return false;
  if (searchText && (task.name + ' ' + task.subject).toLowerCase().indexOf(searchText) === -1) return false;
  return true;
}

// The small form shown while a task is being edited
function editTaskHtml(task) {
  return `<li class="task"><form class="editForm" data-id="${task.id}" novalidate>
    <input type="text" name="n" value="${escapeHtml(task.name)}" maxlength="60" aria-label="Task name">
    <div class="more"><input type="text" name="sub" value="${escapeHtml(task.subject)}" maxlength="30" placeholder="Subject (optional)" aria-label="Subject"><input type="date" name="due" value="${escapeHtml(task.due)}" aria-label="Due date"></div>
    <div class="tools"><button type="submit" class="ac">Save</button><button type="button" data-act="canceledit" data-id="${task.id}">Cancel</button></div></form></li>`;
}

// The normal card for one task
function taskCardHtml(task) {
  const tags = tagsHtml(task);
  const cardClass = task.done ? 'task dim' : 'task';

  // "Add to Today" button and the "add step" area only for unfinished tasks
  let todayButton = '';
  let addStepArea = '';
  if (!task.done) {
    const todayText = task.today ? 'In Today ✓' : 'Add to Today';
    todayButton = `<button type="button" class="todayBtn" data-act="today" data-id="${task.id}">${todayText}</button>`;

    const formIsOpen = openStepForms.indexOf(task.id) !== -1;
    addStepArea = `<button type="button" class="link ac addStep" data-act="stepform" data-id="${task.id}" aria-expanded="${formIsOpen}">+ Add step</button>
      <form class="stepForm" data-form="${task.id}" ${formIsOpen ? '' : 'hidden'} novalidate><input type="text" name="s" maxlength="80" placeholder="Describe a small step" aria-label="New step"><button class="btn soft" type="submit">Add</button></form>`;
  }
  const doneButtonText = task.done ? 'Reopen' : 'Mark done';

  return `<li class="${cardClass}">
    <div class="trow"><div class="tmain"><b>${escapeHtml(task.name)}</b>${tags ? '<div class="tags">' + tags + '</div>' : ''}</div>${todayButton}</div>
    ${meterHtml(task)}
    <ul class="steps">${stepsHtml(task, !task.done)}</ul>
    ${addStepArea}
    <div class="tools"><button type="button" data-act="done" data-id="${task.id}">${doneButtonText}</button><button type="button" data-act="edit" data-id="${task.id}">Edit</button><button type="button" data-act="del" data-id="${task.id}">Delete</button></div></li>`;
}

function renderTasks() {
  renderSubjects();

  // Highlight the active filter button
  const filterButtons = document.querySelectorAll('#filters button');
  for (let i = 0; i < filterButtons.length; i++) {
    if (filterButtons[i].dataset.f === currentFilter) filterButtons[i].classList.add('on');
    else filterButtons[i].classList.remove('on');
  }

  let html = '';
  for (let i = 0; i < appData.tasks.length; i++) {
    const task = appData.tasks[i];
    if (!taskPassesFilters(task)) continue;
    if (editTaskId === task.id) html += editTaskHtml(task);
    else html += taskCardHtml(task);
  }
  if (html === '') {
    if (appData.tasks.length > 0) html = '<li class="empty">No tasks match.</li>';
    else html = '<li class="empty">No tasks yet. Type a task above and tap Add.</li>';
  }
  $('#taskList').innerHTML = html;
}


/* ----- Adding, editing, completing and deleting ----- */

// Live hint while typing a task name
function checkNameLive() {
  const name = $('#taskName').value.trim();
  if (name && name.length < 3) $('#nameHint').textContent = 'Use at least 3 characters.';
  else $('#nameHint').textContent = '';
}

// Check a task. Returns an error text, or '' if everything is fine.
// skipId = the task being edited (so it does not clash with itself)
// keepDue = the old due date, which may stay even if it is already past
function validateTask(name, due, skipId, keepDue) {
  if (!name) return 'Please type a task name.';
  if (name.length < 3) return 'Task name needs at least 3 characters.';
  if (name.length > 60) return 'Keep the task name under 60 characters.';

  for (let i = 0; i < appData.tasks.length; i++) {
    const other = appData.tasks[i];
    if (other.id !== skipId && !other.done && other.name.toLowerCase() === name.toLowerCase()) {
      return 'This task is already on your list.';
    }
  }
  if (due && due < todayKey() && due !== keepDue) return 'The due date is already past. Pick today or a later date.';
  return '';
}

function addTask(event) {
  event.preventDefault();                       // stop the page from reloading
  const name = $('#taskName').value.trim();
  const due = $('#taskDue').value;
  const error = validateTask(name, due);
  if (error) return showMessage(error, 'err');

  appData.tasks.push({ id: makeId(), name: name, subject: $('#taskSubject').value.trim(), due: due, steps: [], today: false, done: false });
  event.target.reset();
  $('#nameHint').textContent = '';
  saveData();
  renderAll();
  showMessage('Task added.');
}

// Save the edit form of a task (name, subject, due date)
function saveTaskEdit(form) {
  const task = findTask(form.dataset.id);
  if (!task) return;
  const name = form.querySelector('[name=n]').value.trim();
  const subject = form.querySelector('[name=sub]').value.trim();
  const due = form.querySelector('[name=due]').value;
  const error = validateTask(name, due, task.id, task.due);
  if (error) return showMessage(error, 'err');

  task.name = name;
  task.subject = subject;
  task.due = due;
  editTaskId = null;
  saveData();
  renderAll();
  showMessage('Task updated.');
}

function addStep(form) {
  const task = findTask(form.dataset.form);
  if (!task) return;
  const text = form.querySelector('input').value.trim();
  if (!text) return showMessage('Type a small step first.', 'err');
  if (text.length > 80) return showMessage('Keep the step under 80 characters.', 'err');

  task.steps.push({ id: makeId(), text: text, done: false });
  syncTaskDone(task);
  saveData();
  renderAll();
  showMessage('Step added.');
  focusField('[data-form="' + task.id + '"] input');
}

function saveStepEdit(form) {
  const task = findTask(form.dataset.t);
  if (!task) return;
  const step = findStep(task, form.dataset.s);
  if (!step) return;
  const text = form.querySelector('input').value.trim();
  if (!text) return showMessage('A step cannot be empty.', 'err');
  if (text.length > 80) return showMessage('Keep the step under 80 characters.', 'err');

  step.text = text;
  editStepKey = null;
  saveData();
  renderAll();
  showMessage('Step updated.');
}

// Mark a whole task done, or reopen it
function toggleTask(task) {
  if (task.done) return reopenTask(task);
  task.done = true;
  for (let i = 0; i < task.steps.length; i++) {
    const step = task.steps[i];
    if (!step.done) {
      step.done = true;
      addWin('step', 'Finished step: ' + step.text, step.id);
    }
  }
  addWin('task', 'Finished task: ' + task.name, task.id);
  showMessage('Task complete. Nice work!');
}

function reopenTask(task) {
  task.done = false;
  // A task with every step ticked would look finished, so start the steps again
  if (task.steps.length > 0 && allStepsDone(task)) {
    for (let i = 0; i < task.steps.length; i++) {
      task.steps[i].done = false;
      removeWin('step', task.steps[i].id); // Remove the step win when reopening
    }
  }
  removeWin('task', task.id);
  keepTodayLimit(task);
}

function toggleStep(task, stepId) {
  const step = findStep(task, stepId);
  if (!step) return;
  step.done = !step.done;
  if (step.done) addWin('step', 'Finished step: ' + step.text, step.id);
  else removeWin('step', step.id);              // un-ticking removes the win, so the numbers stay honest
  syncTaskDone(task);
}

function removeStep(task, stepId) {
  const keptSteps = [];
  for (let i = 0; i < task.steps.length; i++) {
    if (task.steps[i].id !== stepId) keptSteps.push(task.steps[i]);
  }
  task.steps = keptSteps;
  removeWin('step', stepId);
  syncTaskDone(task);
}

// Make the task's "done" match its steps (all steps ticked = task done)
function syncTaskDone(task) {
  if (task.steps.length === 0) return;
  const everyStepDone = allStepsDone(task);
  if (everyStepDone && !task.done) {
    task.done = true;
    addWin('task', 'Finished task: ' + task.name, task.id);
    showMessage('Task complete. Nice work!');
  } else if (!everyStepDone && task.done) {
    task.done = false;
    removeWin('task', task.id);
    keepTodayLimit(task);
  }
}

function deleteTask(task) {
  const keptTasks = [];
  for (let i = 0; i < appData.tasks.length; i++) {
    if (appData.tasks[i] !== task) keptTasks.push(appData.tasks[i]);
  }
  appData.tasks = keptTasks;
  const openPosition = openStepForms.indexOf(task.id);
  if (openPosition !== -1) openStepForms.splice(openPosition, 1);
}


/* ----- Today's Plan limit ----- */

function toggleToday(task) {
  if (task.today) {
    task.today = false;
    return;
  }
  if (countActiveToday() >= MAX_TODAY) return showMessage('Today already has 3 tasks. Finish or remove one first.', 'err');
  task.today = true;
  showMessage('Added to Today.');
}

// If reopening a task would put 4 tasks in Today, take it out of Today
function keepTodayLimit(task) {
  if (task.today && countActiveToday() > MAX_TODAY) {
    task.today = false;
    showMessage('Today already has 3 tasks, so this one was moved out of Today.', 'err');
  }
}


/* ----- Search, filters and list clicks ----- */

function searchTasks() {
  searchText = $('#searchBox').value.trim().toLowerCase();
  renderTasks();
}

function filterBySubject() {
  subjectFilter = $('#subjectFilter').value;
  renderTasks();
}

function handleFilterClick(event) {
  const button = event.target.closest('[data-f]');
  if (!button) return;
  currentFilter = button.dataset.f;
  renderTasks();
}

// Add or remove an id from a list (used for the open "add step" forms)
function toggleInList(list, id) {
  const position = list.indexOf(id);
  if (position === -1) list.push(id);
  else list.splice(position, 1);
}

// ONE listener handles every button inside the Home list and the Task list.
// Each button says what it does in data-act and which task it belongs to in data-id.
function listClick(event) {
  const button = event.target.closest('[data-act]');
  if (!button) return;
  const task = findTask(button.dataset.id);
  if (!task) return;
  const action = button.dataset.act;

  // Actions that only change what is shown (nothing to save)
  if (action === 'stepform') {
    toggleInList(openStepForms, task.id);
    renderTasks();
    return focusField('[data-form="' + task.id + '"] input');
  }
  if (action === 'edit') {
    editTaskId = task.id;
    editStepKey = null;
    renderTasks();
    return focusField('.editForm [name=n]');
  }
  if (action === 'canceledit') {
    editTaskId = null;
    return renderTasks();
  }
  if (action === 'editstep') {
    editStepKey = task.id + ':' + button.dataset.s;
    renderTasks();
    return focusField('.stepEdit input');
  }
  if (action === 'cancelstep') {
    editStepKey = null;
    return renderTasks();
  }

  // Actions that change the data
  if (action === 'toggle' || action === 'done') {
    toggleTask(task);
  } else if (action === 'step') {
    toggleStep(task, button.dataset.s);
  } else if (action === 'delstep') {
    removeStep(task, button.dataset.s);
  } else if (action === 'today') {
    toggleToday(task);
  } else if (action === 'del') {
    if (!confirm('Delete this task?')) return;
    deleteTask(task);
  }
  saveData();
  renderAll();
}

// Form submits inside the Task list: add step, edit step, edit task
function taskListSubmit(event) {
  event.preventDefault();
  const form = event.target;
  if (form.matches('.stepForm')) addStep(form);
  else if (form.matches('.stepEdit')) saveStepEdit(form);
  else if (form.matches('.editForm')) saveTaskEdit(form);
}

function toggleMoreFields() {
  const fields = $('#moreFields');
  fields.hidden = !fields.hidden;
  $('#moreBtn').setAttribute('aria-expanded', String(!fields.hidden));
}
