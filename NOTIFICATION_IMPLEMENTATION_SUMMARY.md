# Notification Implementation Summary

## Changes Made to `js/timer.js`

### 1. Added `notificationShown` flag (lines 18-20)
```javascript
// Track whether a notification was already shown for the current round
// to prevent duplicate notifications if endRound is called multiple times
let notificationShown = false;
```

### 2. Reset flag in `startTimer()` (lines 69-70)
```javascript
function startTimer() {
  if (timerId) return;
  // Reset notification flag when a new timer session starts
  notificationShown = false;
  ...
}
```
- Ensures a new notification can be shown for each new round

### 3. Enhanced notification in `endRound()` (lines 174-190)
```javascript
// Show browser notification when focus session finishes (only once per round)
// Must be BEFORE phase is changed below, since phase will become 'break'
if (phase === 'work' && !notificationShown) {
  if ('Notification' in window && Notification.permission === 'granted') {
    try {
      new Notification('Focus Session Complete!', {
        body: 'Your focus time is finished! Great job. Time to take a break.',
      });
      notificationShown = true; // prevent duplicate notification for this round
    } catch (e) {
      // Fail silently
    }
  }
  // If permission is not granted, do NOT request it automatically.
  // The user can enable notifications in browser settings.
  // If the browser does not support notifications, they are silently skipped.
}
```

## Implementation Details

### Behavior when focus timer finishes:
1. ✅ **Beep sound** - Web Audio API beep plays (existing functionality preserved)
2. ✅ **Tab title change** - Changes to "Round done!" (existing functionality preserved)
3. ✅ **On-page message** - "Round done. Take a short break." appears (existing functionality preserved)
4. ✅ **Browser notification** - Appears outside the webpage with:
   - Title: "Focus Session Complete!"
   - Message: "Your focus time is finished! Great job. Time to take a break."
5. ✅ **Works when tab/window is minimized** - Notifications appear based on browser API rules
6. ✅ **No duplicate notifications** - `notificationShown` flag prevents showing twice for same round
7. ✅ **No auto-permission request** - Only shows if permission already granted; user can enable in browser settings
8. ✅ **Graceful handling** - Unsupported browsers and denied permissions silently skipped

### Code flow:
1. Focus timer reaches 0 → `endRound()` called
2. Notification check runs BEFORE `phase` is changed from 'work' to 'break'
3. If `phase === 'work'` AND `!notificationShown` AND `Notification.permission === 'granted'`:
   - Shows notification with specified title/message
   - Sets `notificationShown = true`
4. Phase changed to 'break'
5. On-page message "Round done. Take a short break." displayed
6. Beep sounds
7. Session data saved, renderAll()

### What is PRESERVED (not changed):
- Existing beep sound functionality
- Existing tab title change to "Round done!"
- Existing on-page messages ("Round done. Take a short break.", "Four rounds done! Take a longer break.")
- Existing session saving and win recording
- Existing timer logic and all other functionality
- Existing `handleVisibilityChange()` for title restoration

### What is NEW:
- Desktop/browser notification when focus timer finishes
- Specific title "Focus Session Complete!" and message "Your focus time is finished! Great job. Time to take a break."
- `notificationShown` flag to prevent duplicates
- Reset of flag when new timer session starts

## Testing Checklist (for manual browser testing)

- [ ] Allow notification permission for the site
- [ ] Start a focus timer and let it finish
- [ ] Confirm desktop notification appears with title "Focus Session Complete!"
- [ ] Confirm message reads "Your focus time is finished! Great job. Time to take a break."
- [ ] Confirm notification appears outside the webpage (on desktop)
- [ ] Confirm beep still plays
- [ ] Confirm tab title changes to "Round done!"
- [ ] Confirm on-page message "Round done. Take a short break." appears
- [ ] Start a new focus timer and confirm notification can appear again (flag reset)
- [ ] Deny notification permission and confirm no notification appears (but timer still works)
- [ ] Switch to another tab during timer, then return - confirm title restoration works