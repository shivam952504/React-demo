// ═══════════════════════════════════════════════════════════════════════
//  REPLACE your entire handleDownloadPDF with this function.
//  Fix 1: Tiles now have mini bar charts drawn via jsPDF rect calls
//  Fix 2: Table uses multiple pages horizontally (splits date columns
//          into chunks so all 31 dates appear across pages)
// ═══════════════════════════════════════════════════════════════════════

const handleDownloadPDF = async () => {
setShowDownloadMenu(false);
if (!columns.length || !allRows.length) return;

await loadScript(“https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js”);
await loadScript(“https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js”);

const { jsPDF } = window.jspdf;

// Always landscape — gives maximum width for date columns
const doc = new jsPDF({ orientation: “landscape”, unit: “pt”, format: “a4” });
const pageW = doc.internal.pageSize.getWidth();  // 841.89
const pageH = doc.internal.pageSize.getHeight(); // 595.28
const margin = 20;

// ── Colour helpers ────────────────────────────────────────────────────
const hexToRgb = h => {
const c = (h || “#22c55e”).replace(”#”, “”);
if (c.length !== 6) return [34, 197, 94];
return [parseInt(c.slice(0,2),16), parseInt(c.slice(2,4),16), parseInt(c.slice(4,6),16)];
};

// ── Footer helper ─────────────────────────────────────────────────────
const addFooter = () => {
const total = doc.internal.getNumberOfPages();
const cur   = doc.internal.getCurrentPageInfo().pageNumber;
doc.setFontSize(7);
doc.setFont(“helvetica”, “normal”);
doc.setTextColor(148, 163, 184);
doc.text(`Page ${cur} of ${total}`, pageW / 2, pageH - 8, { align: “center” });
};

// ── Page 1 header ─────────────────────────────────────────────────────
doc.setFontSize(15);
doc.setFont(“helvetica”, “bold”);
doc.setTextColor(30, 41, 59);
doc.text(“KPI Dashboard”, pageW / 2, 34, { align: “center” });

doc.setFontSize(8);
doc.setFont(“helvetica”, “normal”);
doc.setTextColor(100, 116, 139);
const subtitle = [
`Year: ${filters.year}`,
filters.month ? `Month: ${filters.month}` : “”,
`Period: ${viewBy}`,
`Downloaded: ${new Date().toLocaleDateString()}`,
].filter(Boolean).join(”   |   “);
doc.text(subtitle, pageW / 2, 46, { align: “center” });

doc.setDrawColor(226, 232, 240);
doc.setLineWidth(0.4);
doc.line(margin, 52, pageW - margin, 52);

// ════════════════════════════════════════════════════════════════════
// SECTION 1 — KPI TILES  (3 per row, each with mini bar chart)
// ════════════════════════════════════════════════════════════════════
let curY = 58;

doc.setFontSize(8.5);
doc.setFont(“helvetica”, “bold”);
doc.setTextColor(30, 41, 59);
doc.text(“KPI Summary”, margin, curY + 7);
curY += 14;

const tilesPerRow = 3;
const tileGap     = 8;
const tileW       = (pageW - margin * 2 - tileGap * (tilesPerRow - 1)) / tilesPerRow;
const tileH       = 90; // taller to fit bar chart
const chartH      = 28; // bar chart area height inside tile
const chartPadT   = 4;  // padding top of chart area

allTiles.forEach((tile, idx) => {
const col  = idx % tilesPerRow;
const rowN = Math.floor(idx / tilesPerRow);
const tx   = margin + col * (tileW + tileGap);
const ty   = curY + rowN * (tileH + tileGap);

```
// Page overflow — add new page for tiles if needed
if (ty + tileH > pageH - 20) return; // skip tiles that overflow (rare)

const [ar, ag, ab] = hexToRgb(tile.color);

// Card background
doc.setFillColor(255, 255, 255);
doc.setDrawColor(226, 232, 240);
doc.setLineWidth(0.4);
doc.roundedRect(tx, ty, tileW, tileH, 3, 3, "FD");

// Left accent bar
doc.setFillColor(ar, ag, ab);
doc.roundedRect(tx, ty, 3, tileH, 1, 1, "F");

const ix = tx + 8; // inner x start

// ── Label ──────────────────────────────────────────────────────────
doc.setFontSize(6.5);
doc.setFont("helvetica", "bold");
doc.setTextColor(71, 85, 105);
const lbl = tile.label.length > 42 ? tile.label.slice(0, 40) + "…" : tile.label;
doc.text(lbl, ix, ty + 11);

// ── Big value ──────────────────────────────────────────────────────
doc.setFontSize(16);
doc.setFont("helvetica", "bold");
doc.setTextColor(ar, ag, ab);
const valStr = tile.value !== null && tile.value !== undefined
  ? `${tile.value}${tile.unit ? " " + tile.unit : ""}`
  : "–";
doc.text(valStr, ix, ty + 26);

// ── Target ─────────────────────────────────────────────────────────
if (tile.target && tile.target !== "-") {
  doc.setFontSize(6);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 116, 139);
  doc.text(`Target: ${tile.target}`, ix, ty + 34);
}

// ── Mini bar chart ─────────────────────────────────────────────────
// Chart area: full tile width minus accent bar and right padding
const chartX = tx + 5;
const chartY = ty + tileH - chartH - 4;
const chartW = tileW - 8;

const series = tile.series || [];
const validVals = series.map(p => p.y).filter(v => v !== null && !isNaN(Number(v))).map(Number);

if (validVals.length > 0) {
  const yMax    = Math.max(...validVals) * 1.1 || 100;
  const targetN = parseFloat(String(tile.target || "").replace("%", ""));
  const barCnt  = series.length;
  const barGap  = chartW / barCnt;
  const barW    = Math.max(1, barGap * 0.65);

  // Light chart bg
  doc.setFillColor(248, 250, 252);
  doc.rect(chartX, chartY, chartW, chartH, "F");

  // Bars
  series.forEach((pt, i) => {
    if (pt.y === null || isNaN(Number(pt.y))) return;
    const v = Number(pt.y);
    const h = Math.max(1, (v / yMax) * chartH);
    const bx = chartX + i * barGap + (barGap - barW) / 2;
    const by = chartY + chartH - h;

    // Bar colour: green if meeting target (or no target), red if not
    let br = ar, bg2 = ag, bb = ab;
    if (!isNaN(targetN)) {
      const meeting = tile.label.toLowerCase().includes("aht")
        ? v <= targetN
        : v >= targetN;
      [br, bg2, bb] = meeting ? [34, 197, 94] : [239, 68, 68];
    }
    doc.setFillColor(br, bg2, bb);
    doc.rect(bx, by, barW, h, "F");
  });

  // Dashed target line
  if (!isNaN(targetN) && targetN > 0) {
    const tLineY = chartY + chartH - (targetN / yMax) * chartH;
    if (tLineY >= chartY && tLineY <= chartY + chartH) {
      doc.setDrawColor(59, 130, 246);
      doc.setLineWidth(0.6);
      doc.setLineDashPattern([2, 2], 0);
      doc.line(chartX, tLineY, chartX + chartW, tLineY);
      doc.setLineDashPattern([], 0);
    }
  }
} else {
  // No data placeholder
  doc.setFontSize(6);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(203, 213, 225);
  doc.text("No chart data", chartX + chartW / 2, chartY + chartH / 2 + 2, { align: "center" });
}
```

});

// Advance past tiles section
const tileRows = Math.ceil(allTiles.length / tilesPerRow);
curY += tileRows * (tileH + tileGap) + 6;

// Section separator
if (curY + 60 > pageH - 20) {
addFooter();
doc.addPage();
curY = 20;
} else {
doc.setDrawColor(226, 232, 240);
doc.setLineWidth(0.4);
doc.line(margin, curY, pageW - margin, curY);
curY += 8;
}

// ════════════════════════════════════════════════════════════════════
// SECTION 2 — FULL DATA TABLE
// Fix: split date columns into chunks that fit the page width,
//      printing Metric + Target on every chunk page
// ════════════════════════════════════════════════════════════════════
doc.setFontSize(8.5);
doc.setFont(“helvetica”, “bold”);
doc.setTextColor(30, 41, 59);
doc.text(“Full Data Table”, margin, curY + 7);
curY += 14;

const dateCols   = columns.filter(c => c.dataIndex !== “metric” && c.dataIndex !== “target”);
const metricW    = 108;
const targetW    = 38;
const fixedW     = metricW + targetW;
const availableW = pageW - margin * 2 - fixedW;

// How many date columns fit per page-chunk?
// Minimum date col width = 36pt. Fit as many as possible.
const minDateW   = 36;
const maxPerChunk = Math.floor(availableW / minDateW);
const dateColW   = availableW / Math.min(dateCols.length, maxPerChunk);

// Split dateCols into chunks
const chunks = [];
for (let i = 0; i < dateCols.length; i += maxPerChunk) {
chunks.push(dateCols.slice(i, i + maxPerChunk));
}

chunks.forEach((chunk, chunkIdx) => {
// Each chunk: new page (except first chunk continues from curY)
if (chunkIdx > 0) {
addFooter();
doc.addPage();

```
  // Repeat page header on continuation pages
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 41, 59);
  doc.text(`Full Data Table (cont.) — Dates ${chunkIdx * maxPerChunk + 1}–${Math.min((chunkIdx + 1) * maxPerChunk, dateCols.length)} of ${dateCols.length}`, margin, 20);
  curY = 28;
}

const head = [["Metric", "Target", ...chunk.map(c => c.title)]];
const body  = allRows.map(r => [
  r.metric,
  r.target ?? "-",
  ...chunk.map(c => {
    const v = r[c.dataIndex];
    return (v === null || v === undefined || v === "") ? "-" : String(v);
  }),
]);

const colStyles = {
  0: { cellWidth: metricW, fontStyle: "bold" },
  1: { cellWidth: targetW, halign: "center" },
};
chunk.forEach((_, i) => {
  colStyles[i + 2] = { cellWidth: dateColW, halign: "center" };
});

doc.autoTable({
  startY: curY,
  head,
  body,
  columnStyles: colStyles,
  headStyles: {
    fillColor: [30, 58, 95],
    textColor: 255,
    fontSize: 6.5,
    fontStyle: "bold",
    halign: "center",
    cellPadding: { top: 3, bottom: 3, left: 2, right: 2 },
  },
  bodyStyles: {
    fontSize: 6.5,
    cellPadding: { top: 2.5, bottom: 2.5, left: 2, right: 2 },
    textColor: [30, 41, 59],
  },
  alternateRowStyles: { fillColor: [248, 250, 252] },
  styles: {
    overflow: "linebreak",
    lineColor: [226, 232, 240],
    lineWidth: 0.3,
  },
  margin: { left: margin, right: margin },
  showHead: "everyPage",
  didDrawPage: () => {
    const total = doc.internal.getNumberOfPages();
    const cur   = doc.internal.getCurrentPageInfo().pageNumber;
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(148, 163, 184);
    doc.text(`Page ${cur} of ${total}`, pageW / 2, pageH - 8, { align: "center" });
  },
});

// Update curY for next chunk (won't be used since chunks get new pages)
curY = doc.lastAutoTable.finalY + 10;
```

});

doc.save(`KPI_Dashboard_${filters.year}.pdf`);
};
