// KPITileModal.jsx  — drop this file next to KPIDashboard.jsx
// No changes needed anywhere else except the two lines in renderTile (see below)

import React, { useState } from “react”;

/* ─── tiny colour helpers (mirror what KPIDashboard already has) ─── */
const COLOR_MAP = {
green:”#22c55e”, red:”#ef4444”, orange:”#f97316”,
blue:”#3b82f6”,  yellow:”#eab308”, purple:”#a855f7”,
white:”#94a3b8”, gray:”#94a3b8”,
};
const resolveColor = c => { if(!c) return “#22c55e”; const l=String(c).toLowerCase().trim(); return COLOR_MAP[l]||c; };
const bColor       = (v,targetNum) => (!isNaN(targetNum)&&v!==null) ? (v>=targetNum?”#22c55e”:”#ef4444”) : resolveColor(null);

/* ════════════════════════════════════════════════════════════════════
KPITileModal
Props:
tile   – the same tile object you already build in buildTable
onClose – () => void
════════════════════════════════════════════════════════════════════ */
export default function KPITileModal({ tile, onClose }) {
if (!tile) return null;

const {
label, color, unit, value, target, series,
dates: gd, viewBy: tvb, cms, trend,
} = tile;

const vb          = tvb || “day”;
const targetNum   = parseFloat(String(target).replace(”%”,””));
const display     = value===null||value===undefined ? “-” : value;

/* ── bar chart geometry ── */
const VW=560, VH=160, yAW=28, xAH=18;
const cW   = VW - yAW;
const nums  = (series||[]).map(pt => ({
y: (pt.y!==null&&!isNaN(Number(pt.y))) ? Number(pt.y) : null,
c: pt.c||color,
}));
const valid  = nums.filter(p=>p.y!==null).map(p=>p.y);
const hasG   = valid.length > 0;
const dMax   = hasG ? Math.max(…valid) : 100;
const rawMax = Math.max(dMax*1.05, isNaN(targetNum)?0:targetNum*1.05);
const yMax   = Math.ceil(rawMax/10)*10||100;
const yMid   = Math.round(yMax/2);
const tY     = (!isNaN(targetNum)&&yMax>0) ? VH*(1-targetNum/yMax) : null;
const total  = gd ? gd.length : 0;

// step so we show at most ~14 x-labels
const step   = Math.max(1, Math.ceil(total/14));

const barGap = 1.5;
const barW   = total > 0 ? Math.max(1.5, (cW - barGap*(total-1))/total) : 8;

/* x-axis label — mirrors xLabel() in KPIDashboard */
function xLabel(d) {
if (!d) return “”;
const k = String(d).trim();
if (vb===“week”) {
const m = k.match(/^W(?:eek)?(\d{1,2})(?:\s|$|()/i);
return m ? `W${m[1]}` : k.split(” “)[0];
}
if (vb===“month”) {
const iso = k.match(/^(\d{4})-(\d{2})$/);
if (iso) {
const MONTHS=[“Jan”,“Feb”,“Mar”,“Apr”,“May”,“Jun”,“Jul”,“Aug”,“Sep”,“Oct”,“Nov”,“Dec”];
return MONTHS[parseInt(iso[2])-1]??k;
}
const my = k.match(/^([a-zA-Z]+)/);
return my ? my[1].substring(0,3) : k.substring(0,3);
}
if (vb===“quarterly”) {
const wordQ = k.match(/^Quarter\s*(\d)/i);
if (wordQ) return `Q${wordQ[1]}`;
const qm = k.match(/Q(\d)/i);
if (qm) return `Q${qm[1]}`;
const nm = parseInt(k);
if (!isNaN(nm)&&nm>=1&&nm<=4) return `Q${nm}`;
const iso = k.match(/^(\d{4})-(\d{2})$/);
if (iso) { const mo=parseInt(iso[2]); return `Q${Math.ceil(mo/3)}-${iso[1]}`; }
const apiFmt = k.match(/^Quarter-(\d{4})-(\d)$/i);
if (apiFmt) return `Q${apiFmt[2]}-${apiFmt[1]}`;
return k.substring(0,2);
}
// day – just show the date portion
const dt = new Date(k);
if (!isNaN(dt.getTime())) return String(dt.getDate());
return k.split(”-”).pop()||””;
}

/* ── overlay styles ── */
const overlay = {
position:“fixed”,inset:0,zIndex:9999,
background:“rgba(0,0,0,0.55)”,
display:“flex”,alignItems:“center”,justifyContent:“center”,
padding:“16px”,
};
const modal = {
background:”#1e293b”,borderRadius:16,
width:“100%”,maxWidth:660,
boxShadow:“0 8px 40px rgba(0,0,0,0.5)”,
overflow:“hidden”,
fontFamily:“sans-serif”,
};

return (
<div style={overlay} onClick={onClose}>
<div style={modal} onClick={e=>e.stopPropagation()}>

```
    {/* ── header ── */}
    <div style={{
      display:"flex",alignItems:"flex-start",justifyContent:"space-between",
      padding:"18px 20px 14px",borderBottom:"1px solid #334155",
    }}>
      <div>
        <div style={{fontSize:13,color:"#94a3b8",marginBottom:4,textTransform:"uppercase",letterSpacing:"0.5px"}}>
          Metric Detail
        </div>
        <div style={{fontSize:17,fontWeight:700,color:"#f1f5f9",lineHeight:1.3}}>
          {label}
        </div>
      </div>
      <button onClick={onClose} style={{
        background:"transparent",border:"none",cursor:"pointer",
        color:"#94a3b8",fontSize:22,lineHeight:1,padding:"0 4px",marginTop:2,
      }}>×</button>
    </div>

    {/* ── KPI summary row ── */}
    <div style={{
      display:"grid",gridTemplateColumns:"1fr 1fr 1fr",
      gap:12,padding:"16px 20px",borderBottom:"1px solid #1e293b",
    }}>
      {[
        { lbl:"Current Value", val: display==="–"||display==="-" ? "–" : `${display}${unit??" "}`, hi: resolveColor(color) },
        { lbl:"Target",        val: target==="-"||target===undefined ? "–" : `${target}${unit&&!String(target).includes(unit)?unit:""}`, hi:"#3b82f6" },
        { lbl:"Current Month", val: cms||"–", hi: cms&&cms.toLowerCase().includes("not")?"#ef4444":"#22c55e" },
      ].map(({lbl,val,hi})=>(
        <div key={lbl} style={{background:"#0f172a",borderRadius:10,padding:"12px 14px"}}>
          <div style={{fontSize:11,color:"#64748b",marginBottom:6,textTransform:"uppercase",letterSpacing:"0.5px"}}>{lbl}</div>
          <div style={{fontSize:15,fontWeight:700,color:hi,lineHeight:1.2}}>{val}</div>
        </div>
      ))}
    </div>

    {/* ── trend row ── */}
    {trend && (
      <div style={{padding:"8px 20px 0",fontSize:11,color:"#64748b"}}>
        <span style={{fontWeight:600,color:"#94a3b8"}}>Bonus & Target Trend: </span>
        <span style={{color:"#3b82f6",fontWeight:700}}>{trend}</span>
      </div>
    )}

    {/* ── bar chart ── */}
    <div style={{padding:"12px 20px 20px"}}>
      <div style={{fontSize:12,color:"#94a3b8",marginBottom:8,display:"flex",gap:16,alignItems:"center"}}>
        {[["#22c55e","Above"],["#ef4444","Below"]].map(([c,l])=>(
          <span key={l} style={{display:"flex",alignItems:"center",gap:4}}>
            <span style={{width:8,height:8,borderRadius:"50%",background:c,display:"inline-block"}}/>
            <span>{l}</span>
          </span>
        ))}
        {!isNaN(targetNum) && (
          <span style={{marginLeft:"auto",fontSize:11}}>
            Target: <span style={{color:"#3b82f6",fontWeight:700}}>{target}</span>
          </span>
        )}
      </div>

      {hasG ? (
        <svg viewBox={`0 0 ${VW} ${VH+xAH}`}
          style={{width:"100%",height:"auto",display:"block",overflow:"visible"}}
          preserveAspectRatio="none">

          {/* y-axis grid + labels */}
          {[[0,"#c8d5e0"],[VH/2,"#c8d5e0"],[VH,"#c8d5e0"]].map(([y,col],i)=>(
            <line key={i} x1={yAW} y1={y} x2={VW} y2={y}
              stroke={col} strokeWidth={0.8} strokeOpacity={0.6}/>
          ))}
          <text x={yAW-3} y={9}      textAnchor="end" fontSize={8} fill="#94a3b8" fontWeight="600" fontFamily="sans-serif">{yMax}</text>
          <text x={yAW-3} y={VH/2+4} textAnchor="end" fontSize={8} fill="#94a3b8" fontWeight="600" fontFamily="sans-serif">{yMid}</text>
          <text x={yAW-3} y={VH+1}   textAnchor="end" fontSize={8} fill="#94a3b8" fontWeight="600" fontFamily="sans-serif">0</text>

          {/* bars + value labels on top */}
          {nums.map((pt,i)=>{
            if(pt.y===null) return null;
            const h  = (pt.y/yMax)*VH;
            const x  = yAW + i*(barW+barGap) + barGap/2;
            const bc = bColor(pt.y, targetNum);
            const barLabel = unit==="%"
              ? `${Math.round(pt.y*10)/10}%`
              : String(Math.round(pt.y));
            return (
              <g key={i}>
                <rect x={x} y={VH-h} width={barW} height={h}
                  fill={bc} rx={1} style={{cursor:"pointer"}}>
                  <title>{`${xLabel(gd[i])}: ${barLabel}`}</title>
                </rect>
                {/* value on top of bar — only if barW is wide enough */}
                {barW >= 12 && (
                  <text x={x+barW/2} y={VH-h-3}
                    textAnchor="middle" fontSize={Math.min(7,barW*0.55)}
                    fill="#e2e8f0" fontWeight="600" fontFamily="sans-serif">
                    {barLabel}
                  </text>
                )}
              </g>
            );
          })}

          {/* dashed target line */}
          {tY!==null&&(
            <line x1={yAW} y1={tY} x2={VW} y2={tY}
              stroke="#3b82f6" strokeWidth={1.5}
              strokeDasharray="5,3" strokeOpacity={0.85}/>
          )}

          {/* x-axis labels */}
          {gd&&gd.map((d,i)=>{
            if(i%step!==0) return null;
            const x = yAW + i*(barW+barGap) + barGap/2 + barW/2;
            return (
              <text key={i} x={x} y={VH+xAH}
                textAnchor="middle" fontSize={6} fill="#94a3b8"
                fontWeight="600" fontFamily="sans-serif">
                {xLabel(d)}
              </text>
            );
          })}
        </svg>
      ) : (
        <div style={{height:80,display:"flex",alignItems:"center",justifyContent:"center",
          fontSize:12,color:"#cbd5e1"}}>No Data</div>
      )}
    </div>

  </div>
</div>
```

);
}
