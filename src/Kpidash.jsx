// ✅ handle "week2-2026"
const weekYear = k.match(/^week\s*(\d{1,2})-(\d{4})$/i);
if (weekYear) {
  const week = parseInt(weekYear[1]);
  const year = parseInt(weekYear[2]);
  return year * 100 + week; // ensures correct order
}

function dateKeyToSortValue(key) {
  const k = key.trim().toLowerCase();

  // ✅ FIX: week2-2026
  const weekYear = k.match(/^week\s*(\d{1,2})-(\d{4})$/i);
  if (weekYear) {
    return parseInt(weekYear[2]) * 100 + parseInt(weekYear[1]);
  }

  // existing logic...
}

if (typeof xa === "number" && typeof xb === "number") {
  return xa - xb;
}
return 0; // NOT localeCompare
