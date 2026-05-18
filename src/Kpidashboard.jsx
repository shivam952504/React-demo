// ═══════════════════════════════════════════════════════════════════════
//  PATCH INSTRUCTIONS — KPIDashboard.jsx
//  Only 3 things change. Everything else stays identical.
// ═══════════════════════════════════════════════════════════════════════

// ── CHANGE A ─────────────────────────────────────────────────────────
// ADD this helper function anywhere before the component (top-level scope)
// It loads a <script> from CDN once and resolves when ready.

function loadScript(src) {
return new Promise((resolve, reject) => {
if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
const s = document.createElement(“script”);
s.src = src; s.onload = resolve; s.onerror = reject;
document.head.appendChild(s);
});
}

// ── CHANGE B ─────────────────────────────────────────────────────────
// REPLACE your existing handleDownloadCSV with handleDownloadExcel below.
// Also rename the call site in the JSX:
//   onClick={handleDownloadCSV}  →  onClick={handleDownloadExcel}
//   “📊 CSV / Excel”  label stays the same.

const handleDownloadExcel = async () => {
setShowDownloadMenu(false);
if (!columns.length || !allRows.length) return;

// Load SheetJS from CDN if not already present
if (!window.XLSX) {
await loadScript(“https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js”);
}
const XLSXLib = window.XLSX;

const dateCols = columns.filter(c => c.dataIndex !== “metric” && c.dataIndex !== “target”);
const header   = [“Metric”, “Target”, …dateCols.map(c => c.title)];

const dataRows = allRows.map(r => [
r.metric,
r.target,
…dateCols.map(c => {
const v = r[c.dataIndex];
const n = parseFloat(v);
// Keep real numbers as numbers; keep dashes/nulls as strings
return (v !== null && v !== undefined && v !== “-” && v !== “” && !isNaN(n))
? n
: (v ?? “-”);
}),
]);

const ws = XLSXLib.utils.aoa_to_sheet([header, …dataRows]);

// ── THE FIX: explicit column widths so dates never show ####### ──
ws[”!cols”] = header.map((h, colIdx) => {
let max = String(h).length + 4;
dataRows.slice(0, 50).forEach(row => {
const cell = row[colIdx];
if (cell !== null && cell !== undefined)
max = Math.max(max, String(cell).length + 2);
});
if (colIdx >= 2) max = Math.max(max, 13); // date cols minimum 13 chars wide
return { wch: max };
});

const wb = XLSXLib.utils.book_new();
const sheetLabel = `KPI_${filters.year}_${(filters.month || "")}`.replace(/\s+/g, “_”).slice(0, 31);
XLSXLib.utils.book_append_sheet(wb, ws, sheetLabel);
XLSXLib.writeFile(wb, `KPI_Dashboard_${filters.year}.xlsx`);
};

// ── CHANGE C ─────────────────────────────────────────────────────────
// REPLACE your existing handleDownloadPDF with the one below.
// onClick reference stays the same: onClick={handleDownloadPDF}

const handleDownloadPDF = async () => {
setShowDownloadMenu(false);
if (!columns.length || !allRows.length) return;

// Load jsPDF + autoTable from CDN (each loads once, cached by <script> check)
await loadScript(“https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js”);
await loadScript(“https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js”);

const { jsPDF } = window.jspdf;
const dateCols  = columns.filter(c => c.dataIndex !== “metric” && c.dataIndex !== “target”);

const doc = new jsPDF({
orientation: dateCols.length > 10 ? “landscape” : “portrait”,
unit: “pt”,
format: “a4”,
});

const pageW = doc.internal.pageSize.getWidth();

// Title
doc.setFontSize(14);
doc.setFont(“helvetica”, “bold”);
doc.setTextColor(30, 41, 59);
doc.text(“KPI Dashboard”, pageW / 2, 36, { align: “center” });

// Subtitle line
doc.setFontSize(9);
doc.setFont(“helvetica”, “normal”);
doc.setTextColor(100, 116, 139);
const subtitle = [
`Year: ${filters.year}`,
filters.month ? `Month: ${filters.month}` : “”,
`Period: ${viewBy}`,
`Downloaded: ${new Date().toLocaleDateString()}`,
].filter(Boolean).join(”   |   “);
doc.text(subtitle, pageW / 2, 52, { align: “center” });

// Build table arrays from full data (not just visible rows)
const head = [[“Metric”, “Target”, …dateCols.map(c => c.title)]];
const body  = allRows.map(r => [
r.metric,
r.target ?? “-”,
…dateCols.map(c => {
const v = r[c.dataIndex];
return (v === null || v === undefined || v === “”) ? “-” : String(v);
}),
]);

// Column widths
const metricW   = 120;
const targetW   = 44;
const remaining = pageW - 40 - metricW - targetW;
const dateW     = Math.max(30, remaining / Math.max(dateCols.length, 1));

const columnStyles = {
0: { cellWidth: metricW, fontStyle: “bold” },
1: { cellWidth: targetW, halign: “center” },
};
dateCols.forEach((_, i) => {
columnStyles[i + 2] = { cellWidth: dateW, halign: “center” };
});

doc.autoTable({
startY: 64,
head,
body,
columnStyles,
headStyles: {
fillColor: [30, 58, 95],
textColor: 255,
fontSize: 7,
fontStyle: “bold”,
halign: “center”,
cellPadding: 3,
},
bodyStyles: {
fontSize: 7,
cellPadding: { top: 3, bottom: 3, left: 4, right: 4 },
textColor: [30, 41, 59],
},
alternateRowStyles: { fillColor: [248, 250, 252] },
styles: {
overflow: “linebreak”,
lineColor: [226, 232, 240],
lineWidth: 0.3,
},
margin: { top: 64, left: 20, right: 20 },
showHead: “everyPage”,
didDrawPage: (data) => {
const pageCount = doc.internal.getNumberOfPages();
doc.setFontSize(7);
doc.setTextColor(148, 163, 184);
doc.text(
`Page ${data.pageNumber} of ${pageCount}`,
pageW / 2,
doc.internal.pageSize.getHeight() - 10,
{ align: “center” }
);
},
});

doc.save(`KPI_Dashboard_${filters.year}.pdf`);
};

// ── JSX change (inside the download dropdown) ─────────────────────────
// Change handleDownloadCSV → handleDownloadExcel in the button onClick:
//
// BEFORE:
//   <button onClick={handleDownloadCSV} …>📊 CSV / Excel</button>
//
// AFTER:
//   <button onClick={handleDownloadExcel} …>📊 Excel (.xlsx)</button>


// ─────────────────────────────────────────────────────────────────────────────
// DROP-IN REPLACEMENT for the two download handlers in KPIDashboard.jsx
// Just replace your handleDownloadCSV and handleDownloadPDF with these.
// ─────────────────────────────────────────────────────────────────────────────
//
// FIX 1 – Excel ####### dates
//   Root cause: CSV has no column-width control, Excel auto-narrows date cols.
//   Fix: Use SheetJS (xlsx) to write a real .xlsx with explicit col widths.
//   SheetJS is already bundled in your React artifact environment.
//
// FIX 2 – PDF only shows visible screen
//   Root cause: window.print() captures the rendered DOM viewport.
//   Fix: Use jsPDF + jspdf-autotable (loaded from cdnjs at runtime) to build
//        a real PDF from the full allRows / columns data arrays.
// ─────────────────────────────────────────────────────────────────────────────

// ── Paste these two functions inside your KPIDashboard component ──────────────
// (They reference `columns`, `allRows`, and `filters` from component scope.)

// ── helper: load a <script> tag once and resolve when ready ──────────────────
function loadScript(src) {
return new Promise((resolve, reject) => {
if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
const s = document.createElement(“script”);
s.src = src; s.onload = resolve; s.onerror = reject;
document.head.appendChild(s);
});
}

// ── FIX 1: Excel download with proper column widths (no #######) ─────────────
const handleDownloadExcel = async () => {
setShowDownloadMenu(false);
if (!columns.length || !allRows.length) return;

// SheetJS is available as window.XLSX in the artifact environment
// If running in a normal React app, add: import * as XLSX from ‘xlsx’;
const XLSX = window.XLSX;
if (!XLSX) {
// Fallback: load from CDN
await loadScript(“https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js”);
}
const XLSXLib = window.XLSX;

// Build header row
const dateCols = columns.filter(c => c.dataIndex !== “metric” && c.dataIndex !== “target”);
const header   = [“Metric”, “Target”, …dateCols.map(c => c.title)];

// Build data rows
const dataRows = allRows.map(r => [
r.metric,
r.target,
…dateCols.map(c => {
const v = r[c.dataIndex];
// Keep numbers as numbers so Excel formats them correctly
const n = parseFloat(v);
return (v !== null && v !== undefined && v !== “-” && v !== “” && !isNaN(n)) ? n : (v ?? “-”);
}),
]);

const wsData = [header, …dataRows];
const ws     = XLSXLib.utils.aoa_to_sheet(wsData);

// ── Auto column widths ────────────────────────────────────────────────────
// Rule: at least as wide as the header text + 4 chars padding.
// Date columns: “1/1/2026” = 10 chars → set 12. “####### “ happens < 10.
const colWidths = header.map((h, colIdx) => {
// Measure header
let max = String(h).length + 4;
// Sample up to 50 data rows for content width
dataRows.slice(0, 50).forEach(row => {
const cell = row[colIdx];
if (cell !== null && cell !== undefined) {
max = Math.max(max, String(cell).length + 2);
}
});
// Date columns (anything after Metric + Target) minimum 13
if (colIdx >= 2) max = Math.max(max, 13);
return { wch: max };
});
ws[”!cols”] = colWidths;

// ── Style header row bold + background ───────────────────────────────────
// (SheetJS Community doesn’t support styles; xlsx-style or ExcelJS needed
//  for colors. The width fix alone resolves ####### — skip style dep.)

// ── Sheet name & workbook ────────────────────────────────────────────────
const wb = XLSXLib.utils.book_new();
const sheetLabel = `KPI_${filters.year}_${filters.month || ""}`.replace(/\s+/g, “_”).slice(0, 31);
XLSXLib.utils.book_append_sheet(wb, ws, sheetLabel);

XLSXLib.writeFile(wb, `KPI_Dashboard_${filters.year}.xlsx`);
};

// ── FIX 2: Full-data PDF (not a screenshot) ──────────────────────────────────
const handleDownloadPDF = async () => {
setShowDownloadMenu(false);
if (!columns.length || !allRows.length) return;

// Load jsPDF + autoTable from CDN (once)
await loadScript(“https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js”);
await loadScript(“https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js”);

const { jsPDF } = window.jspdf;

const dateCols = columns.filter(c => c.dataIndex !== “metric” && c.dataIndex !== “target”);

// ── Page layout: landscape for many columns ───────────────────────────────
const doc = new jsPDF({
orientation: dateCols.length > 10 ? “landscape” : “portrait”,
unit: “pt”,
format: “a4”,
});

const pageW = doc.internal.pageSize.getWidth();

// ── Title ─────────────────────────────────────────────────────────────────
doc.setFontSize(14);
doc.setFont(“helvetica”, “bold”);
doc.setTextColor(30, 41, 59);       // #1e293b
doc.text(“KPI Dashboard”, pageW / 2, 36, { align: “center” });

doc.setFontSize(9);
doc.setFont(“helvetica”, “normal”);
doc.setTextColor(100, 116, 139);    // #64748b
const subtitle = [
`Year: ${filters.year}`,
filters.month ? `Month: ${filters.month}` : “”,
`Period: ${viewBy}`,
`Downloaded: ${new Date().toLocaleDateString()}`,
].filter(Boolean).join(”   |   “);
doc.text(subtitle, pageW / 2, 52, { align: “center” });

// ── Table headers & body ──────────────────────────────────────────────────
const head = [[“Metric”, “Target”, …dateCols.map(c => c.title)]];
const body  = allRows.map(r => [
r.metric,
r.target ?? “-”,
…dateCols.map(c => {
const v = r[c.dataIndex];
return (v === null || v === undefined || v === “”) ? “-” : String(v);
}),
]);

// Column width strategy: Metric wider, Target narrow, dates equal share
const metricW = 120;
const targetW = 44;
const remaining = pageW - 40 - metricW - targetW; // 40 = left+right margin
const dateW = Math.max(30, remaining / Math.max(dateCols.length, 1));

const columnStyles = {
0: { cellWidth: metricW, fontStyle: “bold” },   // Metric
1: { cellWidth: targetW, halign: “center” },    // Target
};
dateCols.forEach((_, i) => {
columnStyles[i + 2] = { cellWidth: dateW, halign: “center” };
});

doc.autoTable({
startY: 64,
head,
body,
columnStyles,
headStyles: {
fillColor: [30, 58, 95],    // #1e3a5f  (matches your table header)
textColor: 255,
fontSize: 7,
fontStyle: “bold”,
halign: “center”,
cellPadding: 3,
},
bodyStyles: {
fontSize: 7,
cellPadding: { top: 3, bottom: 3, left: 4, right: 4 },
textColor: [30, 41, 59],
},
alternateRowStyles: {
fillColor: [248, 250, 252],  // #f8fafc
},
styles: {
overflow: “linebreak”,
lineColor: [226, 232, 240],  // #e2e8f0
lineWidth: 0.3,
},
margin: { top: 64, left: 20, right: 20 },
// Repeat header on every page
showHead: “everyPage”,
didDrawPage: (data) => {
// Page number footer
const pageCount = doc.internal.getNumberOfPages();
doc.setFontSize(7);
doc.setTextColor(148, 163, 184);
doc.text(
`Page ${data.pageNumber} of ${pageCount}`,
pageW / 2,
doc.internal.pageSize.getHeight() - 10,
{ align: “center” }
);
},
});

doc.save(`KPI_Dashboard_${filters.year}.pdf`);
};
