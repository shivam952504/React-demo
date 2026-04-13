// KPITileModal.jsx  — replace your existing file with this
// Fixes: 1) chart no-data issue  2) layout of current month + removed duplicate target

import React from “react”;

const COLOR_MAP = {
green:”#22c55e”, red:”#ef4444”, orange:”#f97316”,
blue:”#3b82f6”,  yellow:”#eab308”, purple:”#a855f7”,
white:”#94a3b8”, gray:”#94a3b8”,
};
const resolveColor = c => {
if (!c) return “#22c55e”;
const l = String(c).toLowerCase().trim();
return COLOR_MAP[l] || c;
};

export default function KPITileModal({ tile, onClose }) {
if (!tile) return null;

const {
label,
color,
unit,
value,
target,
series,
dates: gd,
viewBy: tvb,
cms,
trend,
} = tile;

const vb        = tvb || “day”;
const display   = (value === null || value === undefined) ? “-” : value;
const targetNum = parseFloat(String(target || “”).replace(”%”, “”).replace(”,”, “”));

/* ── chart geometry ── */
const VW = 580, VH = 170, yAW = 28, xAH = 20;
const cW = VW - yAW;

// series can be array of {y, c} or {pt_v, color} — handle both
const nums = (series || []).map(pt => {
if (pt === null || pt === undefined) return { y: null, c: color };
const yVal = pt.y !== undefined ? pt.y : (pt.pt_v !== undefined ? pt.pt_v : null);
const yNum = (yVal !== null && yVal !== undefined && !isNaN(Number(yVal))) ? Number(yVal) : null;
return { y: yNum, c: pt.c || pt.color || color };
});

const valid  = nums.filter(p => p.y !== null).map(p => p.y);
const hasG   = valid.length > 0;
const dMax   = hasG ? Math.max(…valid) : 100;
const rawMax = Math.max(dMax * 1.05, isNaN(targetNum) ? 0 : targetNum * 1.05);
const yMax   = Math.ceil(rawMax / 10) * 10 || 100;
const yMid   = Math.round(yMax / 2);
const tY     = (!isNaN(targetNum) && yMax > 0) ? VH * (1 - targetNum / yMax) : null;
const total  = gd ? gd.length : nums.length;

const step  = Math.max(1, Math.ceil(total / 16));
const barGap = 1.5;
const barW  = total > 0 ? Math.max(2, (cW - barGap * (total - 1)) / total) : 8;

const bColorFn = v =>
(!isNaN(targetNum) && v !== null)
? (v >= targetNum ? “#22c55e” : “#ef4444”)
: resolveColor(color);

function xLabel(d) {
if (!d) return “”;
const k = String(d).trim();
if (vb === “week”) {
const m = k.match(/^W(?:eek)?\s*(\d{1,2})/i);
return m ? `W${m[1]}` : k.split(” “)[0];
}
if (vb === “month”) {
const MONTHS = [“Jan”,“Feb”,“Mar”,“Apr”,“May”,“Jun”,“Jul”,“Aug”,“Sep”,“Oct”,“Nov”,“Dec”];
const iso = k.match(/^(\d{4})-(\d{2})$/);
if (iso) return MONTHS[parseInt(iso[2]) - 1] ?? k;
const my = k.match(/^([a-zA-Z]+)/);
return my ? my[1].substring(0, 3) : k.substring(0, 3);
}
if (vb === “quarterly”) {
const wordQ = k.match(/^Quarter\s*(\d)/i);
if (wordQ) return `Q${wordQ[1]}`;
const qm = k.match(/Q(\d)/i);
if (qm) return `Q${qm[1]}`;
const nm = parseInt(k);
if (!isNaN(nm) && nm >= 1 && nm <= 4) return `Q${nm}`;
const iso = k.match(/^(\d{4})-(\d{2})$/);
if (iso) return `Q${Math.ceil(parseInt(iso[2]) / 3)}-${iso[1]}`;
const apiFmt = k.match(/^Quarter-(\d{4})-(\d)$/i);
if (apiFmt) return `Q${apiFmt[2]}-${apiFmt[1]}`;
return k.substring(0, 2);
}
// day
const dt = new Date(k);
if (!isNaN(dt.getTime())) return String(dt.getDate());
return k.split(”-”).pop() || “”;
}

const cmsColor = cms
? (cms.toLowerCase().includes(“not”) ? “#ef4444” : “#22c55e”)
: “#94a3b8”;

return (
<div
style={{
position: “fixed”, inset: 0, zIndex: 9999,
background: “rgba(0,0,0,0.6)”,
display: “flex”, alignItems: “center”, justifyContent: “center”,
padding: “16px”,
}}
onClick={onClose}
>
<div
style={{
background: “#1e293b”, borderRadius: 16,
width: “100%”, maxWidth: 680,
boxShadow: “0 8px 40px rgba(0,0,0,0.6)”,
overflow: “hidden”, fontFamily: “sans-serif”,
}}
onClick={e => e.stopPropagation()}
>
{/* HEADER */}
<div style={{
display: “flex”, alignItems: “flex-start”, justifyContent: “space-between”,
padding: “16px 20px 12px”, borderBottom: “1px solid #334155”,
}}>
<div>
<div style={{ fontSize: 11, color: “#64748b”, textTransform: “uppercase”, letterSpacing: “0.6px”, marginBottom: 3 }}>
Metric Detail
</div>
<div style={{ fontSize: 16, fontWeight: 700, color: “#f1f5f9” }}>
{label}
</div>
</div>
<button onClick={onClose} style={{
background: “transparent”, border: “none”, cursor: “pointer”,
color: “#94a3b8”, fontSize: 22, lineHeight: 1, padding: “0 4px”, marginTop: 2,
}}>×</button>
</div>

```
    {/* ROW 1: Current Value + Target side by side */}
    <div style={{
      display: "grid", gridTemplateColumns: "1fr 1fr",
      gap: 10, padding: "14px 20px 0",
    }}>
      {[
        { lbl: "Current Value", val: display === "-" ? "–" : `${display}${unit ?? ""}`, hi: resolveColor(color) },
        { lbl: "Target",        val: (!target || target === "-") ? "–" : `${target}`,   hi: "#3b82f6" },
      ].map(({ lbl, val, hi }) => (
        <div key={lbl} style={{ background: "#0f172a", borderRadius: 10, padding: "12px 14px" }}>
          <div style={{ fontSize: 10, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 5 }}>{lbl}</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: hi }}>{val}</div>
        </div>
      ))}
    </div>

    {/* ROW 2: Bonus & Target Trend */}
    {trend && (
      <div style={{ padding: "10px 20px 0", fontSize: 12 }}>
        <span style={{ fontWeight: 600, color: "#94a3b8" }}>Bonus &amp; Target Trend: </span>
        <span style={{ color: "#3b82f6", fontWeight: 700 }}>{trend}</span>
      </div>
    )}

    {/* ROW 3: Current Month — full width box, below trend */}
    {cms && (
      <div style={{ padding: "10px 20px 0" }}>
        <div style={{ background: "#0f172a", borderRadius: 10, padding: "12px 14px" }}>
          <div style={{ fontSize: 10, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 5 }}>
            Current Month
          </div>
          <div style={{ fontSize: 14, fontWeight: 700, color: cmsColor, lineHeight: 1.3 }}>
            {cms}
          </div>
        </div>
      </div>
    )}

    {/* CHART */}
    <div style={{ padding: "14px 20px 20px" }}>
      {/* legend — no target label here, already shown above */}
      <div style={{ display: "flex", gap: 14, alignItems: "center", marginBottom: 8, fontSize: 11, color: "#94a3b8" }}>
        {[["#22c55e", "Above"], ["#ef4444", "Below"]].map(([c, l]) => (
          <span key={l} style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: c, display: "inline-block" }} />
            {l}
          </span>
        ))}
      </div>

      {hasG ? (
        <svg
          viewBox={`0 0 ${VW} ${VH + xAH}`}
          style={{ width: "100%", height: "auto", display: "block", overflow: "visible" }}
          preserveAspectRatio="none"
        >
          {/* grid lines */}
          {[0, VH / 2, VH].map((y, i) => (
            <line key={i} x1={yAW} y1={y} x2={VW} y2={y}
              stroke="#c8d5e0" strokeWidth={0.8} strokeOpacity={0.5} />
          ))}

          {/* y labels */}
          <text x={yAW-3} y={9}         textAnchor="end" fontSize={8} fill="#94a3b8" fontWeight="600" fontFamily="sans-serif">{yMax}</text>
          <text x={yAW-3} y={VH/2+4}    textAnchor="end" fontSize={8} fill="#94a3b8" fontWeight="600" fontFamily="sans-serif">{yMid}</text>
          <text x={yAW-3} y={VH+1}      textAnchor="end" fontSize={8} fill="#94a3b8" fontWeight="600" fontFamily="sans-serif">0</text>

          {/* bars */}
          {nums.map((pt, i) => {
            if (pt.y === null) return null;
            const h  = (pt.y / yMax) * VH;
            const x  = yAW + i * (barW + barGap) + barGap / 2;
            const bc = bColorFn(pt.y);
            const barLabel = unit === "%"
              ? `${Math.round(pt.y * 10) / 10}%`
              : String(Math.round(pt.y));
            return (
              <g key={i}>
                <rect x={x} y={VH - h} width={barW} height={h}
                  fill={bc} rx={1} style={{ cursor: "pointer" }}>
                  <title>{`${xLabel(gd ? gd[i] : i)}: ${barLabel}`}</title>
                </rect>
                {barW >= 14 && (
                  <text
                    x={x + barW / 2} y={VH - h - 3}
                    textAnchor="middle"
                    fontSize={Math.min(7, barW * 0.5)}
                    fill="#e2e8f0" fontWeight="600" fontFamily="sans-serif"
                  >
                    {barLabel}
                  </text>
                )}
              </g>
            );
          })}

          {/* target dashed line */}
          {tY !== null && (
            <line x1={yAW} y1={tY} x2={VW} y2={tY}
              stroke="#3b82f6" strokeWidth={1.5}
              strokeDasharray="5,3" strokeOpacity={0.85} />
          )}

          {/* x labels */}
          {(gd || nums).map((d, i) => {
            if (i % step !== 0) return null;
            const x = yAW + i * (barW + barGap) + barGap / 2 + barW / 2;
            return (
              <text key={i} x={x} y={VH + xAH}
                textAnchor="middle" fontSize={6} fill="#94a3b8"
                fontWeight="600" fontFamily="sans-serif">
                {xLabel(gd ? gd[i] : String(i))}
              </text>
            );
          })}
        </svg>
      ) : (
        <div style={{
          height: 100, display: "flex", alignItems: "center",
          justifyContent: "center", fontSize: 12, color: "#64748b",
          background: "#0f172a", borderRadius: 8,
        }}>
          No chart data available
        </div>
      )}
    </div>
  </div>
</div>
```

);
}
