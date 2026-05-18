// ═══════════════════════════════════════════════════════════════════════
//  REPLACE your existing handleDownloadPDF with this one.
//  Everything else in KPIDashboard.jsx stays the same.
//
//  What’s new:
//  - Section 1: KPI Tiles grid (label, value, unit, target, trend)
//  - Section 2: Full data table (all rows + all date columns)
//  - Both sections on same PDF, tiles first then table
// ═══════════════════════════════════════════════════════════════════════

const handleDownloadPDF = async () => {
setShowDownloadMenu(false);
if (!columns.length || !allRows.length) return;

// Load jsPDF + autoTable from CDN (once per session)
await loadScript(“https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js”);
await loadScript(“https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js”);

const { jsPDF } = window.jspdf;
const dateCols  = columns.filter(c => c.dataIndex !== “metric” && c.dataIndex !== “target”);

const doc = new jsPDF({
orientation: dateCols.length > 10 ? “landscape” : “portrait”,
unit: “pt”,
format: “a4”,
});

const pageW  = doc.internal.pageSize.getWidth();
const pageH  = doc.internal.pageSize.getHeight();
const margin = 20;

// ── Helper: draw page number footer ──────────────────────────────────
const drawPageFooter = () => {
const pageCount = doc.internal.getNumberOfPages();
doc.setFontSize(7);
doc.setFont(“helvetica”, “normal”);
doc.setTextColor(148, 163, 184);
doc.text(
`Page ${doc.internal.getCurrentPageInfo().pageNumber} of ${pageCount}`,
pageW / 2,
pageH - 10,
{ align: “center” }
);
};

// ══════════════════════════════════════════════════════════════════════
// PAGE HEADER — Title + subtitle
// ══════════════════════════════════════════════════════════════════════
doc.setFontSize(16);
doc.setFont(“helvetica”, “bold”);
doc.setTextColor(30, 41, 59);
doc.text(“KPI Dashboard”, pageW / 2, 38, { align: “center” });

doc.setFontSize(8.5);
doc.setFont(“helvetica”, “normal”);
doc.setTextColor(100, 116, 139);
const subtitle = [
`Year: ${filters.year}`,
filters.month ? `Month: ${filters.month}` : “”,
`Period: ${viewBy}`,
`Downloaded: ${new Date().toLocaleDateString()}`,
].filter(Boolean).join(”   |   “);
doc.text(subtitle, pageW / 2, 52, { align: “center” });

// Thin separator line under title
doc.setDrawColor(226, 232, 240);
doc.setLineWidth(0.5);
doc.line(margin, 58, pageW - margin, 58);

// ══════════════════════════════════════════════════════════════════════
// SECTION 1 — KPI TILES GRID
// ══════════════════════════════════════════════════════════════════════
let cursorY = 66;

// Section label
doc.setFontSize(9);
doc.setFont(“helvetica”, “bold”);
doc.setTextColor(30, 41, 59);
doc.text(“KPI Summary”, margin, cursorY);
cursorY += 8;

// Tile grid config: 3 columns
const tilesPerRow  = 3;
const tileMargin   = 8;
const tileW        = (pageW - margin * 2 - tileMargin * (tilesPerRow - 1)) / tilesPerRow;
const tileH        = 62; // fixed tile card height

// Use allTiles (the full tile array from state)
allTiles.forEach((tile, idx) => {
const col = idx % tilesPerRow;
const row = Math.floor(idx / tilesPerRow);

```
const tileX = margin + col * (tileW + tileMargin);
const tileY = cursorY + row * (tileH + tileMargin);

// If tile would overflow page, add new page
if (tileY + tileH > pageH - 30) {
  drawPageFooter();
  doc.addPage();
  cursorY = 30;
  // recalculate tileY after page break
  const newRow = Math.floor(idx / tilesPerRow);
  // reset: will be recalculated on next iteration
}

const tx = margin + col * (tileW + tileMargin);
const ty = cursorY + Math.floor(idx / tilesPerRow) * (tileH + tileMargin);

// Tile background card
doc.setFillColor(255, 255, 255);
doc.setDrawColor(226, 232, 240);
doc.setLineWidth(0.4);
doc.roundedRect(tx, ty, tileW, tileH, 4, 4, "FD");

// Colored left accent bar
const accentHex = tile.color || "#22c55e";
const hexToRgb  = h => {
  const c = h.replace("#", "");
  return [parseInt(c.slice(0,2),16), parseInt(c.slice(2,4),16), parseInt(c.slice(4,6),16)];
};
const [ar, ag, ab] = hexToRgb(accentHex);
doc.setFillColor(ar, ag, ab);
doc.roundedRect(tx, ty, 3, tileH, 1, 1, "F");

const innerX = tx + 10;
let   innerY = ty + 13;

// Metric label
doc.setFontSize(7);
doc.setFont("helvetica", "bold");
doc.setTextColor(71, 85, 105);
// Truncate long labels
const labelText = tile.label.length > 38 ? tile.label.slice(0, 36) + "…" : tile.label;
doc.text(labelText, innerX, innerY);
innerY += 3;

// Big value
doc.setFontSize(18);
doc.setFont("helvetica", "bold");
doc.setTextColor(ar, ag, ab);
const valDisplay = tile.value !== null && tile.value !== undefined
  ? `${tile.value}${tile.unit ? " " + tile.unit : ""}`
  : "–";
doc.text(valDisplay, innerX, innerY + 14);
innerY += 18;

// Target row
if (tile.target && tile.target !== "-") {
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 116, 139);
  doc.text(`Target: ${tile.target}`, innerX, innerY + 5);
  innerY += 9;
}

// CMS / trend row
if (tile.cms) {
  const isGood = tile.cms.toLowerCase().includes("meeting") &&
                 !tile.cms.toLowerCase().includes("not meeting");
  doc.setFontSize(6.5);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(isGood ? 34 : 239, isGood ? 197 : 68, isGood ? 94 : 68);
  const cmsText = tile.cms.length > 45 ? tile.cms.slice(0, 43) + "…" : tile.cms;
  doc.text(cmsText, innerX, innerY + 6);
}
```

});

// Advance cursorY past all tile rows
const totalTileRows = Math.ceil(allTiles.length / tilesPerRow);
cursorY += totalTileRows * (tileH + tileMargin) + 10;

// ── Section separator ─────────────────────────────────────────────────
if (cursorY + 40 > pageH - 30) {
drawPageFooter();
doc.addPage();
cursorY = 30;
}

doc.setDrawColor(226, 232, 240);
doc.setLineWidth(0.5);
doc.line(margin, cursorY, pageW - margin, cursorY);
cursorY += 10;

// Section label
doc.setFontSize(9);
doc.setFont(“helvetica”, “bold”);
doc.setTextColor(30, 41, 59);
doc.text(“Full Data Table”, margin, cursorY);
cursorY += 6;

// ══════════════════════════════════════════════════════════════════════
// SECTION 2 — FULL DATA TABLE
// ══════════════════════════════════════════════════════════════════════
const head = [[“Metric”, “Target”, …dateCols.map(c => c.title)]];
const body  = allRows.map(r => [
r.metric,
r.target ?? “-”,
…dateCols.map(c => {
const v = r[c.dataIndex];
return (v === null || v === undefined || v === “”) ? “-” : String(v);
}),
]);

const metricW   = 110;
const targetW   = 40;
const remaining = pageW - margin * 2 - metricW - targetW;
const dateW     = Math.max(28, remaining / Math.max(dateCols.length, 1));

const columnStyles = {
0: { cellWidth: metricW, fontStyle: “bold” },
1: { cellWidth: targetW, halign: “center” },
};
dateCols.forEach((_, i) => {
columnStyles[i + 2] = { cellWidth: dateW, halign: “center” };
});

doc.autoTable({
startY: cursorY,
head,
body,
columnStyles,
headStyles: {
fillColor: [30, 58, 95],
textColor: 255,
fontSize: 6.5,
fontStyle: “bold”,
halign: “center”,
cellPadding: 3,
},
bodyStyles: {
fontSize: 6.5,
cellPadding: { top: 2.5, bottom: 2.5, left: 3, right: 3 },
textColor: [30, 41, 59],
},
alternateRowStyles: { fillColor: [248, 250, 252] },
styles: {
overflow: “linebreak”,
lineColor: [226, 232, 240],
lineWidth: 0.3,
},
margin: { left: margin, right: margin },
showHead: “everyPage”,
didDrawPage: () => {
const pageCount = doc.internal.getNumberOfPages();
doc.setFontSize(7);
doc.setFont(“helvetica”, “normal”);
doc.setTextColor(148, 163, 184);
doc.text(
`Page ${doc.internal.getCurrentPageInfo().pageNumber} of ${pageCount}`,
pageW / 2,
pageH - 10,
{ align: “center” }
);
},
});

doc.save(`KPI_Dashboard_${filters.year}.pdf`);
};
