/* =====================================================
   helpers.js
   Small helper functions used by every other file.
   Loaded FIRST, so the other files can use these.
   ===================================================== */

// Names of the days (used for the chart, wins and mood week)
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

let messageTimer;              // timer that hides the pop-up message


// Shortcut: find one element on the page
function $(selector) {
  return document.querySelector(selector);
}

// Make a unique id from the time and a random number
function makeId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function twoDigits(number) {
  if (number < 10) return '0' + number;
  return String(number);
}

// Turn a time into the text 'YYYY-MM-DD' (this is how we group data by day)
function dayKey(time) {
  const date = new Date(time);
  return date.getFullYear() + '-' + twoDigits(date.getMonth() + 1) + '-' + twoDigits(date.getDate());
}

function todayKey() {
  return dayKey(Date.now());
}

// The last n days as 'YYYY-MM-DD', oldest first, ending today
function lastDays(n) {
  const days = [];
  for (let i = n - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    days.push(dayKey(date));
  }
  return days;
}

// The day name for a 'YYYY-MM-DD' text, for example 'Friday'
function dayNameOf(key) {
  return DAY_NAMES[new Date(key + 'T00:00').getDay()];
}

// Make text safe before putting it inside HTML (so typed text can never run as code)
function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Show a short pop-up message. type is 'ok' (green) or 'err' (red).
function showMessage(text, type) {
  const box = $('#msg');
  box.textContent = text;
  box.className = type || 'ok';
  box.style.display = 'block';
  clearTimeout(messageTimer);
  messageTimer = setTimeout(hideMessage, 3000);
}

function hideMessage() {
  $('#msg').style.display = 'none';
}

// Put the cursor in a field (used after the screen is redrawn)
function focusField(selector) {
  const field = document.querySelector(selector);
  if (field) field.focus();
}
