# PaceWise - Final Response

## Changes Implemented

All five changes have been implemented as specified. Here's a summary of what was modified:

### 1. Fix the Reopen Task Bug (`js/tasks.js`)
- Modified `reopenTask()` to call `removeWin('step', step.id)` for each step reset to incomplete
- Step wins are now properly removed when a task is reopened

### 2. Fix Step Wins When Marking a Task Done (`js/tasks.js`)
- Modified `toggleTask()` to check `if (!step.done)` before adding a win
- Only newly completed steps receive a win; previously completed steps are skipped

### 3. Fix Today's Plan Daily Reset (`js/storage.js` + `js/app.js`)
- Added `lastDay: ''` field to `blankData()` 
- Updated `normalizeData()` to optionally validate `lastDay` with `isDateText()`
- Updated `startApp()` in `app.js` to reset completed+today tasks when the date changes

### 4. Add a Round-End Alert (`js/timer.js`)
- Web Audio API beep in `endRound()` with try/catch failure handling
- Tab title changes to "Round done!" and restores when user returns
- Browser notification if permission already granted (no permission request)

### 5. OPTIONAL: Link Focus Sessions to Tasks (`index.html` + `js/` files)
- Task selection dropdown on Focus page with "No task" option
- Selected task name stored in session and included in win text
- Handles deleted tasks gracefully
- Backward-compatible session normalization

## Code Verification

All modified functions were inspected:
- ✅ `reopenTask()` - removes step wins when reopening
- ✅ `toggleTask()` - checks step state before adding wins  
- ✅ `blankData()` / `normalizeData()` - optional lastDay field
- ✅ `startApp()` - daily date change detection
- ✅ `endRound()` - beep, title change, notification
- ✅ `handleVisibilityChange()` - title restoration
- ✅ `cleanSessions()` - optional task field preservation
- ✅ Dropdown population with Today's unfinished tasks

No existing functions were renamed or removed. No external dependencies were introduced. The script loading order (helpers → storage → tasks → progress → timer → mood → settings → app) is preserved.

## Manual Browser Testing Recommended

The following behaviors should be verified in a browser:

1. **Reopen task**: Complete a task with multiple steps, reopen it, confirm steps become incomplete and step wins are removed
2. **Mark task done**: Create a task with unfinished steps, mark done, confirm each newly completed step gets exactly one win
3. **Daily reset**: Complete a task in Today's Plan, simulate a date change (modify saved lastDay), reload, confirm completed tasks removed from Today's Plan while unfinished remain
4. **Round-end beep**: Start a focus round, let it finish, confirm beep plays (may vary by browser)
5. **Tab title**: Finish a round, alt-tab away, return to tab, confirm title restores
6. **Notification**: Finish a round with notification permission granted, confirm notification appears
7. **Focus-to-Task dropdown**: Select a task from Today's Plan, complete a round, confirm task name appears in win text
8. **Deleted task safety**: Select a task, delete it, complete a round, confirm no errors

## Files Modified (5 total)

| File | Change |
|------|--------|
| `js/tasks.js` | Fix reopen bug + step wins on task complete |
| `js/storage.js` | Add lastDay field + cleanSessions update |
| `js/app.js` | Daily reset logic + task selector population |
| `js/timer.js` | Beep, title change, notification on round end |
| `index.html` | Task selector dropdown on Focus page |

---

**All changes follow the specified rules**: small targeted edits, no function renames, no feature removal, beginner-friendly style, no new frameworks, preserve existing data structures, optional new fields with safe defaults, `pacewise_data` key unchanged, old backups compatible.