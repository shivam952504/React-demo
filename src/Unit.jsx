const formatNumber = (num) =>
  typeof num === "number"
    ? num.toLocaleString("en-IN", { maximumFractionDigits: 2 })
    : num;

let displayValue = "N/A";

if (actual !== undefined && actual !== null) {
  if (isPercent) {
    displayValue = `${actual}%`;
  } else if (unit) {
    displayValue = `${unit} ${formatNumber(actual)}`;
  } else {
    displayValue = formatNumber(actual);
  }
}

{planned !== null && (
  <div style={{ marginTop: 12 }}>
    <div style={{ fontSize: 16, fontWeight: 600, color: "#344054" }}>
      Planned: {unit ? `${unit} ${planned}` : planned}
    </div>
  </div>
)}

{overall_actual !== null && (
  <div style={{ marginTop: 6 }}>
    <div style={{ fontSize: 16, fontWeight: 600, color: "#344054" }}>
      Actual: {unit ? `${unit} ${overall_actual}` : overall_actual}
    </div>
  </div>
)}

