# PaceWise: Code Explanation and Defense Guide

This is an **Event-Driven Programming** project, so the answer to almost every question is: *"An event happened, a function ran, the data changed, and the screen was redrawn."* Learn Part 1 and Part 3 well. Use the rest to look things up.

---

## Part 1. The whole app in 6 sentences

1. **index.html** is the skeleton: six pages (`<section>`s), each with its buttons, forms and boxes. Elements that JavaScript needs have an `id`.
2. **style.css** is the looks: colours, spacing, layout, hover effects. Only the page with class `on` is visible.
3. **The files in the `js/` folder** are the brain (helpers, storage, tasks, progress, timer, mood, settings, app). All saved information lives in ONE object named `appData` (tasks, wins, moods, timer sessions, settings, name).
4. When the user does something (click, type, submit), an **event listener** runs a **function**.
5. That function changes `appData`, calls `saveData()` (stores it in the browser's localStorage), then `renderAll()` (redraws the pages from `appData`).
6. So `appData` is the truth, and every page is just a picture of it. That is why all six pages always show matching information.

**Memorize this pattern:**

```
user does something -> event listener -> function changes appData -> saveData() -> renderAll()
```

### The six pages

| Page (nav button) | Purpose | Draw function |
|---|---|---|
| Home (`today`) | Greeting, date, 4 summary tiles, today's tasks with a completion bar, shortcuts | `renderHome()` |
| Tasks | Add, search, filter, edit, delete, complete tasks; manage steps | `renderTasks()` |
| Focus | Timer, Start/Pause, Skip, Reset, today's focus numbers | `updateClock()` and `renderFocusInfo()` |
| Progress | Weekly numbers and chart, completed tasks, Small Wins | `renderProgress()` |
| Mood | Pick mood, note, week row, mood history | `renderMood()` |
| Settings | Name, timer minutes, backup, restore, clear | `fillSettingsForm()` |

How the navigation works: every nav button has `data-go="tasks"` (or another page id). One listener (`handleNavClick`) reads it and calls `showPage(name)`, which gives class `on` to that page's `<section>` and removes it from the others.

### Example A: user adds a task
1. User types "Math homework" and presses Add. The form fires a `submit` event.
2. `addTask()` runs. It reads the text box and calls `validateTask()` (checks empty, too short, duplicate, past date).
3. If there is an error, `showMessage()` shows the red message and the function stops (`return`).
4. Otherwise `appData.tasks.push({...})` adds the task.
5. `saveData()` stores it, `renderAll()` redraws every page, `showMessage('Task added.')` confirms.

### Example B: user ticks the last step of a task
1. The click lands on the round step button. `listClick()` sees `data-act="step"`.
2. It calls `toggleStep()`, which flips `done` and calls `addWin('step', ...)`.
3. `toggleStep()` then calls `syncTaskDone()`: if ALL steps are done, the task becomes done and a "Finished task" win is added.
4. `saveData()` and `renderAll()` run. Now the progress bar (Tasks and Home), the tiles (Home), Completed tasks and Small Wins (Progress) all update, because they all read the same `appData`.

### Example C: the timer
1. Start: `startTimer()` saves the finish time (`endTime = now + seconds left`) and starts `setInterval(tick, 500)`.
2. Every half second `tick()` recalculates `secondsLeft` from the real clock, so it stays correct even if the tab was in the background.
3. At 0, `endRound()` saves the session, adds a "round" win, and starts a break (a long break on every 4th round).
4. The timer variables live outside the pages, so the timer keeps running when you open another page.

---

## Part 2. The 12 most important functions

| Function | What it does in plain words |
|---|---|
| `loadData()` | When the page opens, reads saved data from localStorage into `appData`. |
| `saveData()` | Writes `appData` into localStorage so it survives a refresh. |
| `normalizeData(raw)` | Cleans data from a backup file so a bad or fake file cannot break the app. Returns `null` if it is not a PaceWise backup. |
| `showPage(name)` | Opens one of the six pages and highlights its nav button. |
| `renderAll()` | Calls every page's draw function so all pages match `appData`. |
| `addTask(event)` | Validates and adds a task. |
| `validateTask()` | Returns an error message, or empty text if the task is OK. |
| `listClick(event)` | ONE listener for all buttons inside the task lists. It reads `data-act` to know which button was clicked. |
| `toggleStep()` / `syncTaskDone()` | Tick a step; keep the task's done status and wins matched to its steps. |
| `toggleToday()` | Adds a task to Today but refuses when 3 are already there (`MAX_TODAY`). |
| `startTimer()` / `tick()` / `endRound()` | The focus timer: start, update every 0.5 s, finish and switch to break. |
| `getWeekSummary()` | Adds up the last 7 days (tasks, steps, minutes, sessions) from real saved data. |

---

## Part 3. Every event listener (all in `connectEvents()`)

| Element | Event | Function that runs |
|---|---|---|
| Any `data-go` button (sidebar, tab bar, shortcuts, "Change timer length") | click | `handleNavClick` then `showPage` |
| Add Task (Home header) | click | `goToAddTask` |
| Plan a task (Home shortcut) | click | `planATask` |
| Task form | submit | `addTask` |
| Task name box | input | `checkNameLive` |
| "Add subject or due date" | click | `toggleMoreFields` |
| Search box | input | `searchTasks` |
| Subject drop-down | change | `filterBySubject` |
| Filter buttons (All / Pending / Done / Due soon) | click | `handleFilterClick` |
| Home list and Task list | click | `listClick` |
| Task list forms (add step, edit step, edit task) | submit | `taskListSubmit` |
| Start/Pause button | click | `startOrPause` |
| Skip, Reset | click | `skipPhase`, `resetTimer` |
| Page becomes visible again | visibilitychange | `handleVisibilityChange` |
| View all (Small Wins) | click | `toggleAllWins` |
| Mood faces | click | `saveMood` |
| Mood note form | submit | `saveNote` |
| Work / Break minutes | input | `checkSettingsLive` |
| Settings form | submit | `saveSettings` |
| Backup, Choose file, Clear | click | `backupData`, `chooseRestoreFile`, `clearData` |
| File picker | change | `restoreData` |
| Whole document | DOMContentLoaded | `startApp` (loads data, connects events, draws) |
| Timer (inside `startTimer`) | setInterval every 500 ms | `tick` |

**DOM manipulation** happens in the `render...` functions and `showPage`: they change `.textContent`, `.innerHTML`, `.classList.add/remove`, `.hidden`, `.style`.

---

## Part 4. Every function, one line each

**Section 2: helpers**
- `blankData()` returns a fresh empty data object. `$('#id')` finds an element.
- `makeId()` makes a unique id. `twoDigits(n)` turns 5 into "05".
- `dayKey(time)` turns a time into `YYYY-MM-DD` (how we group data by day). `todayKey()` is today's.
- `lastDays(n)` the last n dates, oldest first (a `for` loop). `dayNameOf(key)` gives "Friday".
- `escapeHtml(text)` replaces `<`, `>`, `&`, quotes so typed text is shown as text and never runs as code (security).
- `showMessage(text, type)` shows the pop-up for 3 seconds (`'err'` = red). `hideMessage()` hides it. `focusField()` puts the cursor in a box.

**Section 3: finding and counting**
- `findTask(id)`, `findStep(task, id)` loop through arrays to find one item.
- `getTodayTasks()` tasks in Today. `countActiveToday()` unfinished ones (the limit counts these).
- `countDoneSteps(task)`, `allStepsDone(task)`.
- `countWinsOnDay(day, type)`, `minutesOnDay(day)`, `roundsOnDay(day)`, `todayRounds()`: counters used by the tiles and charts.
- `getWeekSummary()` totals for the last 7 days. `dueState(task)` / `dueLabel(task)` give Overdue / Due soon / a date.

**Section 4: saving and loading**
- `isDateText`, `isWholeNumber` small checks. `cleanSteps`, `cleanTasks`, `limitTodayTasks`, `cleanWins`, `cleanSessions`, `cleanMoods` each clean one part of the data.
- `normalizeData` uses all of them. `loadData` and `saveData` use `try/catch` so a storage problem shows a message instead of crashing.

**Section 5: pages and drawing**
- `showPage`, `renderAll` (see Part 2).
- HTML helpers: `tagsHtml` (subject and due chips), `meterHtml` (progress bar), `statTileHtml`, `summaryBoxHtml`, `stepsHtml`.
- `renderHome` greeting, date, tiles, today's plan and completion bar.
- Tasks: `renderSubjects`, `taskPassesFilters`, `editTaskHtml`, `taskCardHtml`, `renderTasks`.
- `renderFocusInfo` today's focus numbers and tip.
- Progress: `drawBars` (bar chart), `winHtml`, `renderWeeklySummary`, `renderCompletedTasks`, `renderWins`, `renderProgress`.
- `renderMood` highlights the face, shows the week row and mood history.

**Section 6: tasks and steps**
- `checkNameLive`, `validateTask`, `addTask`, `saveTaskEdit`, `addStep`, `saveStepEdit`.
- `toggleTask`, `reopenTask`, `toggleStep`, `removeStep`, `syncTaskDone`.

**Section 7: Today and wins**
- `toggleToday` (3 limit), `keepTodayLimit` (if reopening a task would make 4, remove it from Today), `addWin`, `removeWin` (un-ticking removes the win so numbers stay honest).

**Section 8: search, filters, clicks**
- `searchTasks`, `filterBySubject`, `handleFilterClick`, `toggleInList`, `listClick`, `deleteTask`, `taskListSubmit`.

**Section 9: timer**
- `phaseSeconds`, `clockText`, `updateClock`, `startTimer`, `pauseTimer`, `startOrPause`, `resetTimer`, `skipPhase` (skip without counting a round), `tick`, `endRound`, `handleVisibilityChange`.

**Sections 10 to 12**
- Mood: `saveMood`, `saveNote`.
- Settings: `readMinutes`, `checkSettingsLive`, `saveSettings`, `fillSettingsForm`, `backupData`, `chooseRestoreFile`, `resetScreenState`, `restoreData`, `clearData`.
- Start-up: `handleNavClick`, `goToAddTask`, `planATask`, `toggleMoreFields`, `toggleAllWins`, `connectEvents`, `startApp`.

---

## Part 5. The syntax you will meet

The code uses regular `function` declarations, `for` loops, `if / else`, variables, arrays and objects. These are the only less-basic things left:

- **Template literal** (backticks): lets you put values inside text. `` `Hello ${name}` `` is the same as `'Hello ' + name`. We use it only to build HTML text.
- **`data-` attributes**: a button can carry small facts like `data-id="abc"` and `data-act="step"`. JavaScript reads them with `button.dataset.id`.
- **`event.target.closest('[data-act]')`**: "from the thing that was clicked, find the nearest button that has `data-act`". This lets ONE listener handle many buttons, including buttons created later by `innerHTML` (called event delegation).
- **`for (const key in object)`** loops through the names inside an object (used for moods).
- **Array methods we use**: `push` (add), `indexOf` (position, -1 means missing), `splice` (remove), `slice` (copy a part), `sort`, `reverse`.
- **localStorage**: stores text in the browser. `JSON.stringify(appData)` turns the object into text to save; `JSON.parse(text)` turns it back.
- **`try / catch`**: runs risky code; if it fails, `catch` runs instead of crashing.
- **`setInterval(fn, 500)`**: runs `fn` every 500 ms until `clearInterval`.
- **`FileReader` and `Blob`**: read a chosen file (restore) and build a downloadable file (backup).
- **`replace(/&/g, '&amp;')`**: replaces every `&`. The `/g` means "all of them".

---

## Part 6. HTML and CSS you should be able to explain

- Semantic tags: `<aside>` sidebar, `<nav>` menu, `<main>`, `<section>` pages and cards, `<form>` with `<input>` and `<button type="submit">`.
- One page visible at a time: CSS says `.screen {display:none}` and `.screen.on {display:block}`. `showPage()` only moves the `on` class.
- **CSS variables** (`--ac`, `--bg`...) at the top of style.css: change a colour once and the whole app updates. Dark mode redefines them inside `@media (prefers-color-scheme: dark)`.
- **Flexbox / Grid**: `display:flex` puts things in a row; `display:grid` makes columns.
- **Responsive**: `@media (min-width: 900px)` switches from the phone layout (bottom tab bar) to the desktop layout (green sidebar). At 1100px, two cards sit side by side.
- **Hover and transitions**: `:hover` plus `transition` gives the smooth lift on cards and buttons.
- **Timer circle**: an SVG circle. `stroke-dasharray` is the full length of the circle line, `stroke-dashoffset` is how much is hidden. `updateClock()` sets the offset from the time left, so the circle shrinks.
- **Progress bar**: an inner `<i>` whose `width` is set to the percentage.

---

## Part 7. Questions the panel might ask

1. **What does "event-driven" mean in your app?** Nothing happens until the user does something. Each action fires an event, and a listener runs a function. Part 3 lists all of them.
2. **Why does everything go through `appData`?** One source of truth. Pages are drawn from it, so they can never disagree.
3. **Why call `renderAll()` after every change?** It is simple and safe: all six pages are redrawn from `appData`, so no page is forgotten.
4. **How do the six pages work?** Each is a `<section class="screen">`. `showPage()` shows only one by moving the class `on`, and highlights the nav button.
5. **How does the 3-task limit work?** `toggleToday()` counts unfinished Today tasks with `countActiveToday()`. If it is already `MAX_TODAY` (3), it shows an error and returns. `limitTodayTasks()` and `keepTodayLimit()` keep the rule true for restored files and reopened tasks.
6. **How are Small Wins real?** `addWin()` is only called when a step, a task or a focus round is actually finished. Un-ticking calls `removeWin()`. Nothing is hard-coded.
7. **Where does weekly progress come from?** `getWeekSummary()` loops through the last 7 dates and counts wins and sessions saved in `appData`.
8. **How is the timer accurate?** We store the end time and compare with `Date.now()`, instead of subtracting 1 every tick (which drifts when the tab is hidden).
9. **Why does Skip not count a round?** A skipped focus round was not finished, so counting it would be a fake achievement.
10. **What if localStorage is cleared?** `loadData()` finds nothing and starts with `blankData()`. That is why Backup exists.
11. **What does `normalizeData()` protect against?** Wrong, edited or corrupted files. It checks types, trims lengths and rejects non-PaceWise files, so a bad file cannot crash the app.
12. **Why `escapeHtml()`?** If someone types `<script>` as a task name, it is shown as text instead of running (cross-site scripting protection).
13. **How do backup and restore work?** Backup turns `appData` into JSON text and downloads it. Restore reads the file with `FileReader`, passes it through `normalizeData()`, asks for confirmation, then replaces `appData`.
14. **Why one `listClick` for many buttons?** Buttons are created again every time the list is drawn. One listener on the list plus `data-act` handles all of them, instead of attaching hundreds of listeners.
15. **Limitations?** The timer stops if the page is closed; data lives in one browser only; no accounts or cloud sync.

---

## Part 8. How to prepare as a group

1. Split the work by file in the `js/` folder (storage, tasks, progress, timer, mood, settings, app). Each member explains their files aloud.
2. Everyone must be able to explain the pattern in Part 1, Example A, and the event table in Part 3.
3. Practise changing one small thing live (for example `MAX_TODAY = 3` to `2`, or a colour in `:root`) and refreshing, so you can show cause and effect.
4. If you do not know an answer, say what the function does at a high level and point to it in the code. Do not guess.
5. Keep your AI-use disclosure honest and complete in your documentation, as your rubric requires.
