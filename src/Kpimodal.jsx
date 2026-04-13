// ─── INFO MODAL STATE (add near your other useState declarations) ───────────
// const [infoTile, setInfoTile] = useState(null);   // for (i) popover
// const [expandedTile, setExpandedTile] = useState(null); // for click-expand modal

// ─── REPLACE renderTile with this ─────────────────────────────────────────
function renderTile(tile) {
  const { label, color, unit, value, target, series, dates: gd, viewBy: tvb, cms, trend } = tile;
  const display = (value === null || value === undefined) ? "-" : value;
  const targetNum = parseFloat(String(target).replace("%", ""));

  const nums = series.map(pt => ({
    y: (pt.y !== null && !isNaN(Number(pt.y))) ? Number(pt.y) : null,
    c: pt.c || color
  }));
  const valid = nums.filter(p => p.y !== null).map(p => p.y);
  const hasG = valid.length > 0;
  const dMax = hasG ? Math.max(...valid) : 100;
  const yMin = 0;
  const rawMax = Math.max(dMax * 1.05, isNaN(targetNum) ? 0 : targetNum * 1.05);
  const yMax = Math.ceil(rawMax / 10) * 10 || 100;
  const yMid = Math.round(yMax / 2);
  const yRange = yMax;
  const GH = 110;
  const bColor = v => (!isNaN(targetNum) && v !== null) ? (v >= targetNum ? "#22c55e" : "#ef4444") : (color);
  const tPct = (!isNaN(targetNum) && yRange > 0) ? Math.min((targetNum / yRange) * 100, 100) : null;
  const vb = tvb || viewBy;
  const total = gd.length;

  // ── Shared chart renderer (reusable for both tile and modal) ──────────────
  function BarChart({ VW, VH, xAW, yAW, showAllLabels = false }) {
    const cW = VW - yAW;
    const barGap = cW / total;
    const barW = Math.max(1.5, barGap * 0.72);
    const tY = tPct !== null ? VH * (1 - tPct / 100) : null;
    const step = showAllLabels ? 1 : Math.ceil(total / 14);

    return (
      <svg viewBox={`0 0 ${VW} ${VH + xAW}`}
        style={{ width: "100%", height: "auto", display: "block", overflow: "visible" }}
        preserveAspectRatio="none">

        {/* Y axis tick lines */}
        {[[0, "#c8d5e0"], [VH / 2, "#c8d5e0"], [VH, "#c8d5e0"]].map(([y, col], i) => (
          <line key={i} x1={yAW} y1={y} x2={VW} y2={y}
            stroke={col} strokeWidth={0.8} strokeOpacity={0.6} />
        ))}

        {/* Y axis labels */}
        <text x={yAW - 3} y={9} textAnchor="end" fontSize={8} fill="#94a3b8" fontWeight="600" fontFamily="sans-serif">{yMax}</text>
        <text x={yAW - 3} y={VH / 2 + 4} textAnchor="end" fontSize={8} fill="#94a3b8" fontWeight="600" fontFamily="sans-serif">{yMid}</text>
        <text x={yAW - 3} y={VH + 1} textAnchor="end" fontSize={8} fill="#94a3b8" fontWeight="600" fontFamily="sans-serif">{yMin}</text>

        {/* Bars + value labels on top */}
        {nums.map((pt, i) => {
          if (pt.y === null) return null;
          const h = Math.max((pt.y / yRange) * VH, 2);
          const x = yAW + i * barGap + (barGap - barW) / 2;
          const barTop = VH - h;
          const tipLabel = xLabel(gd[i], vb);
          const tipVal = `${tipLabel}: ${pt.y}${unit}`;
          const showLabel = showAllLabels || (i % step === 0);

          return (
            <g key={i}>
              <rect x={x} y={barTop} width={barW} height={h}
                fill={bColor(pt.y)} rx={1}
                style={{ cursor: "pointer" }}>
                <title>{tipVal}</title>
              </rect>
              {/* Value label on top of bar */}
              {showLabel && (
                <text
                  x={x + barW / 2}
                  y={barTop - 2}
                  textAnchor="middle"
                  fontSize={showAllLabels ? 7 : 6}
                  fill="#94a3b8"
                  fontWeight="600"
                  fontFamily="sans-serif"
                >
                  {pt.y}
                </text>
              )}
            </g>
          );
        })}

        {/* Dashed target line */}
        {tY !== null && (
          <line x1={yAW} y1={tY} x2={VW} y2={tY}
            stroke="#3b82f6" strokeWidth={1.5} strokeDasharray="5,3" strokeOpacity={0.8} />
        )}

        {/* X axis labels */}
        {gd.map((d, i) => {
          if (i % step !== 0) return null;
          const lbl = xLabel(d, vb);
          const x = yAW + i * barGap + barGap / 2;
          return (
            <text key={i} x={x} y={VH + xAW}
              textAnchor="middle" fontSize={6} fill="#94a3b8" fontWeight="600" fontFamily="sans-serif">
              {lbl}
            </text>
          );
        })}
      </svg>
    );
  }

  return (
    <>
      {/* ── TILE CARD ─────────────────────────────────────────────────────── */}
      <div className="kpi-tile" key={label}
        style={{ cursor: "pointer" }}
        onClick={() => setExpandedTile(tile)}>

        {/* row 1: title + info button + target */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
          {/* Left: label */}
          <div style={{
            fontSize: 12, fontWeight: 700, color: "#475569",
            flex: 1, marginRight: 8, lineHeight: 1.4,
            whiteSpace: "normal", overflow: "hidden",
            display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical"
          }}>{label}</div>

          {/* Right: (i) button stacked above target */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", flexShrink: 0 }}>
            {/* Info (i) button */}
            <div
              style={{ position: "relative", marginBottom: 4 }}
              onClick={e => { e.stopPropagation(); setInfoTile(infoTile === label ? null : label); }}>
              <div style={{
                width: 16, height: 16, borderRadius: "50%",
                background: "#e2e8f0", display: "flex", alignItems: "center",
                justifyContent: "center", cursor: "pointer", fontSize: 10,
                fontWeight: 700, color: "#64748b", userSelect: "none"
              }}>i</div>
              {/* Popover */}
              {infoTile === label && (
                <div style={{
                  position: "absolute", right: 0, top: 22, zIndex: 99,
                  background: "#1e293b", color: "#fff", borderRadius: 8,
                  padding: "10px 14px", minWidth: 200, fontSize: 11,
                  boxShadow: "0 4px 20px rgba(0,0,0,0.3)", lineHeight: 1.6
                }}
                  onClick={e => e.stopPropagation()}>
                  <div style={{ fontWeight: 700, marginBottom: 4, color: "#94a3b8", fontSize: 10, textTransform: "uppercase" }}>Metric Info</div>
                  <div><b>Metric:</b> {label}</div>
                  {target !== "-" && <div><b>Target:</b> {target}{unit === "%" ? "" : " " + unit}</div>}
                  <div><b>Period:</b> {vb}</div>
                  <div><b>Data Points:</b> {total}</div>
                  {cms && <div style={{ marginTop: 4, color: cms.toLowerCase().includes("not") ? "#ef4444" : "#22c55e", fontWeight: 600 }}>{cms}</div>}
                </div>
              )}
            </div>

            {/* Target (now below the i button) */}
            {target !== "-" && (
              <span style={{ fontSize: 11, fontWeight: 700, whiteSpace: "nowrap" }}>
                Target: <span style={{ color }}>{target}</span>
              </span>
            )}
          </div>
        </div>

        {/* row 2: legend */}
        <div style={{ display: "flex", gap: 14, marginBottom: 6 }}>
          {[["#22c55e", "Above"], ["#ef4444", "Below"]].map(([c, l]) => (
            <span key={l} style={{ fontSize: 10, color: "#64748b", display: "flex", alignItems: "center", gap: 3 }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: c, display: "inline-block" }} />
              {l}
            </span>
          ))}
        </div>

        {/* row 3: big value */}
        <div style={{ fontSize: 28, fontWeight: 800, color, lineHeight: 1.1, marginBottom: 6, whiteSpace: "nowrap" }}>
          {display === "--" && <span>{display}</span>}
          {display !== "--" && <span>{display}{unit === "%" ? " %" : ""}</span>}
        </div>

        {/* row 4: SVG chart (compact) */}
        <div style={{ width: "100%", minWidth: 0, marginTop: 6 }}>
          {hasG ? (
            <BarChart VW={280} VH={GH} xAW={14} yAW={14} showAllLabels={false} />
          ) : (
            <div style={{ height: 80, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: "#cbd5e1" }}>No Data</div>
          )}
        </div>

        {/* row 5: current trend + bonus/target trend */}
        <div style={{ marginTop: 8, paddingTop: 8, borderTop: "1px solid #f1f5f9" }}>
          <div style={{ fontSize: 11, lineHeight: 1.5 }}>
            <span style={{ color: "#64748b", fontWeight: "bold" }}>Current Month: </span>
            <span style={{
              fontWeight: "bold", color:
                (cms && cms.toLowerCase().includes("not meeting")) ? "#ef4444" :
                  (cms && cms.toLowerCase().includes("meeting")) ? "#22c55e" : "#94a3b8"
            }}>{cms || "–"}</span>
          </div>
          {trend && (
            <div style={{ fontSize: 10, lineHeight: 1.4, marginTop: 2 }}>
              <span style={{ color: "#64748b", fontWeight: "bold" }}>Bonus and Target Trend: </span>
              <span style={{ fontWeight: "bold", color: "#3b82f6" }}>{trend}</span>
            </div>
          )}
        </div>
      </div>
    </>
  );
}



{/* ── EXPANDED TILE MODAL ─────────────────────────────────────────────────── */}
{expandedTile && (() => {
  const t = expandedTile;
  const { label, color, unit, value, target, series, dates: gd, viewBy: tvb, cms, trend } = t;
  const display = (value === null || value === undefined) ? "-" : value;
  const targetNum = parseFloat(String(target).replace("%", ""));
  const vb = tvb || viewBy;
  const total = gd.length;

  const nums = series.map(pt => ({
    y: (pt.y !== null && !isNaN(Number(pt.y))) ? Number(pt.y) : null,
    c: pt.c || color
  }));
  const valid = nums.filter(p => p.y !== null).map(p => p.y);
  const hasG = valid.length > 0;
  const dMax = hasG ? Math.max(...valid) : 100;
  const rawMax = Math.max(dMax * 1.05, isNaN(targetNum) ? 0 : targetNum * 1.05);
  const yMax = Math.ceil(rawMax / 10) * 10 || 100;
  const yMid = Math.round(yMax / 2);
  const yRange = yMax;
  const GH = 200; // taller in modal
  const VW = 600, VH = GH, xAW = 18, yAW = 28;
  const cW = VW - yAW;
  const barGap = cW / total;
  const barW = Math.max(2, barGap * 0.72);
  const bColor = v => (!isNaN(targetNum) && v !== null) ? (v >= targetNum ? "#22c55e" : "#ef4444") : color;
  const tPct = (!isNaN(targetNum) && yRange > 0) ? Math.min((targetNum / yRange) * 100, 100) : null;
  const tY = tPct !== null ? VH * (1 - tPct / 100) : null;
  // show all labels in modal always
  const step = Math.ceil(total / 30); // show up to 30 labels

  const aboveCount = nums.filter(p => p.y !== null && !isNaN(targetNum) && p.y >= targetNum).length;
  const belowCount = nums.filter(p => p.y !== null && !isNaN(targetNum) && p.y < targetNum).length;
  const avg = valid.length ? (valid.reduce((a, b) => a + b, 0) / valid.length).toFixed(1) : "-";
  const maxVal = valid.length ? Math.max(...valid) : "-";
  const minVal = valid.length ? Math.min(...valid) : "-";

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 24
      }}
      onClick={() => setExpandedTile(null)}>

      <div
        style={{
          background: "#fff", borderRadius: 16, width: "100%", maxWidth: 780,
          maxHeight: "90vh", overflowY: "auto",
          boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
          padding: "28px 32px"
        }}
        onClick={e => e.stopPropagation()}>

        {/* Modal header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#1e293b", marginBottom: 4 }}>{label}</div>
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
              {target !== "-" && (
                <span style={{ fontSize: 13, fontWeight: 600 }}>
                  Target: <span style={{ color }}>{target}</span>
                </span>
              )}
              <span style={{ fontSize: 13, color: "#64748b" }}>Period: <b>{vb}</b></span>
              <span style={{ fontSize: 13, color: "#64748b" }}>Data Points: <b>{total}</b></span>
            </div>
          </div>

          {/* Close button */}
          <button
            onClick={() => setExpandedTile(null)}
            style={{
              width: 36, height: 36, borderRadius: "50%",
              border: "none", background: "#f1f5f9",
              fontSize: 18, cursor: "pointer", display: "flex",
              alignItems: "center", justifyContent: "center",
              color: "#475569", fontWeight: 700, flexShrink: 0,
              transition: "background 0.15s"
            }}
            onMouseEnter={e => e.currentTarget.style.background = "#e2e8f0"}
            onMouseLeave={e => e.currentTarget.style.background = "#f1f5f9"}
          >✕</button>
        </div>

        {/* Big value + legend row */}
        <div style={{ display: "flex", alignItems: "center", gap: 24, marginBottom: 16 }}>
          <div style={{ fontSize: 48, fontWeight: 800, color, lineHeight: 1 }}>
            {display}{unit === "%" ? " %" : ""}
          </div>
          <div style={{ display: "flex", gap: 16 }}>
            {[["#22c55e", "Above"], ["#ef4444", "Below"]].map(([c, l]) => (
              <span key={l} style={{ fontSize: 12, color: "#64748b", display: "flex", alignItems: "center", gap: 4 }}>
                <span style={{ width: 10, height: 10, borderRadius: "50%", background: c, display: "inline-block" }} />
                {l}
              </span>
            ))}
          </div>
        </div>

        {/* Stats row */}
        <div style={{
          display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap"
        }}>
          {[
            ["Average", avg + (unit === "%" ? "%" : "")],
            ["Max", maxVal + (unit === "%" ? "%" : "")],
            ["Min", minVal + (unit === "%" ? "%" : "")],
            ["Days Above Target", aboveCount],
            ["Days Below Target", belowCount],
          ].map(([lbl, val]) => (
            <div key={lbl} style={{
              background: "#f8fafc", borderRadius: 10, padding: "10px 16px",
              border: "1px solid #e2e8f0", flex: "1 1 auto", minWidth: 100
            }}>
              <div style={{ fontSize: 10, color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", marginBottom: 2 }}>{lbl}</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: "#1e293b" }}>{val}</div>
            </div>
          ))}
        </div>

        {/* Large chart */}
        <div style={{ width: "100%", minWidth: 0 }}>
          {hasG ? (
            <svg viewBox={`0 0 ${VW} ${VH + xAW}`}
              style={{ width: "100%", height: "auto", display: "block", overflow: "visible" }}
              preserveAspectRatio="none">

              {[[0, "#c8d5e0"], [VH / 2, "#c8d5e0"], [VH, "#c8d5e0"]].map(([y, col], i) => (
                <line key={i} x1={yAW} y1={y} x2={VW} y2={y}
                  stroke={col} strokeWidth={0.8} strokeOpacity={0.5} />
              ))}

              <text x={yAW - 4} y={9} textAnchor="end" fontSize={9} fill="#94a3b8" fontWeight="600" fontFamily="sans-serif">{yMax}</text>
              <text x={yAW - 4} y={VH / 2 + 4} textAnchor="end" fontSize={9} fill="#94a3b8" fontWeight="600" fontFamily="sans-serif">{yMid}</text>
              <text x={yAW - 4} y={VH + 1} textAnchor="end" fontSize={9} fill="#94a3b8" fontWeight="600" fontFamily="sans-serif">0</text>

              {nums.map((pt, i) => {
                if (pt.y === null) return null;
                const h = Math.max((pt.y / yRange) * VH, 2);
                const x = yAW + i * barGap + (barGap - barW) / 2;
                const barTop = VH - h;
                const showLbl = i % step === 0;
                const tipLabel = xLabel(gd[i], vb);
                return (
                  <g key={i}>
                    <rect x={x} y={barTop} width={barW} height={h}
                      fill={bColor(pt.y)} rx={1} style={{ cursor: "default" }}>
                      <title>{tipLabel}: {pt.y}{unit}</title>
                    </rect>
                    {/* Value on top of every bar */}
                    <text
                      x={x + barW / 2}
                      y={barTop - 3}
                      textAnchor="middle"
                      fontSize={7}
                      fill="#475569"
                      fontWeight="700"
                      fontFamily="sans-serif"
                    >
                      {pt.y}
                    </text>
                  </g>
                );
              })}

              {tY !== null && (
                <line x1={yAW} y1={tY} x2={VW} y2={tY}
                  stroke="#3b82f6" strokeWidth={1.5} strokeDasharray="5,3" strokeOpacity={0.8} />
              )}

              {gd.map((d, i) => {
                if (i % step !== 0) return null;
                const lbl = xLabel(d, vb);
                const x = yAW + i * barGap + barGap / 2;
                return (
                  <text key={i} x={x} y={VH + xAW}
                    textAnchor="middle" fontSize={7} fill="#94a3b8" fontWeight="600" fontFamily="sans-serif">
                    {lbl}
                  </text>
                );
              })}
            </svg>
          ) : (
            <div style={{ height: 120, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, color: "#cbd5e1" }}>No Data</div>
          )}
        </div>

        {/* Bottom: current month status + trend */}
        <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid #f1f5f9", display: "flex", gap: 32, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: 11, color: "#64748b", fontWeight: 600, textTransform: "uppercase", marginBottom: 4 }}>Current Month</div>
            <div style={{
              fontSize: 14, fontWeight: 700,
              color: (cms && cms.toLowerCase().includes("not meeting")) ? "#ef4444" :
                (cms && cms.toLowerCase().includes("meeting")) ? "#22c55e" : "#94a3b8"
            }}>{cms || "–"}</div>
          </div>
          {trend && (
            <div>
              <div style={{ fontSize: 11, color: "#64748b", fontWeight: 600, textTransform: "uppercase", marginBottom: 4 }}>Bonus & Target Trend</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#3b82f6" }}>{trend}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
})()}



// Close (i) popover on outside click
useEffect(() => {
  const handler = () => setInfoTile(null);
  document.addEventListener("click", handler);
  return () => document.removeEventListener("click", handler);
}, []);









