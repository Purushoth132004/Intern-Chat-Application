// js/utils.js

// Converts *bold* or _italic_ into HTML tags
function formatText(text) {
  return text
    .replace(/\*(.*?)\*/g, "<b>$1</b>")
    .replace(/_(.*?)_/g, "<i>$1</i>")
    .replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank">$1</a>');
}

// Formats timestamp into HH:MM format
function formatTime(isoString) {
  const date = new Date(isoString);
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

// Pads single digit numbers with a leading zero
function pad(n) {
  return n < 10 ? "0" + n : n;
}
