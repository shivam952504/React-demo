// ═══════════════════════════════════════════════════════════════════════
//  TWO FIXES for both handleDownloadExcel and handleDownloadPDF
//
//  Fix 1: Use tableData (metric-filtered rows) instead of allRows
//         Use filteredTiles instead of allTiles
//  Fix 2: Dynamic filename including active filters
// ═══════════════════════════════════════════════════════════════════════


// ── SHARED: filename builder (add this once, above both handlers) ─────────

const buildFileName = (ext) => {
  const parts = [`KPI_Dashboard`, String(filters.year)];

  // Period
  parts.push(viewBy.charAt(0).toUpperCase() + viewBy.slice(1));

  // Month (only for day/week view)
  if (filters.month && (viewBy === "day" || viewBy === "week")) {
    parts.push(filters.month.slice(0, 3)); // "Jan", "Feb" etc.
  }

  // Year type (only for month/quarterly)
  if (viewBy === "month" || viewBy === "quarterly") {
    parts.push(filters.year_type === "Fiscal Year" ? "Fiscal" : "Calendar");
  }

  // Active metric filter
  if (cOn && !bOn && !bqOn)  parts.push("Contractual");
  if (!cOn && bOn && !bqOn)  parts.push("Bonus_Penalty");
  if (!cOn && !bOn && bqOn)  parts.push("Bonus_Qualifier");
  if (cOn && bOn)            parts.push("Contractual_Bonus");
  if (bqOn && (cOn || bOn))  parts.push("BQ");

  // Active dimension filters (skip ALL)
  const dimMap = {
    geo:        "GEO",
    program:    "JC",
    lob:        "LOB",
    supervisor: "SUP",
    tenure_unit:"TEN",
  };
  Object.entries(dimMap).forEach(([key, label]) => {
    const val = filters[key];
    if (Array.isArray(val) && !(val.length === 1 && val[0] === "ALL")) {
      // show first selected value (truncated)
      const first = String(val[0]).replace(/\s+/g, "_").slice(0, 12);
      parts.push(`${label}_${first}${val.length > 1 ? `+${val.length - 1}` : ""}`);
    }
  });

  return parts.join("_") + `.${ext}`;
};


// ════════════════════════════════════════════════════════════════════════
//  REPLACE your handleDownloadExcel with this
// ════════════════════════════════════════════════════════════════════════

const handleDownloadExcel = async () => {
  setShowDownloadMenu(false);

  // ── Use tableData (metric-filtered) instead of allRows ──
  if (!columns.length || !tableData.length) return;

  if (!window.XLSX) {
    await loadScript("https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js");
  }
  const XLSXLib = window.XLSX;

  const dateCols = columns.filter(c => c.dataIndex !== "metric" && c.dataIndex !== "target");
  const header   = ["Metric", "Target", ...dateCols.map(c => c.title)];

  // ── tableData is already filtered by cOn/bOn/bqOn ──
  const dataRows = tableData.map(r => [
    r.metric,
    r.target,
    ...dateCols.map(c => {
      const v = r[c.dataIndex];
      const n = parseFloat(v);
      return (v !== null && v !== undefined && v !== "-" && v !== "" && !isNaN(n))
        ? n : (v ?? "-");
    }),
  ]);

  const ws = XLSXLib.utils.aoa_to_sheet([header, ...dataRows]);

  // Column widths (fix ### issue)
  ws["!cols"] = header.map((h, colIdx) => {
    let max = String(h).length + 4;
    dataRows.slice(0, 50).forEach(row => {
      const cell = row[colIdx];
      if (cell !== null && cell !== undefined)
        max = Math.max(max, String(cell).length + 2);
    });
    if (colIdx >= 2) max = Math.max(max, 13);
    return { wch: max };
  });

  // ── Add a summary info row at top ──
  const metricLabel = [
    cOn  ? "Contractual"     : "",
    bOn  ? "Bonus & Penalty" : "",
    bqOn ? "Bonus Qualifier" : "",
  ].filter(Boolean).join(" + ") || "All";

  const infoRows = [
    ["KPI Dashboard Export"],
    [`Year: ${filters.year}`, `Period: ${viewBy}`, `Month: ${filters.month || "-"}`],
    [`Metric Filter: ${metricLabel}`],
    [`Downloaded: ${new Date().toLocaleString()}`],
    [], // blank row before data
  ];

  // Prepend info rows to sheet
  const infoSheet = XLSXLib.utils.aoa_to_sheet([
    ...infoRows,
    header,
    ...dataRows,
  ]);
  infoSheet["!cols"] = ws["!cols"];

  const wb = XLSXLib.utils.book_new();
  const sheetLabel = `KPI_${filters.year}`.slice(0, 31);
  XLSXLib.utils.book_append_sheet(wb, infoSheet, sheetLabel);

  // ── Dynamic filename ──
  XLSXLib.writeFile(wb, buildFileName("xlsx"));
};


// ════════════════════════════════════════════════════════════════════════
//  REPLACE your handleDownloadPDF with this
//  (combines v5 axis fix + filtered data + dynamic filename)
// ════════════════════════════════════════════════════════════════════════

const handleDownloadPDF = async () => {
  setShowDownloadMenu(false);

  // ── Use tableData + filteredTiles ──
  if (!columns.length || !tableData.length) return;

  await loadScript("https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js");
  await loadScript("https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js");

  const { jsPDF } = window.jspdf;
  const doc  = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 20;

  // ── Helpers ────────────────────────────────────────────────────────
  const hexToRgb = h => {
    const c = (h || "#22c55e").replace("#","");
    if (c.length !== 6) return [34,197,94];
    return [parseInt(c.slice(0,2),16), parseInt(c.slice(2,4),16), parseInt(c.slice(4,6),16)];
  };

  const extractSeriesValues = (tile) => {
    const raw = tile.series;
    if (Array.isArray(raw) && raw.length > 0) {
      const vals = raw.map(p => {
        if (p === null || p === undefined) return null;
        if (typeof p === "number") return isNaN(p) ? null : p;
        if (typeof p === "object") {
          for (const k of ["y","value","v","val","overall"]) {
            if (p[k] !== undefined && p[k] !== null) {
              const n = parseFloat(p[k]); if (!isNaN(n)) return n;
            }
          }
        }
        const n = parseFloat(p); return isNaN(n) ? null : n;
      });
      if (vals.some(v => v !== null)) return vals;
    }
    const key   = tile.key || tile.label;
    const dates = tile.dates || chartDates || [];
    if (dates.length && chartDataMap) {
      return dates.map(d => {
        const r = chartDataMap[d]?.[key];
        if (r === null || r === undefined) return null;
        const v = r?.Overall ?? r?.overall ?? r?.overall_percentage ?? (typeof r !== "object" ? r : null);
        if (v === null || v === undefined) return null;
        const n = parseFloat(String(v).replace("%",""));
        return isNaN(n) ? null : n;
      });
    }
    return [];
  };

  const getXLabel = (dateStr, vb) => {
    const k = String(dateStr).trim();
    if (vb === "day") {
      const iso = k.match(/^\d{4}-\d{2}-(\d{2})$/);
      if (iso) return String(parseInt(iso[1]));
      const dt = new Date(k);
      if (!isNaN(dt.getTime())) return String(dt.getDate());
      return k.split("-").pop() || k;
    }
    if (vb === "week")      { const m=k.match(/^W(?:eek)?(\d{1,2})/i); return m?`W${parseInt(m[1])}`:k.split(" ")[0]; }
    if (vb === "month")     { const my=k.match(/^([a-zA-Z]+)/); return my?my[1].substring(0,3):k.substring(0,3); }
    if (vb === "quarterly") { const qm=k.match(/Q(\d)/i); return qm?`Q${qm[1]}`:k.substring(0,2); }
    return k.split("-").pop() || k;
  };

  // Lower = better metrics
  const LOWER_IS_BETTER = ["aht","average handle time","formal substantiated","complaints","shrinkage","attrition","absenteeism"];

  const drawFooter = () => {
    const total = doc.internal.getNumberOfPages();
    const cur   = doc.internal.getCurrentPageInfo().pageNumber;
    doc.setFontSize(6.5); doc.setFont("helvetica","normal"); doc.setTextColor(148,163,184);
    doc.text(`Page ${cur} of ${total}`, pageW/2, pageH-7, { align:"center" });
  };

  // ── Active filter label for subtitle ──────────────────────────────
  const metricLabel = [
    cOn  ? "Contractual"     : "",
    bOn  ? "Bonus & Penalty" : "",
    bqOn ? "Bonus Qualifier" : "",
  ].filter(Boolean).join(" + ") || "All Metrics";

  const activeDims = Object.entries({ GEO: filters.geo, JC: filters.program, LOB: filters.lob, SUP: filters.supervisor, TEN: filters.tenure_unit })
    .filter(([, v]) => Array.isArray(v) && !(v.length === 1 && v[0] === "ALL"))
    .map(([k, v]) => `${k}: ${v.slice(0,2).join(",")}${v.length>2?`+${v.length-2}`:""}`)
    .join("  ");

  // ════════════════════════════════════════════════════════════════
  //  PAGE HEADER
  // ════════════════════════════════════════════════════════════════
  doc.setFontSize(15); doc.setFont("helvetica","bold"); doc.setTextColor(30,41,59);
  doc.text("KPI Dashboard", pageW/2, 33, { align:"center" });

  doc.setFontSize(7.5); doc.setFont("helvetica","normal"); doc.setTextColor(100,116,139);
  const sub1 = [`Year: ${filters.year}`, filters.month?`Month: ${filters.month}`:"", `Period: ${viewBy}`, `Downloaded: ${new Date().toLocaleDateString()}`].filter(Boolean).join("   |   ");
  doc.text(sub1, pageW/2, 44, { align:"center" });

  // Metric + dim filter line
  doc.setFontSize(7); doc.setTextColor(59,130,246);
  const sub2 = `Metric: ${metricLabel}${activeDims ? "   |   "+activeDims : ""}`;
  doc.text(sub2, pageW/2, 53, { align:"center" });

  doc.setDrawColor(226,232,240); doc.setLineWidth(0.4);
  doc.line(margin, 58, pageW-margin, 58);

  // ════════════════════════════════════════════════════════════════
  //  SECTION 1 — KPI TILES (using filteredTiles)
  // ════════════════════════════════════════════════════════════════
  let curY = 64;

  doc.setFontSize(8.5); doc.setFont("helvetica","bold"); doc.setTextColor(30,41,59);
  doc.text("KPI Summary", margin, curY+7); curY += 14;

  const tilesPerRow = 3;
  const tileGap     = 8;
  const tileW       = (pageW - margin*2 - tileGap*(tilesPerRow-1)) / tilesPerRow;
  const yAxisW=18, xAxisH=10, barAreaH=34;
  const chartTotalH = barAreaH + xAxisH;
  const tilePadTop=4, labelH=9, valueH=20, targetH=8, tilePadBot=5;
  const tileH = tilePadTop + labelH + valueH + targetH + chartTotalH + tilePadBot;

  const availForTiles  = pageH - curY - 24;
  const tileRowsOnPage = Math.max(1, Math.floor(availForTiles / (tileH + tileGap)));
  const tilesOnPage    = tileRowsOnPage * tilesPerRow;

  // ── USE filteredTiles (respects cOn/bOn/bqOn) ──
  const tilePages = [];
  for (let i = 0; i < filteredTiles.length; i += tilesOnPage)
    tilePages.push(filteredTiles.slice(i, i + tilesOnPage));

  tilePages.forEach((pageTiles, pageIdx) => {
    if (pageIdx > 0) {
      drawFooter(); doc.addPage(); curY = 20;
      doc.setFontSize(8.5); doc.setFont("helvetica","bold"); doc.setTextColor(30,41,59);
      doc.text("KPI Summary (cont.)", margin, curY+7); curY += 14;
    }

    pageTiles.forEach((tile, idx) => {
      const col  = idx % tilesPerRow;
      const rowN = Math.floor(idx / tilesPerRow);
      const tx   = margin + col*(tileW+tileGap);
      const ty   = curY + rowN*(tileH+tileGap);
      const [ar,ag,ab] = hexToRgb(tile.color);

      // Card
      doc.setFillColor(255,255,255); doc.setDrawColor(226,232,240); doc.setLineWidth(0.4);
      doc.roundedRect(tx, ty, tileW, tileH, 3, 3, "FD");
      doc.setFillColor(ar,ag,ab);
      doc.roundedRect(tx, ty, 3, tileH, 1, 1, "F");

      const ix = tx+7;
      let iy   = ty+tilePadTop;

      // Label
      doc.setFontSize(6.5); doc.setFont("helvetica","bold"); doc.setTextColor(71,85,105);
      doc.text(tile.label.length>44?tile.label.slice(0,42)+"…":tile.label, ix, iy+7); iy+=labelH;

      // Value
      doc.setFontSize(17); doc.setFont("helvetica","bold"); doc.setTextColor(ar,ag,ab);
      const valStr = (tile.value!==null&&tile.value!==undefined)?`${tile.value}${tile.unit?" "+tile.unit:""}`:"–";
      doc.text(valStr, ix, iy+15); iy+=valueH;

      // Target
      if (tile.target && tile.target!=="-") {
        doc.setFontSize(6); doc.setFont("helvetica","normal"); doc.setTextColor(100,116,139);
        doc.text(`Target: ${tile.target}`, ix, iy+6);
      }
      iy+=targetH;

      // Chart coords
      const chartLeft  = tx+4+yAxisW;
      const chartRight = tx+tileW-4;
      const chartW     = chartRight-chartLeft;
      const barTop     = iy;
      const barBot     = iy+barAreaH;

      const yVals  = extractSeriesValues(tile);
      const validV = yVals.filter(v=>v!==null&&!isNaN(v)).map(Number);
      const tileDates = tile.dates || chartDates || [];
      const isLowerBetter = LOWER_IS_BETTER.some(k=>tile.label.toLowerCase().includes(k));

      if (validV.length > 0) {
        const rawMax = Math.max(...validV)*1.08;
        const yMax   = Math.ceil(rawMax/10)*10||100;
        const yMid   = Math.round(yMax/2);
        const yRange = yMax;
        const targetN = parseFloat(String(tile.target||"").replace("%",""));
        const barCnt  = yVals.length;
        const barGap  = chartW/Math.max(barCnt,1);
        const barW    = Math.max(1.5, barGap*0.68);
        const labelW  = 7;
        const maxLbls = Math.floor(chartW/labelW);
        const step    = Math.max(1, Math.ceil(barCnt/maxLbls));

        // Grid lines
        doc.setDrawColor(220,228,238); doc.setLineWidth(0.2);
        doc.line(chartLeft,barTop,chartRight,barTop);
        const midY = barBot-(yMid/yRange)*barAreaH;
        doc.line(chartLeft,midY,chartRight,midY);
        doc.setDrawColor(180,196,210); doc.setLineWidth(0.4);
        doc.line(chartLeft,barBot,chartRight,barBot);

        // Y labels
        const yLX = tx+4+yAxisW-2;
        doc.setFontSize(5); doc.setFont("helvetica","normal"); doc.setTextColor(148,163,184);
        doc.text(String(yMax), yLX, barTop+4, {align:"right"});
        doc.text(String(yMid), yLX, midY+2,   {align:"right"});
        doc.text("0",          yLX, barBot,    {align:"right"});

        // Bars + X labels
        yVals.forEach((v,i) => {
          const bx = chartLeft+i*barGap+(barGap-barW)/2;
          if (v===null||isNaN(v)) {
            doc.setFillColor(241,245,249); doc.rect(bx,barBot-2,barW,2,"F"); return;
          }
          const h  = Math.max(1.5,(v/yRange)*barAreaH);
          const by = barBot-h;
          let br=ar,bg2=ag,bb=ab;
          if (!isNaN(targetN) && targetN>0) {
            // ── FIXED: use isLowerBetter instead of just isAHT ──
            const meeting = isLowerBetter ? v<=targetN : v>=targetN;
            [br,bg2,bb] = meeting?[34,197,94]:[239,68,68];
          }
          doc.setFillColor(br,bg2,bb);
          doc.rect(bx,by,barW,h,"F");

          if (i%step===0) {
            const lx  = chartLeft+i*barGap+barGap/2;
            const lbl = tileDates[i]?getXLabel(tileDates[i],tile.viewBy||viewBy):String(i+1);
            doc.setFontSize(4.5); doc.setFont("helvetica","normal"); doc.setTextColor(148,163,184);
            doc.text(lbl, lx, barBot+xAxisH, {align:"center"});
          }
        });

        // Target line
        if (!isNaN(targetN)&&targetN>0&&targetN<=yMax) {
          const tLineY = barBot-(targetN/yRange)*barAreaH;
          doc.setDrawColor(59,130,246); doc.setLineWidth(0.8);
          doc.setLineDashPattern([2,2],0);
          doc.line(chartLeft,tLineY,chartRight,tLineY);
          doc.setLineDashPattern([],0);
        }
      } else {
        doc.setFillColor(248,250,252); doc.setDrawColor(241,245,249); doc.setLineWidth(0.2);
        doc.rect(chartLeft,barTop,chartW,barAreaH,"FD");
        doc.setDrawColor(180,196,210); doc.setLineWidth(0.4);
        doc.line(chartLeft,barBot,chartRight,barBot);
        doc.setFontSize(6); doc.setFont("helvetica","italic"); doc.setTextColor(203,213,225);
        doc.text("No chart data", chartLeft+chartW/2, barTop+barAreaH/2+2, {align:"center"});
      }
    });

    const rows = Math.ceil(pageTiles.length/tilesPerRow);
    curY += rows*(tileH+tileGap)+4;
  });

  // ── Separator ────────────────────────────────────────────────────────
  if (curY+60>pageH-20) { drawFooter(); doc.addPage(); curY=20; }
  else {
    doc.setDrawColor(226,232,240); doc.setLineWidth(0.4);
    doc.line(margin,curY,pageW-margin,curY); curY+=8;
  }

  // ════════════════════════════════════════════════════════════════
  //  SECTION 2 — FULL DATA TABLE (using tableData = filtered rows)
  // ════════════════════════════════════════════════════════════════
  doc.setFontSize(8.5); doc.setFont("helvetica","bold"); doc.setTextColor(30,41,59);
  doc.text(`Full Data Table — ${metricLabel}`, margin, curY+7); curY+=14;

  const dateCols    = columns.filter(c=>c.dataIndex!=="metric"&&c.dataIndex!=="target");
  const metricColW  = 110, targetColW = 38;
  const availW      = pageW-margin*2-metricColW-targetColW;
  const minDateColW = 36;
  const maxPerChunk = Math.floor(availW/minDateColW);
  const dateColW    = availW/Math.min(dateCols.length,maxPerChunk);

  const chunks = [];
  for (let i=0; i<dateCols.length; i+=maxPerChunk)
    chunks.push(dateCols.slice(i,i+maxPerChunk));

  chunks.forEach((chunk, chunkIdx) => {
    if (chunkIdx>0) {
      drawFooter(); doc.addPage();
      doc.setFontSize(8.5); doc.setFont("helvetica","bold"); doc.setTextColor(30,41,59);
      doc.text(`Full Data Table (cont.) — cols ${chunkIdx*maxPerChunk+1}–${Math.min((chunkIdx+1)*maxPerChunk,dateCols.length)} of ${dateCols.length}`, margin, 20);
      curY=28;
    }

    const head = [["Metric","Target",...chunk.map(c=>c.title)]];

    // ── USE tableData (metric-filtered rows) ──
    const body = tableData.map(r=>[
      r.metric,
      r.target??"-",
      ...chunk.map(c=>{
        const v=r[c.dataIndex];
        return (v===null||v===undefined||v==="")?"-":String(v);
      }),
    ]);

    const colStyles = {
      0:{cellWidth:metricColW,fontStyle:"bold"},
      1:{cellWidth:targetColW,halign:"center"},
    };
    chunk.forEach((_,i)=>{ colStyles[i+2]={cellWidth:dateColW,halign:"center"}; });

    doc.autoTable({
      startY:curY, head, body, columnStyles:colStyles,
      headStyles:{ fillColor:[30,58,95],textColor:255,fontSize:6.5,fontStyle:"bold",halign:"center",cellPadding:{top:3,bottom:3,left:2,right:2} },
      bodyStyles:{ fontSize:6.5,cellPadding:{top:2.5,bottom:2.5,left:2,right:2},textColor:[30,41,59] },
      alternateRowStyles:{ fillColor:[248,250,252] },
      styles:{ overflow:"linebreak",lineColor:[226,232,240],lineWidth:0.3 },
      margin:{left:margin,right:margin},
      showHead:"everyPage",
      didDrawPage:()=>{
        const total=doc.internal.getNumberOfPages();
        const cur=doc.internal.getCurrentPageInfo().pageNumber;
        doc.setFontSize(6.5); doc.setFont("helvetica","normal"); doc.setTextColor(148,163,184);
        doc.text(`Page ${cur} of ${total}`,pageW/2,pageH-7,{align:"center"});
      },
    });

    curY = doc.lastAutoTable.finalY+10;
  });

  // ── Dynamic filename ──
  doc.save(buildFileName("pdf"));
};
