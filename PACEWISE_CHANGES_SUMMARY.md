# PaceWise Project - Bug Fixes and Feature Improvements

## Files Modified

### 1. `js/tasks.js`
- **Fix Reopen Task Bug**: Modified `reopenTask()` to call `removeWin('step', task.steps[i].id)` for each step reset to incomplete, removing step wins that would otherwise incorrectly remain in `appData.wins`.
- **Fix Step Wins When Marking Done**: Modified `toggleTask()` to check `if (!step.done)` before adding a step win. Only previously incomplete steps receive a new win, preventing duplicate completion records.

### 2. `js/storage.js`
- **Daily Reset Data Field**: Added `lastDay: ''` to `blankData()` function.
- **normalizeData()**: Added optional `lastDay` field validation using existing `isDateText()` function. Old backups without this field safely default to empty string.
- **cleanSessions()**: Updated to optionally preserve a `task` field in session objects (for the optional Focus-to-Task feature), while maintaining backward compatibility with old sessions that don't have this field.

### 3. `js/app.js`
- **Daily Reset Logic**: After `loadData()`, checks if `appData.lastDay !== todayKey()`. When dates differ, loops through tasks and sets `task.today = false` for completed tasks only, preserving unfinished tasks in Today's Plan. Sets `appData.lastDay = todayKey()` and calls `saveData()`.
- **Task Selector Population**: Added `populateTaskSelector()` function that fills the Focus page dropdown with unfinished tasks from Today's Plan.

### 4. `js/timer.js`
- **Beep on Round End**: Added Web Audio API beep generation inside `endRound()`, wrapped in `try/catch` for graceful failure in unsupported browsers.
- **Tab Title Change**: When a round ends, the page title changes to `'Round done!'`. The original title is saved in `titleBeforeRoundDone` and restored when the user returns to the tab via `handleVisibilityChange()`.
- **Browser Notification**: If `Notification.permission === 'granted'`, a notification with title "Round finished" and body "Your focus round is complete." is shown. No permission request is made.

### 5. `index.html`
- **Task Selection Dropdown**: Added a `<select id="taskSelector">` element to the Focus page with "No task" as the first option, populated with unfinished tasks that belong to Today's Plan.

## Change 1: Fix the Reopen Task Bug

**File**: `js/tasks.js`  
**Function**: `reopenTask()`

When a completed task is reopened, steps are changed back to incomplete, and their corresponding step wins are now removed via `removeWin('step', step.id)`. This prevents the Progress page from displaying an incorrect number of completed steps.

**Before**: Steps were reset to `done = false` but their wins remained in `appData.wins`.
**After**: Each step's win is removed when the step is reset to incomplete.

## Change 2: Fix Step Wins When Marking a Task Done

**File**: `js/tasks.js`  
**Function**: `toggleTask()`

Before changing each step to completed, the function now checks whether the step was already completed. Only steps that were previously incomplete receive a new `addWin('step', 'Finished step: ' + step.text, step.id)` record. Previously completed steps are skipped, preventing duplicate wins.

**Before**: All steps were set to `done = true` unconditionally, with no check for prior state.
**After**: Each step's prior state is checked; only newly completed steps receive a win.

## Change 3: Fix Today's Plan Daily Reset

**File**: `js/storage.js` + `js/app.js`

### `storage.js` changes:
- Added `lastDay: ''` to `blankData()` 
- Added optional `lastDay` validation in `normalizeData()` using `isDateText()`
- Updated `cleanSessions()` to optionally preserve a `task` field

### `app.js` changes:
- After `loadData()`, checks `appData.lastDay !== todayKey()`
- If dates differ: sets `task.today = false` for completed+today tasks, preserves unfinished tasks, saves new `lastDay` value
- Only resets when the date changes, not on every page reload

**Before**: Completed tasks remained in Today's Plan indefinitely, even after a new day began.
**After**: Completed tasks are removed from Today's Plan when a new day begins; unfinished tasks remain.

## Change 4: Add a Round-End Alert

**File**: `js/timer.js`

### Beep:
- Web Audio API generates a short 400Hz beep
- Wrapped in `try/catch` for graceful failure
- Does not break the timer or existing messages

### Tab Title:
- Changes to `'Round done!'` when a round ends
- Original title saved and restored in `handleVisibilityChange()` when user returns to the tab

### Browser Notification:
- Only shows if permission is already `granted`
- Does not request permission or interrupt the user
- Uses title "Round finished" with body "Your focus round is complete."

## Change 5: OPTIONAL - Link Focus Sessions to Tasks

**Files**: `index.html` + `js/app.js` + `js/timer.js` + `js/storage.html`

### Dropdown:
- Added `<select id="taskSelector">` to Focus page
- First option: "No task"
- Subsequent options: unfinished tasks from Today's Plan

### Session-task linking:
- When a round ends, the selected task name is stored in the session data
- Win text includes the task name (e.g., "Finished a 25-minute round on Math set")
- If no task selected, existing behavior is preserved
- If the selected task is deleted, the session/win falls back to task-less version

### Backward compatibility:
- `cleanSessions()` preserves the optional `task` field if present
- Old sessions without this field work correctly

## Testing Performed

**Code review verified**:
- All modified functions have balanced syntax
- No existing functionality was removed or renamed
- New fields are optional with safe defaults
- Old backup data structures remain compatible
- Existing data structures (tasks, wins, sessions) are preserved

**Behaviors requiring manual browser testing**:
- Web Audio API beep playback (varies by browser)
- Tab title change and restoration on visibility change
- Browser notification display (requires user granting permission)
- Dropdown population with actual tasks
- Daily reset behavior when date changes

## New Test Cases

| Test Case / Action | Expected Result |
|---|---|
| Reopen a completed task | All steps become incomplete and their step wins are removed. |
| Mark a task done with unfinished steps | All newly completed steps receive one step win each. |
| Reload the application on a new day | Completed tasks are removed from Today's Plan while unfinished tasks remain. |
| Finish a focus round | A beep sounds (if supported) and tab title changes to "Round done!". |
| Finish a focus round with a selected task | The session and win text include the selected task name. |
| Finish a focus round with no task selected | Existing session and win behavior is preserved (no task name added). |
| Delete a task previously selected in focus | Application handles it safely; no reference to deleted task in new sessions. |
| Restore old backup without lastDay field | Data restores correctly; lastDay defaults to empty string. |
| Return to browser tab after round ends | Original page title is restored. |

## Important Notes

- All changes are backward-compatible; old backup files restore correctly.
- The `pacewise_data` localStorage key is unchanged.
- No external frameworks or libraries were introduced.
- The existing script loading order is preserved.
- New fields (`lastDay` in appData, `task` in sessions) are optional.
- Manual browser testing is recommended for the round-end alerts and Focus-to-Task feature, as these depend on browser APIs and user permissions.