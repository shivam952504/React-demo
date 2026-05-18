// ═══════════════════════════════════════════════════════════════════════
//  REPLACE your entire handleDownloadPDF with this function.
//  Key fix: robust series data reading — handles all shapes of tile.series
//  Also: chartDataMap fallback if tile.series is empty/null
// ═══════════════════════════════════════════════════════════════════════

const handleDownloadPDF = async () => {
setShowDownloadMenu(false);
if (!columns.length || !allRows.length) return;

await loadScript(“https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js”);
await loadScript(“https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js”);

const { jsPDF } = window.jspdf;

const doc = new jsPDF({ orientation: “landscape”, unit: “pt”, format: “a4” });
const pageW  = doc.internal.pageSize.getWidth();
const pageH  = doc.internal.pageSize.getHeight();
const margin = 20;

// ── helpers ──────────────────────────────────────────────────────────
const hexToRgb = h => {
const c = (h || “#22c55e”).replace(”#”, “”);
if (c.length !== 6) return [34, 197, 94];
return [parseInt(c.slice(0,2),16), parseInt(c.slice(2,4),16), parseInt(c.slice(4,6),16)];
};

// Robustly extract numeric y-values from a tile’s series array.
// tile.series can be:
//   [{y: 93.44, c: “#22c55e”}, …]   ← standard
//   [93.44, 97.56, …]               ← plain numbers
//   [{value: 93.44}, …]             ← alternate key
//   null / undefined                  ← missing
// Falls back to chartDataMap if series is empty.
const extractSeriesValues = (tile) => {
let raw = tile.series;

```
// Try series array first
if (Array.isArray(raw) && raw.length > 0) {
  const vals = raw.map(p => {
    if (p === null || p === undefined) return null;
    if (typeof p === "number")         return isNaN(p) ? null : p;
    if (typeof p === "object") {
      // try common keys
      for (const k of ["y", "value", "v", "val", "overall"]) {
        if (p[k] !== undefined && p[k] !== null) {
          const n = parseFloat(p[k]);
          if (!isNaN(n)) return n;
        }
      }
    }
    const n = parseFloat(p);
    return isNaN(n) ? null : n;
  });
  const hasAny = vals.some(v => v !== null);
  if (hasAny) return vals;
}

// Fallback: read from chartDataMap using tile.key and tile.dates
const key   = tile.key || tile.label;
const dates = tile.dates || chartDates || [];
if (dates.length && chartDataMap) {
  return dates.map(d => {
    const raw = chartDataMap[d]?.[key];
    if (raw === null || raw === undefined) return null;
    // getOverall equivalent inline
    const v = raw?.Overall ?? raw?.overall ?? raw?.overall_percentage ?? (typeof raw !== "object" ? raw : null);
    if (v === null || v === undefined) return null;
    const n = parseFloat(String(v).replace("%", ""));
    return isNaN(n) ? null : n;
  });
}

return [];
```

};

const drawFooter = () => {
const total = doc.internal.getNumberOfPages();
const cur   = doc.internal.getCurrentPageInfo().pageNumber;
doc.setFontSize(7);
doc.setFont(“helvetica”, “normal”);
doc.setTextColor(148, 163, 184);
doc.text(`Page ${cur} of ${total}`, pageW / 2, pageH - 8, { align: “center” });
};

// ── Page header ───────────────────────────────────────────────────────
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
// SECTION 1 — KPI TILES
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
const tileH       = 95;
const chartAreaH  = 32; // bar chart height

// Figure out how many tile rows fit on this page
const availForTiles  = pageH - curY - 30; // leave 30pt for footer
const tileRowsOnPage = Math.floor(availForTiles / (tileH + tileGap));
const tilesOnPage    = tileRowsOnPage * tilesPerRow;

// If tiles overflow one page, split across pages
const tilePages = [];
for (let i = 0; i < allTiles.length; i += tilesOnPage) {
tilePages.push(allTiles.slice(i, i + tilesOnPage));
}

tilePages.forEach((pageTiles, pageIdx) => {
if (pageIdx > 0) {
drawFooter();
doc.addPage();
curY = 20;
doc.setFontSize(8.5);
doc.setFont(“helvetica”, “bold”);
doc.setTextColor(30, 41, 59);
doc.text(“KPI Summary (cont.)”, margin, curY + 7);
curY += 14;
}

```
pageTiles.forEach((tile, idx) => {
  const col  = idx % tilesPerRow;
  const rowN = Math.floor(idx / tilesPerRow);
  const tx   = margin + col * (tileW + tileGap);
  const ty   = curY + rowN * (tileH + tileGap);

  const [ar, ag, ab] = hexToRgb(tile.color);

  // Card
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.4);
  doc.roundedRect(tx, ty, tileW, tileH, 3, 3, "FD");

  // Left accent
  doc.setFillColor(ar, ag, ab);
  doc.roundedRect(tx, ty, 3, tileH, 1, 1, "F");

  const ix = tx + 9;

  // Label
  doc.setFontSize(6.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(71, 85, 105);
  const lbl = tile.label.length > 44 ? tile.label.slice(0, 42) + "…" : tile.label;
  doc.text(lbl, ix, ty + 12);

  // Value
  doc.setFontSize(17);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(ar, ag, ab);
  const valStr = (tile.value !== null && tile.value !== undefined)
    ? `${tile.value}${tile.unit ? " " + tile.unit : ""}`
    : "–";
  doc.text(valStr, ix, ty + 28);

  // Target
  if (tile.target && tile.target !== "-") {
    doc.setFontSize(6);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 116, 139);
    doc.text(`Target: ${tile.target}`, ix, ty + 37);
  }

  // ── Bar chart ───────────────────────────────────────────────────
  const chartX = tx + 5;
  const chartY = ty + tileH - chartAreaH - 5;
  const chartW = tileW - 10;

  const yVals = extractSeriesValues(tile);
  const validVals = yVals.filter(v => v !== null && !isNaN(v));

  if (validVals.length > 0) {
    const yMax    = Math.max(...validVals) * 1.08 || 100;
    const targetN = parseFloat(String(tile.target || "").replace("%", ""));
    const isAHT   = tile.label.toLowerCase().includes("aht");
    const barCnt  = yVals.length;
    const barGap  = chartW / barCnt;
    const barW    = Math.max(1.5, barGap * 0.7);

    // Subtle chart bg
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(241, 245, 249);
    doc.setLineWidth(0.2);
    doc.rect(chartX, chartY, chartW, chartAreaH, "FD");

    // Draw each bar
    yVals.forEach((v, i) => {
      if (v === null || isNaN(v)) return;
      const h  = Math.max(1.5, (v / yMax) * chartAreaH);
      const bx = chartX + i * barGap + (barGap - barW) / 2;
      const by = chartY + chartAreaH - h;

      // Colour logic: green = meeting, red = not meeting
      let br = ar, bg2 = ag, bb = ab; // default = tile accent colour
      if (!isNaN(targetN) && targetN > 0) {
        const meeting = isAHT ? v <= targetN : v >= targetN;
        [br, bg2, bb] = meeting ? [34, 197, 94] : [239, 68, 68];
      }

      doc.setFillColor(br, bg2, bb);
      doc.rect(bx, by, barW, h, "F");
    });

    // Target dashed line
    if (!isNaN(targetN) && targetN > 0 && targetN <= yMax) {
      const tY = chartY + chartAreaH - (targetN / yMax) * chartAreaH;
      doc.setDrawColor(59, 130, 246);
      doc.setLineWidth(0.7);
      doc.setLineDashPattern([2, 2], 0);
      doc.line(chartX, tY, chartX + chartW, tY);
      doc.setLineDashPattern([], 0);
    }

    // Y-axis max label (top-right of chart)
    doc.setFontSize(5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(148, 163, 184);
    doc.text(String(Math.round(yMax)), chartX + chartW - 1, chartY + 6, { align: "right" });

  } else {
    // No data text
    doc.setFontSize(6);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(203, 213, 225);
    doc.setFillColor(248, 250, 252);
    doc.rect(chartX, chartY, chartW, chartAreaH, "F");
    doc.text("No chart data", chartX + chartW / 2, chartY + chartAreaH / 2 + 2, { align: "center" });
  }
});

// Advance curY for next tile page section
const rows = Math.ceil(pageTiles.length / tilesPerRow);
curY += rows * (tileH + tileGap) + 6;
```

});

// ── Separator before table ────────────────────────────────────────────
if (curY + 60 > pageH - 20) {
drawFooter();
doc.addPage();
curY = 20;
} else {
doc.setDrawColor(226, 232, 240);
doc.setLineWidth(0.4);
doc.line(margin, curY, pageW - margin, curY);
curY += 8;
}

// ════════════════════════════════════════════════════════════════════
// SECTION 2 — FULL DATA TABLE (chunked by date columns)
// ════════════════════════════════════════════════════════════════════
doc.setFontSize(8.5);
doc.setFont(“helvetica”, “bold”);
doc.setTextColor(30, 41, 59);
doc.text(“Full Data Table”, margin, curY + 7);
curY += 14;

const dateCols    = columns.filter(c => c.dataIndex !== “metric” && c.dataIndex !== “target”);
const metricW     = 110;
const targetW     = 38;
const availW      = pageW - margin * 2 - metricW - targetW;
const minDateColW = 36;
const maxPerChunk = Math.floor(availW / minDateColW);
const dateColW    = availW / Math.min(dateCols.length, maxPerChunk);

const chunks = [];
for (let i = 0; i < dateCols.length; i += maxPerChunk) {
chunks.push(dateCols.slice(i, i + maxPerChunk));
}

chunks.forEach((chunk, chunkIdx) => {
if (chunkIdx > 0) {
drawFooter();
doc.addPage();
doc.setFontSize(8.5);
doc.setFont(“helvetica”, “bold”);
doc.setTextColor(30, 41, 59);
doc.text(
`Full Data Table (cont.) — columns ${chunkIdx * maxPerChunk + 1}–${Math.min((chunkIdx+1)*maxPerChunk, dateCols.length)} of ${dateCols.length}`,
margin, 20
);
curY = 28;
}

```
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

curY = doc.lastAutoTable.finalY + 10;
```

});

doc.save(`KPI_Dashboard_${filters.year}.pdf`);
};
