const isObjectValue = typeof value === "object" && value !== null;

const formatNumber = (num) =>
  typeof num === "number"
    ? num.toLocaleString("en-IN", { maximumFractionDigits: 2 })
    : num;

let displayValue = "N/A";

if (!isObjectValue) {
  if (actual !== undefined && actual !== null) {
    if (isPercent) {
      displayValue = `${actual}%`;
    } else if (unit) {
      displayValue = `${unit} ${formatNumber(actual)}`;
    } else {
      displayValue = formatNumber(actual);
    }
  } else if (value !== undefined && value !== null) {
    if (isPercent) {
      displayValue = `${value}%`;
    } else if (unit) {
      displayValue = `${unit} ${formatNumber(value)}`;
    } else {
      displayValue = formatNumber(value);
    }
  }
}
