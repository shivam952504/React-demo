// ═══════════════════════════════════════════════════════════════════════
//  REPLACE your entire handleDownloadPDF with this function.
//  Fix: proper X-axis (day labels) + Y-axis (0, mid, max) on each tile
//       matching the UI bar chart appearance closely
// ═══════════════════════════════════════════════════════════════════════

const handleDownloadPDF = async () => {
setShowDownloadMenu(false);
if (!columns.length || !allRows.length) return;

await loadScript(“https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js”);
await loadScript(“https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js”);

const { jsPDF } = window.jspdf;
const doc  = new jsPDF({ orientation: “landscape”, unit: “pt”, format: “a4” });
const pageW = doc.internal.pageSize.getWidth();   // 841.89
const pageH = doc.internal.pageSize.getHeight();  // 595.28
const margin = 20;

// ── Colour helpers ────────────────────────────────────────────────────
const hexToRgb = h => {
const c = (h || “#22c55e”).replace(”#”, “”);
if (c.length !== 6) return [34, 197, 94];
return [parseInt(c.slice(0,2),16), parseInt(c.slice(2,4),16), parseInt(c.slice(4,6),16)];
};

// ── Robust series extractor (same as v4) ──────────────────────────────
const extractSeriesValues = (tile) => {
const raw = tile.series;
if (Array.isArray(raw) && raw.length > 0) {
const vals = raw.map(p => {
if (p === null || p === undefined) return null;
if (typeof p === “number”) return isNaN(p) ? null : p;
if (typeof p === “object”) {
for (const k of [“y”,“value”,“v”,“val”,“overall”]) {
if (p[k] !== undefined && p[k] !== null) {
const n = parseFloat(p[k]); if (!isNaN(n)) return n;
}
}
}
const n = parseFloat(p); return isNaN(n) ? null : n;
});
if (vals.some(v => v !== null)) return vals;
}
// Fallback to chartDataMap
const key   = tile.key || tile.label;
const dates = tile.dates || chartDates || [];
if (dates.length && chartDataMap) {
return dates.map(d => {
const r = chartDataMap[d]?.[key];
if (r === null || r === undefined) return null;
const v = r?.Overall ?? r?.overall ?? r?.overall_percentage ?? (typeof r !== “object” ? r : null);
if (v === null || v === undefined) return null;
const n = parseFloat(String(v).replace(”%”,””));
return isNaN(n) ? null : n;
});
}
return [];
};

// ── X-axis label helper (matches xLabel() in component) ─────────────
const getXLabel = (dateStr, vb) => {
const k = String(dateStr).trim();
if (vb === “day”) {
// “2026-01-05” → “5”
const iso = k.match(/^\d{4}-\d{2}-(\d{2})$/);
if (iso) return String(parseInt(iso[1]));
const dt = new Date(k);
if (!isNaN(dt.getTime())) return String(dt.getDate());
return k.split(”-”).pop() || k;
}
if (vb === “week”) {
const m = k.match(/^W(?:eek)?(\d{1,2})/i);
return m ? `W${parseInt(m[1])}` : k.split(” “)[0];
}
if (vb === “month”) {
const my = k.match(/^([a-zA-Z]+)/);
return my ? my[1].substring(0,3) : k.substring(0,3);
}
if (vb === “quarterly”) {
const qm = k.match(/Q(\d)/i); return qm ? `Q${qm[1]}` : k.substring(0,2);
}
return k.split(”-”).pop() || k;
};

// ── Footer ────────────────────────────────────────────────────────────
const drawFooter = () => {
const total = doc.internal.getNumberOfPages();
const cur   = doc.internal.getCurrentPageInfo().pageNumber;
doc.setFontSize(6.5);
doc.setFont(“helvetica”,“normal”);
doc.setTextColor(148,163,184);
doc.text(`Page ${cur} of ${total}`, pageW/2, pageH - 7, { align:“center” });
};

// ════════════════════════════════════════════════════════════════════
//  PAGE 1 HEADER
// ════════════════════════════════════════════════════════════════════
doc.setFontSize(15);
doc.setFont(“helvetica”,“bold”);
doc.setTextColor(30,41,59);
doc.text(“KPI Dashboard”, pageW/2, 33, { align:“center” });

doc.setFontSize(8);
doc.setFont(“helvetica”,“normal”);
doc.setTextColor(100,116,139);
const sub = [
`Year: ${filters.year}`,
filters.month ? `Month: ${filters.month}` : “”,
`Period: ${viewBy}`,
`Downloaded: ${new Date().toLocaleDateString()}`,
].filter(Boolean).join(”   |   “);
doc.text(sub, pageW/2, 45, { align:“center” });

doc.setDrawColor(226,232,240); doc.setLineWidth(0.4);
doc.line(margin, 51, pageW-margin, 51);

// ════════════════════════════════════════════════════════════════════
//  SECTION 1 — KPI TILES  (3 per row, with proper axes)
// ════════════════════════════════════════════════════════════════════
let curY = 57;

doc.setFontSize(8.5); doc.setFont(“helvetica”,“bold”); doc.setTextColor(30,41,59);
doc.text(“KPI Summary”, margin, curY+7);
curY += 14;

const tilesPerRow = 3;
const tileGap     = 8;
const tileW       = (pageW - margin*2 - tileGap*(tilesPerRow-1)) / tilesPerRow;

// Layout inside tile:
//  top pad 4 | label 8 | value 18 | target 8 | yAxis+bars+xAxis area | bottom pad 4
const yAxisW    = 18;  // space for Y axis labels on left
const xAxisH    = 10;  // space for X axis labels on bottom
const barAreaH  = 34;  // height of bars only
const chartTotalH = barAreaH + xAxisH; // 44
const tilePadTop  = 4;
const labelH      = 9;
const valueH      = 20;
const targetH     = 8;
const tilePadBot  = 5;
const tileH = tilePadTop + labelH + valueH + targetH + chartTotalH + tilePadBot; // ~90

// How many tile rows fit per page
const availForTiles  = pageH - curY - 24;
const tileRowsOnPage = Math.max(1, Math.floor(availForTiles / (tileH + tileGap)));
const tilesOnPage    = tileRowsOnPage * tilesPerRow;

const tilePages = [];
for (let i = 0; i < allTiles.length; i += tilesOnPage)
tilePages.push(allTiles.slice(i, i + tilesOnPage));

tilePages.forEach((pageTiles, pageIdx) => {
if (pageIdx > 0) {
drawFooter(); doc.addPage(); curY = 20;
doc.setFontSize(8.5); doc.setFont(“helvetica”,“bold”); doc.setTextColor(30,41,59);
doc.text(“KPI Summary (cont.)”, margin, curY+7); curY += 14;
}

```
pageTiles.forEach((tile, idx) => {
  const col  = idx % tilesPerRow;
  const rowN = Math.floor(idx / tilesPerRow);
  const tx   = margin + col*(tileW + tileGap);
  const ty   = curY + rowN*(tileH + tileGap);

  const [ar,ag,ab] = hexToRgb(tile.color);

  // ── Card shell ────────────────────────────────────────────────────
  doc.setFillColor(255,255,255);
  doc.setDrawColor(226,232,240); doc.setLineWidth(0.4);
  doc.roundedRect(tx, ty, tileW, tileH, 3, 3, "FD");

  // Accent bar (left edge)
  doc.setFillColor(ar,ag,ab);
  doc.roundedRect(tx, ty, 3, tileH, 1, 1, "F");

  const ix = tx + 7; // inner x (after accent bar + padding)
  let iy   = ty + tilePadTop;

  // ── Label ─────────────────────────────────────────────────────────
  doc.setFontSize(6.5); doc.setFont("helvetica","bold"); doc.setTextColor(71,85,105);
  const lbl = tile.label.length > 44 ? tile.label.slice(0,42)+"…" : tile.label;
  doc.text(lbl, ix, iy + 7); iy += labelH;

  // ── Big value ─────────────────────────────────────────────────────
  doc.setFontSize(17); doc.setFont("helvetica","bold"); doc.setTextColor(ar,ag,ab);
  const valStr = (tile.value !== null && tile.value !== undefined)
    ? `${tile.value}${tile.unit ? " "+tile.unit : ""}` : "–";
  doc.text(valStr, ix, iy + 15); iy += valueH;

  // ── Target ────────────────────────────────────────────────────────
  if (tile.target && tile.target !== "-") {
    doc.setFontSize(6); doc.setFont("helvetica","normal"); doc.setTextColor(100,116,139);
    doc.text(`Target: ${tile.target}`, ix, iy + 6);
  }
  iy += targetH;

  // ── Chart layout ──────────────────────────────────────────────────
  // Y-axis label column: tx+4 to tx+4+yAxisW
  // Bar area: tx+4+yAxisW  to  tx+tileW-4
  // X-axis labels: below bar area, height xAxisH
  const chartLeft  = tx + 4 + yAxisW;
  const chartRight = tx + tileW - 4;
  const chartW     = chartRight - chartLeft;
  const barTop     = iy;               // top of bar area
  const barBot     = iy + barAreaH;    // bottom of bar area = x-axis baseline
  const xLabTop    = barBot;           // x-axis label row starts here
  // iy after chart
  iy += chartTotalH;

  const yVals    = extractSeriesValues(tile);
  const validV   = yVals.filter(v => v !== null && !isNaN(v)).map(Number);
  const tileDates = tile.dates || chartDates || [];

  if (validV.length > 0) {
    const rawMax  = Math.max(...validV) * 1.08;
    const yMax    = Math.ceil(rawMax / 10) * 10 || 100;
    const yMid    = Math.round(yMax / 2);
    const yRange  = yMax; // since yMin = 0

    const targetN = parseFloat(String(tile.target || "").replace("%",""));
    const isAHT   = tile.label.toLowerCase().includes("aht");
    const barCnt  = yVals.length;
    const barGap  = chartW / Math.max(barCnt, 1);
    const barW    = Math.max(1.5, barGap * 0.68);

    // ── Y-axis horizontal grid lines ────────────────────────────────
    doc.setDrawColor(220,228,238); doc.setLineWidth(0.2);
    // top line (yMax)
    doc.line(chartLeft, barTop, chartRight, barTop);
    // mid line (yMid)
    const midY = barBot - (yMid / yRange) * barAreaH;
    doc.line(chartLeft, midY, chartRight, midY);
    // baseline (0)
    doc.setDrawColor(180,196,210); doc.setLineWidth(0.4);
    doc.line(chartLeft, barBot, chartRight, barBot);

    // ── Y-axis labels ───────────────────────────────────────────────
    const yLabelX = tx + 4 + yAxisW - 2; // right-align inside yAxisW
    doc.setFontSize(5); doc.setFont("helvetica","normal"); doc.setTextColor(148,163,184);
    doc.text(String(yMax), yLabelX, barTop + 4, { align:"right" });
    doc.text(String(yMid), yLabelX, midY  + 2, { align:"right" });
    doc.text("0",          yLabelX, barBot,     { align:"right" });

    // ── Bars ─────────────────────────────────────────────────────────
    // Step for X labels: show every Nth to avoid overlap
    // Estimate label width ~5pt per char; labels are 1-2 chars wide
    const labelW     = 7; // pt per label slot
    const maxLabels  = Math.floor(chartW / labelW);
    const step       = Math.max(1, Math.ceil(barCnt / maxLabels));

    yVals.forEach((v, i) => {
      const bx = chartLeft + i * barGap + (barGap - barW) / 2;

      if (v === null || isNaN(v)) {
        // Draw faint placeholder bar slot
        doc.setFillColor(241,245,249);
        doc.rect(bx, barBot - 2, barW, 2, "F");
        return;
      }

      const h = Math.max(1.5, (v / yRange) * barAreaH);
      const by = barBot - h;

      // Colour: green = meeting, red = not, default accent
      let br=ar, bg2=ag, bb=ab;
      if (!isNaN(targetN) && targetN > 0) {
        const meeting = isAHT ? v <= targetN : v >= targetN;
        [br,bg2,bb] = meeting ? [34,197,94] : [239,68,68];
      }
      doc.setFillColor(br,bg2,bb);
      doc.rect(bx, by, barW, h, "F");

      // ── X-axis label ──────────────────────────────────────────────
      if (i % step === 0) {
        const lx = chartLeft + i*barGap + barGap/2;
        const lbl = tileDates[i] ? getXLabel(tileDates[i], tile.viewBy || viewBy) : String(i+1);
        doc.setFontSize(4.5); doc.setFont("helvetica","normal"); doc.setTextColor(148,163,184);
        doc.text(lbl, lx, xLabTop + 7, { align:"center" });
      }
    });

    // ── Dashed target line ────────────────────────────────────────────
    if (!isNaN(targetN) && targetN > 0 && targetN <= yMax) {
      const tLineY = barBot - (targetN / yRange) * barAreaH;
      doc.setDrawColor(59,130,246); doc.setLineWidth(0.8);
      doc.setLineDashPattern([2,2], 0);
      doc.line(chartLeft, tLineY, chartRight, tLineY);
      doc.setLineDashPattern([], 0);
    }

  } else {
    // No data
    doc.setFillColor(248,250,252); doc.setDrawColor(241,245,249); doc.setLineWidth(0.2);
    doc.rect(chartLeft, barTop, chartW, barAreaH, "FD");
    // Baseline
    doc.setDrawColor(180,196,210); doc.setLineWidth(0.4);
    doc.line(chartLeft, barBot, chartRight, barBot);
    doc.setFontSize(6); doc.setFont("helvetica","italic"); doc.setTextColor(203,213,225);
    doc.text("No chart data", chartLeft + chartW/2, barTop + barAreaH/2 + 2, { align:"center" });
  }
}); // end pageTiles.forEach

const rows = Math.ceil(pageTiles.length / tilesPerRow);
curY += rows * (tileH + tileGap) + 4;
```

}); // end tilePages.forEach

// ── Separator ─────────────────────────────────────────────────────────
if (curY + 60 > pageH - 20) {
drawFooter(); doc.addPage(); curY = 20;
} else {
doc.setDrawColor(226,232,240); doc.setLineWidth(0.4);
doc.line(margin, curY, pageW-margin, curY); curY += 8;
}

// ════════════════════════════════════════════════════════════════════
//  SECTION 2 — FULL DATA TABLE (chunked across pages)
// ════════════════════════════════════════════════════════════════════
doc.setFontSize(8.5); doc.setFont(“helvetica”,“bold”); doc.setTextColor(30,41,59);
doc.text(“Full Data Table”, margin, curY+7); curY += 14;

const dateCols    = columns.filter(c => c.dataIndex !== “metric” && c.dataIndex !== “target”);
const metricW     = 110;
const targetW     = 38;
const availW      = pageW - margin*2 - metricW - targetW;
const minDateColW = 36;
const maxPerChunk = Math.floor(availW / minDateColW);
const dateColW    = availW / Math.min(dateCols.length, maxPerChunk);

const chunks = [];
for (let i = 0; i < dateCols.length; i += maxPerChunk)
chunks.push(dateCols.slice(i, i + maxPerChunk));

chunks.forEach((chunk, chunkIdx) => {
if (chunkIdx > 0) {
drawFooter(); doc.addPage();
doc.setFontSize(8.5); doc.setFont(“helvetica”,“bold”); doc.setTextColor(30,41,59);
doc.text(
`Full Data Table (cont.) — columns ${chunkIdx*maxPerChunk+1}–${Math.min((chunkIdx+1)*maxPerChunk, dateCols.length)} of ${dateCols.length}`,
margin, 20
);
curY = 28;
}

```
const head = [["Metric","Target",...chunk.map(c=>c.title)]];
const body  = allRows.map(r=>[
  r.metric,
  r.target ?? "-",
  ...chunk.map(c=>{
    const v = r[c.dataIndex];
    return (v===null||v===undefined||v==="") ? "-" : String(v);
  }),
]);

const colStyles = {
  0: { cellWidth: metricW, fontStyle:"bold" },
  1: { cellWidth: targetW, halign:"center" },
};
chunk.forEach((_,i) => { colStyles[i+2] = { cellWidth: dateColW, halign:"center" }; });

doc.autoTable({
  startY: curY,
  head, body,
  columnStyles: colStyles,
  headStyles: {
    fillColor:[30,58,95], textColor:255, fontSize:6.5,
    fontStyle:"bold", halign:"center",
    cellPadding:{ top:3, bottom:3, left:2, right:2 },
  },
  bodyStyles: {
    fontSize:6.5,
    cellPadding:{ top:2.5, bottom:2.5, left:2, right:2 },
    textColor:[30,41,59],
  },
  alternateRowStyles: { fillColor:[248,250,252] },
  styles: { overflow:"linebreak", lineColor:[226,232,240], lineWidth:0.3 },
  margin: { left:margin, right:margin },
  showHead:"everyPage",
  didDrawPage: () => {
    const total = doc.internal.getNumberOfPages();
    const cur   = doc.internal.getCurrentPageInfo().pageNumber;
    doc.setFontSize(6.5); doc.setFont("helvetica","normal"); doc.setTextColor(148,163,184);
    doc.text(`Page ${cur} of ${total}`, pageW/2, pageH-7, { align:"center" });
  },
});

curY = doc.lastAutoTable.finalY + 10;
```

});

doc.save(`KPI_Dashboard_${filters.year}.pdf`);
};
