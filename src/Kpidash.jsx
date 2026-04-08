import React, { useEffect, useState, useMemo } from “react”;
import axios from “axios”;
import { Select, Table, Spin } from “antd”;
import LoaderOverlay from “../loader/LoaderOverlay”;

const { Option } = Select;
const API_BASE = “http://localhost:9009/api”;

const MONTH_NAMES = [
“January”,“February”,“March”,“April”,“May”,“June”,
“July”,“August”,“September”,“October”,“November”,“December”,
];
const CURRENT_YEAR = new Date().getFullYear();

/* ─────────────────────────────────────────────────────────────
COLOR HELPERS
──────────────────────────────────────────────────────────────*/
const COLOR_MAP = {
green:”#22c55e”, red:”#ef4444”, orange:”#f97316”,
blue:”#3b82f6”,  yellow:”#eab308”, purple:”#a855f7”,
white:”#94a3b8”, gray:”#94a3b8”,  grey:”#94a3b8”,
};
const resolveColor = c => {
if (!c) return “#22c55e”;
const lc = String(c).toLowerCase().trim();
return COLOR_MAP[lc] || c;
};
const colorToTint = (c, a=0.12) => {
const h = resolveColor(c).replace(”#”,””);
if (h.length!==6) return `rgba(34,197,94,${a})`;
return `rgba(${parseInt(h.slice(0,2),16)},${parseInt(h.slice(2,4),16)},${parseInt(h.slice(4,6),16)},${a})`;
};

/* ─────────────────────────────────────────────────────────────
SMART SORT
──────────────────────────────────────────────────────────────*/
const MONTH_ORDER = {
january:1,february:2,march:3,april:4,may:5,june:6,
july:7,august:8,september:9,october:10,november:11,december:12,
jan:1,feb:2,mar:3,apr:4,jun:6,jul:7,aug:8,sep:9,oct:10,nov:11,dec:12,
};
function dateKeyToSortValue(key) {
const k = String(key).trim();
if (/^\d{4}-\d{2}-\d{2}$/.test(k)) return new Date(k).getTime();
if (/^\d{4}-\d{2}$/.test(k))        return new Date(k+”-01”).getTime();
const isoW = k.match(/^(\d{4})-W(\d{1,2})$/i);
if (isoW) return parseInt(isoW[1])*100+parseInt(isoW[2]);
const longW = k.match(/^week(\d{1,2})\s*(/i);
if (longW) return parseInt(longW[1]);
const bareW = k.match(/^w(?:eek\s*)?(\d{1,2})$/i);
if (bareW) return parseInt(bareW[1]);
const lk = k.toLowerCase();
if (MONTH_ORDER[lk]) return MONTH_ORDER[lk];
const mY = k.match(/^([a-z]+)[\s-](\d{4})$/i);
if (mY) { const mo=MONTH_ORDER[mY[1].toLowerCase()]; if(mo) return parseInt(mY[2])*100+mo; }
return k;
}
function smartSort(dates) {
return […new Set(dates)].sort((a,b) => {
const va=dateKeyToSortValue(a), vb=dateKeyToSortValue(b);
if (typeof va===“number”&&typeof vb===“number”) return va-vb;
return String(va).localeCompare(String(vb));
});
}

/* ─────────────────────────────────────────────────────────────
X-AXIS LABEL  — every single tick for day view
──────────────────────────────────────────────────────────────*/
function xAxisLabel(d, viewBy) {
const k = String(d).trim();
if (viewBy===“week”) {
const m = k.match(/(?:^week|^W)(\d{1,2})/i);
return m ? `W${m[1]}` : k.split(” “)[0];
}
if (viewBy===“month”) {
const iso = k.match(/^\d{4}-(\d{2})$/);
if (iso) return MONTH_NAMES[parseInt(iso[1])-1]?.substring(0,3) ?? k;
const lk = k.toLowerCase();
if (MONTH_ORDER[lk]) return k.substring(0,3);
const my = k.match(/^([a-z]+)/i);
return my ? my[1].substring(0,3) : k.substring(0,3);
}
// day — every number 1..31
const dt = new Date(k);
if (!isNaN(dt.getTime())) return String(dt.getDate());
return k.split(”-”).pop() || “”;
}

/* ─────────────────────────────────────────────────────────────
FIELD EXTRACTORS
──────────────────────────────────────────────────────────────*/
function extractField(raw, field) {
if (raw===null||raw===undefined) return null;
if (typeof raw===“object”&&!Array.isArray(raw)) return raw[field]!==undefined?raw[field]:null;
if (field===“Overall”||field===“overall”) return raw;
return null;
}
function getOverall(raw) {
const v = extractField(raw,“Overall”) ?? extractField(raw,“overall”)
?? extractField(raw,“overall_percentage”)
?? (typeof raw!==“object” ? raw : null);
if (v===null||v===undefined) return null;
if (typeof v===“boolean”) return null;
const s = String(v).trim();
if (s===””||s===”-”||s===”–”||s.toLowerCase()===“nan”) return null;
const n = parseFloat(s.replace(”%”,””));
return isNaN(n) ? s : n;
}
function getCellDisplay(raw)  { const v=getOverall(raw); return v!==null?v:”-”; }
function getCellColor(raw)    { return extractField(raw,“color”)||null; }
function getTarget(raw) {
const t = extractField(raw,“target”);
if (t===null||t===undefined) return “-”;
const s = String(t).trim();
return (s===””||s===”-”||s===”–”) ? “-” : s;
}
function getColor(raw)           { return resolveColor(extractField(raw,“color”)); }
function getBoolFlag(raw, flag)  { if(!raw||typeof raw!==“object”) return false; return raw[flag]===true; }
function isNested(raw)           { return raw!==null&&typeof raw===“object”&&!Array.isArray(raw)&&(“Overall” in raw||“overall” in raw||“overall_percentage” in raw); }

/* ─────────────────────────────────────────────────────────────
PARSE RESPONSE
──────────────────────────────────────────────────────────────*/
function parseDateEntries(response) {
const nonTile = Object.keys(response).filter(k=>k!==“tile”);
const first   = response[nonTile[0]];
let dates=[], dataMap={};
const looksLikeEntry = v =>
v&&typeof v===“object”&&!Array.isArray(v)&&
Object.values(v).some(x=>typeof x===“string”||typeof x===“number”||typeof x===“boolean”||(typeof x===“object”&&x!==null&&“Overall” in x));
if (looksLikeEntry(first)) {
dates=nonTile; nonTile.forEach(d=>{dataMap[d]=response[d];});
} else {
Object.values(response).forEach(g=>{
if(g&&typeof g===“object”&&!Array.isArray(g))
Object.keys(g).forEach(d=>{ if(d!==“tile”){dates.push(d);dataMap[d]=g[d];} });
});
}
return { dates:smartSort(dates), dataMap };
}
function discoverMetricKeys(dates, dataMap) {
const seen=new Set(), o=[];
dates.forEach(d=>{const e=dataMap[d];if(!e)return;Object.keys(e).forEach(k=>{if(!seen.has(k)){seen.add(k);o.push(k);}});});
return o;
}
function keyExists(key,dates,dataMap)   { return dates.some(d=>key in(dataMap[d]||{})); }
function hasReal(key,dates,dataMap)     { return dates.some(d=>getOverall(dataMap[d]?.[key])!==null); }
function passesToggle(key,dates,dataMap,cOn,bOn,bqOn) {
if(!cOn&&!bOn&&!bqOn) return true;
if(!dates.some(d=>isNested(dataMap[d]?.[key]))) return true; // flat
if(cOn  && !dates.some(d=>getBoolFlag(dataMap[d]?.[key],“Contractual”)))       return false;
if(bOn  && !dates.some(d=>getBoolFlag(dataMap[d]?.[key],“Bonus and Penalty”))) return false;
if(bqOn && !dates.some(d=>getBoolFlag(dataMap[d]?.[key],“Bonus Qualifier”)))   return false;
return true;
}

/* ─────────────────────────────────────────────────────────────
TOGGLE COMPONENT  (used in nav-bar style panel)
──────────────────────────────────────────────────────────────*/
function Toggle({ label, value, onChange }) {
return (
<div onClick={()=>onChange(!value)}
style={{display:“flex”,flexDirection:“column”,alignItems:“center”,gap:4,cursor:“pointer”,userSelect:“none”}}>
<span style={{fontSize:11,fontWeight:700,color:value?”#60a5fa”:”#64748b”,whiteSpace:“nowrap”}}>{label}</span>
<div style={{width:36,height:20,borderRadius:10,background:value?”#3b82f6”:”#334155”,position:“relative”,transition:“background 0.2s”}}>
<div style={{position:“absolute”,top:3,left:value?18:3,width:14,height:14,borderRadius:“50%”,background:”#fff”,transition:“left 0.2s”,boxShadow:“0 1px 4px rgba(0,0,0,0.3)”}}/>
</div>
</div>
);
}

/* =============================================================
MAIN COMPONENT
============================================================= */
export default function KPIDashboard() {
const [loading,        setLoading]        = useState(false);
const [tableLoading,   setTableLoading]   = useState(false);
const [viewBy,         setViewBy]         = useState(“day”);
const [cOn,            setCOn]            = useState(false);
const [bOn,            setBOn]            = useState(false);
const [bqOn,           setBqOn]           = useState(false);
const [columns,        setColumns]        = useState([]);
const [filterOptions,  setFilterOptions]  = useState({});
const [allTiles,       setAllTiles]       = useState([]);
const [allRows,        setAllRows]        = useState([]);
const [chartDates,     setChartDates]     = useState([]);
const [chartDataMap,   setChartDataMap]   = useState({});
const [showAll,        setShowAll]        = useState(false);
const [isFlReady,      setIsFlReady]      = useState(false);
const [error,          setError]          = useState(null);

const [filters, setFilters] = useState({
year_type:“Calendar Year”, year:CURRENT_YEAR, month:“January”,
geo:[“ALL”], program:[“ALL”], lob:[“ALL”], supervisor:[“ALL”], tenure_units:[“ALL”],
});
const [debFilters, setDebFilters] = useState(null);
const debRef    = React.useRef(null);
const activeVb  = React.useRef(viewBy);

/* endpoints */
const dataEp   = vb => vb===“day”?”/get_concora_daily_data/”:vb===“week”?”/get_concora_weekly_data/”:”/get_concora_monthly_data/”;
const filterEp = vb => vb===“day”?”/get_concora_daily_filters/”:vb===“week”?”/get_concora_weekly_filters/”:”/get_concora_monthly_filters/”;
const mkPayload = f => ({year_type:f.year_type,year:f.year,month:f.month,geo:f.geo,program:f.program,lob:f.lob,supervisor:f.supervisor,tenure_units:f.tenure_units});

/* debounce */
useEffect(()=>{
if(debRef.current) clearTimeout(debRef.current);
debRef.current=setTimeout(()=>setDebFilters({…filters}),600);
return()=>{if(debRef.current) clearTimeout(debRef.current);};
},[filters]);

/* fetch helper — filter then data */
const fetchAll = (vb, payload) => {
setLoading(true); setTableLoading(true); setError(null);
setAllRows([]); setAllTiles([]); setColumns([]);
return axios.post(API_BASE+filterEp(vb), payload)
.then(r=>{ if(activeVb.current!==vb) return; setFilterOptions(r.data||{}); setIsFlReady(true); setLoading(false); return axios.post(API_BASE+dataEp(vb), payload); })
.then(r=>{ if(!r||activeVb.current!==vb) return; if(!r.data||!Object.keys(r.data).length){setError(“No data available.”);return;} buildTable(r.data,vb); })
.catch(()=>{ if(activeVb.current!==vb) return; setError(“Failed to load. Please try again.”); })
.finally(()=>{ if(activeVb.current===vb){setLoading(false);setTableLoading(false);} });
};

/* EFFECT 1 — viewBy */
useEffect(()=>{
const vb=viewBy; activeVb.current=vb; setIsFlReady(false);
fetchAll(vb, mkPayload(filters));
},[viewBy]); // eslint-disable-line

/* EFFECT 2 — debounced filters */
useEffect(()=>{
if(!isFlReady||!debFilters) return;
const vb=viewBy; setTableLoading(true); setError(null);
const p=mkPayload(debFilters);
axios.post(API_BASE+filterEp(vb),p)
.then(r=>{ if(activeVb.current!==vb) return; setFilterOptions(r.data||{}); return axios.post(API_BASE+dataEp(vb),p); })
.then(r=>{ if(!r||activeVb.current!==vb) return; if(!r.data||!Object.keys(r.data).length){setAllRows([]);setAllTiles([]);setColumns([]);setError(“No data.”);return;} buildTable(r.data,vb); })
.catch(()=>{ if(activeVb.current!==vb) return; setAllRows([]);setAllTiles([]);setColumns([]);setError(“Failed.”); })
.finally(()=>{ if(activeVb.current===vb) setTableLoading(false); });
},[debFilters]); // eslint-disable-line

/* ─── BUILD TABLE & TILES ─────────────────────────────────*/
const buildTable = (response, currentVb) => {
const tileObj = response.tile||{};
const {dates,dataMap} = parseDateEntries(response);
if(!dates.length){setColumns([]);setAllRows([]);setAllTiles([]);return;}
setChartDates(dates); setChartDataMap(dataMap);

```
const keys      = discoverMetricKeys(dates,dataMap);
const active    = keys.filter(k=>keyExists(k,dates,dataMap));
const getT      = k=>{for(const d of dates){const t=getTarget(dataMap[d]?.[k]);if(t!=="-")return t;}return "-";};

/* TABLE COLUMNS */
const cols=[
  {title:"Metric",dataIndex:"metric",width:260,fixed:"left",render:t=><span style={{fontWeight:500,fontSize:13}}>{t}</span>},
  {title:"Target",dataIndex:"target",width:90,align:"center"},
  ...dates.map(date=>({
    title:date, dataIndex:date, align:"center",
    render:(val,rec)=>{
      const raw=dataMap[date]?.[rec.key];
      const cc=getCellColor(raw);
      const empty=val===null||val===undefined||val===""||val==="-";
      return(
        <div style={{background:empty?"#f8fafc":cc?colorToTint(cc,0.18):"#f0fdf4",padding:"4px 6px",borderRadius:4,textAlign:"center",fontSize:12,color:empty?"#94a3b8":"#1e293b"}}>
          {empty?"-":val}
        </div>
      );
    },
  })),
];
setColumns(cols);

/* TABLE ROWS */
setAllRows(active.map(k=>{
  const row={key:k,metric:k,target:getT(k)};
  dates.forEach(d=>{row[d]=getCellDisplay(dataMap[d]?.[k]);});
  return row;
}));

/* TILES */
const gDates = currentVb==="day"?dates:dates.slice(-12);
setAllTiles(active.filter(k=>hasReal(k,dates,dataMap)).map(k=>{
  /* value */
  let val=getOverall(tileObj?.[k]);
  if(val===null){for(let i=dates.length-1;i>=0;i--){const v=getOverall(dataMap[dates[i]]?.[k]);if(v!==null){val=v;break;}}}
  /* color */
  let color=getColor(tileObj?.[k]);
  if(!color||color==="#94a3b8"){for(const d of dates){const c=getColor(dataMap[d]?.[k]);if(c&&c!=="#94a3b8"){color=c;break;}}}
  /* target */
  let target=getTarget(tileObj?.[k]); if(target==="-") target=getT(k);
  /* series with per-bar color */
  const series=gDates.map(d=>{
    const raw=dataMap[d]?.[k];
    const v=getOverall(raw);
    return{value:v!==null&&!isNaN(Number(v))?Number(v):null, color:getColor(raw)||color};
  });
  /* unit */
  const sr=tileObj?.[k]??dataMap[dates[dates.length-1]]?.[k];
  const unit=String(extractField(sr,"Overall")??sr??"").includes("%")?"%":"";
  /* flags */
  const contractual=dates.some(d=>getBoolFlag(dataMap[d]?.[k],"Contractual"));
  const bonus=dates.some(d=>getBoolFlag(dataMap[d]?.[k],"Bonus and Penalty"));
  const bonusQ=dates.some(d=>getBoolFlag(dataMap[d]?.[k],"Bonus Qualifier"));
  const flat=!dates.some(d=>isNested(dataMap[d]?.[k]));
  /* current month status from tile */
  const cms=extractField(tileObj?.[k],"current_month_status")??null;
  const trend=extractField(tileObj?.[k],"bonus_trend")??null;
  return{key:k,label:k,color,unit,value:val,target,series,dates:gDates,viewBy:currentVb,contractual,bonus,bonusQ,flat,cms,trend};
}));
setShowAll(false);
```

};

/* FILTER HELPERS */
const upMulti=(key,val)=>{
let n=val;
if(val.length>1&&val[val.length-1]!==“ALL”) n=val.filter(v=>v!==“ALL”);
else if(val.includes(“ALL”)&&val[val.length-1]===“ALL”) n=[“ALL”];
if(!n.length) n=[“ALL”];
setFilters(p=>({…p,[key]:n}));
};

/* FILTERED DATA */
const tableData=useMemo(()=>{
if(!cOn&&!bOn&&!bqOn) return allRows;
return allRows.filter(r=>passesToggle(r.key,chartDates,chartDataMap,cOn,bOn,bqOn));
},[cOn,bOn,bqOn,allRows,chartDates,chartDataMap]);

const filteredTiles=useMemo(()=>{
if(!cOn&&!bOn&&!bqOn) return allTiles;
return allTiles.filter(t=>{
if(t.flat) return true;
if(cOn&&!t.contractual) return false;
if(bOn&&!t.bonus) return false;
if(bqOn&&!t.bonusQ) return false;
return true;
});
},[cOn,bOn,bqOn,allTiles]);

const visible = showAll ? filteredTiles : filteredTiles.slice(0,6);
const hasMore = filteredTiles.length > 6;

/* ─────────────────────────────────────────────────────────
RENDER
──────────────────────────────────────────────────────────*/
return (
<>
{loading && <LoaderOverlay show={loading}/>}
<div style={{padding:“4px 0”,opacity:loading?0.5:1,background:”#f1f5f9”,minHeight:“100vh”}}>
<style>{`.kfi .ant-select-selector{ background:#fff !important; border-color:#475569 !important; height:34px !important; min-height:34px !important; padding:0 10px !important; border-radius:6px !important; font-size:13px !important; } .kfi .ant-select:not(.ant-select-multiple) .ant-select-selection-item, .kfi .ant-select:not(.ant-select-multiple) .ant-select-selection-placeholder{ line-height:32px !important; font-size:13px !important; color:#1e293b !important; } .kfi .ant-select-selection-overflow{flex-wrap:nowrap;overflow:hidden;height:32px;align-items:center;} .kfi .ant-select-selection-item{ height:24px !important;line-height:22px !important;font-size:12px !important; background:#e2e8f0 !important;border-color:#cbd5e1 !important; color:#1e293b !important;border-radius:4px !important; padding:0 6px !important;display:flex !important;align-items:center !important; } .kfi .ant-select-selection-item-remove{color:#64748b !important;margin-left:3px !important;} .kfi .ant-select-arrow{color:#94a3b8 !important;} .ant-table-thead>tr>th{ background:#1e3a5f !important;color:#fff !important;font-weight:600;font-size:12px; } .tile-card{ background:#fff;border-radius:12px; box-shadow:0 1px 6px rgba(0,0,0,0.08),0 0 0 1px rgba(0,0,0,0.04); padding:18px;box-sizing:border-box; display:flex;flex-direction:column;min-width:0; min-height:340px; }`}</style>

```
    {/* ══ CARD 1: Year/Month + Toggles + View By (Figma top box) ══*/}
    <div className="kfi" style={{
      background:"#1e293b", borderRadius:12,
      padding:"14px 20px", marginBottom:10,
      boxShadow:"0 2px 8px rgba(0,0,0,0.15)",
    }}>
      <div style={{display:"flex",alignItems:"center",gap:18,flexWrap:"nowrap"}}>

        {viewBy!=="week" && (
          <div style={{display:"flex",flexDirection:"column",gap:4}}>
            <span style={{fontSize:10,fontWeight:700,color:"#94a3b8",letterSpacing:"1px",textTransform:"uppercase"}}>Year</span>
            <Select value={filters.year} style={{width:100}}
              popupMatchSelectWidth={false} styles={{popup:{minWidth:100}}}
              onChange={v=>setFilters(p=>({...p,year:v}))}>
              {(filterOptions.year||[]).map(v=><Option key={v} value={v}>{v}</Option>)}
            </Select>
          </div>
        )}

        {viewBy==="day" && (
          <div style={{display:"flex",flexDirection:"column",gap:4}}>
            <span style={{fontSize:10,fontWeight:700,color:"#94a3b8",letterSpacing:"1px",textTransform:"uppercase"}}>Month</span>
            <Select value={filters.month} style={{width:130}}
              popupMatchSelectWidth={false} styles={{popup:{minWidth:140}}}
              onChange={v=>setFilters(p=>({...p,month:v}))}>
              {(filterOptions.month||[]).map(v=><Option key={v} value={v}>{v}</Option>)}
            </Select>
          </div>
        )}

        <div style={{flex:1}}/>

        {/* TOGGLES */}
        {[
          {label:"Contractual",    val:cOn,  set:setCOn},
          {label:"Bonus & Penalty",val:bOn,  set:setBOn},
          {label:"Bonus Qualifier",val:bqOn, set:setBqOn},
        ].map(({label,val,set})=>(
          <Toggle key={label} label={label} value={val} onChange={set}/>
        ))}

        {/* VIEW BY */}
        <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
          <span style={{fontSize:10,fontWeight:700,color:"#94a3b8",letterSpacing:"1px",textTransform:"uppercase"}}>View By</span>
          <div style={{display:"flex",background:"#0f172a",borderRadius:8,padding:3,gap:2}}>
            {["Day","Week","Month"].map(lbl=>{
              const v=lbl.toLowerCase(), active=viewBy===v;
              return(
                <div key={v} onClick={()=>setViewBy(v)} style={{
                  padding:"5px 16px",cursor:"pointer",fontSize:13,fontWeight:700,
                  background:active?"#3b82f6":"transparent",
                  color:active?"#fff":"#94a3b8",
                  borderRadius:6,transition:"all 0.2s",whiteSpace:"nowrap",
                }}>{lbl}</div>
              );
            })}
          </div>
        </div>
      </div>
    </div>

    {/* ══ CARD 2: GEO / JC / LOB / SUPERVISOR / TENURE (Figma bottom box) ══*/}
    <div className="kfi" style={{
      background:"#1e293b", borderRadius:12,
      padding:"14px 20px", marginBottom:16,
      boxShadow:"0 2px 8px rgba(0,0,0,0.15)",
    }}>
      <div style={{display:"flex",gap:14,flexWrap:"nowrap",alignItems:"flex-end"}}>
        {[
          {label:"GEO",        key:"geo",          opts:filterOptions.geo||[]},
          {label:"JC",         key:"program",      opts:filterOptions.program||[]},
          {label:"LOB",        key:"lob",          opts:filterOptions.lob||[]},
          {label:"SUPERVISOR", key:"supervisor",   opts:filterOptions.supervisor||[]},
          {label:"TENURE",     key:"tenure_units", opts:filterOptions.tenure_units||filterOptions.tenure_unit||[]},
        ].map(({label,key,opts})=>(
          <div key={key} style={{flex:1,minWidth:0,display:"flex",flexDirection:"column",gap:4}}>
            <span style={{fontSize:10,fontWeight:700,color:"#94a3b8",letterSpacing:"1px",textTransform:"uppercase"}}>{label}</span>
            <Select mode="multiple" value={filters[key]}
              style={{width:"100%"}} popupMatchSelectWidth={false}
              styles={{popup:{minWidth:180}}} maxTagCount="responsive"
              onChange={v=>upMulti(key,v)}>
              {opts.map(v=><Option key={v} value={v}>{v}</Option>)}
            </Select>
          </div>
        ))}
      </div>
    </div>

    {/* error */}
    {error&&(
      <div style={{marginBottom:12,padding:"10px 16px",background:"#fef2f2",border:"1px solid #fecaca",borderRadius:8,color:"#dc2626",fontSize:13,display:"flex",alignItems:"center",gap:8}}>
        ⚠️ {error}
      </div>
    )}

    {/* ══ TILE GRID — 2×3, show more/less ══════════════*/}
    {filteredTiles.length>0&&(
      <div style={{marginBottom:20}}>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:14,marginBottom:12}}>
          {visible.map(t=>renderTile(t))}
          {visible.length%3!==0&&Array.from({length:3-visible.length%3}).map((_,i)=><div key={"pad"+i}/>)}
        </div>
        {hasMore&&(
          <div style={{display:"flex",justifyContent:"center"}}>
            <button onClick={()=>setShowAll(p=>!p)} style={{
              padding:"8px 28px",borderRadius:20,border:"1.5px solid #3b82f6",
              background:"#fff",color:"#3b82f6",fontSize:13,fontWeight:700,
              cursor:"pointer",transition:"all 0.2s",
            }}>
              {showAll?"↑ Show Less":"Show More ↓"}
            </button>
          </div>
        )}
      </div>
    )}

    {/* ══ TABLE ════════════════════════════════════════*/}
    <div style={{minHeight:120}}>
      {tableLoading?(
        <div style={{display:"flex",alignItems:"center",justifyContent:"center",padding:"60px 0",background:"#fff",borderRadius:10,boxShadow:"0 1px 8px rgba(0,0,0,0.06)"}}>
          <Spin size="large"/>
        </div>
      ):(
        <Table columns={columns} dataSource={tableData} pagination={false}
          bordered size="small" scroll={{x:"max-content",y:320}} rowKey="key"/>
      )}
    </div>
  </div>
</>
```

);

/* ─────────────────────────────────────────────────────────
TILE RENDER — exact Figma layout
──────────────────────────────────────────────────────────*/
function renderTile(tile) {
const {label,color,unit,value,target,series,dates:gd,viewBy:tvb,cms,trend} = tile;
const display = (value===null||value===undefined) ? “–” : value;
const targetNum = parseFloat(String(target).replace(”%”,””));

```
/* numeric series */
const nums = series.map(pt=>({
  v: pt.value!==null&&!isNaN(Number(pt.value)) ? Number(pt.value) : null,
  c: pt.color||color,
}));
const valid   = nums.filter(p=>p.v!==null).map(p=>p.v);
const hasG    = valid.length>0;

/* Figma-style zoomed Y axis: min = floor(min*0.999), max = ceil(max*1.001) */
const dataMin   = hasG ? Math.min(...valid) : 0;
const dataMax   = hasG ? Math.max(...valid) : 100;
const pad       = (dataMax-dataMin)*0.15 || 5;
const yMin      = Math.floor((dataMin-pad)*10)/10;
const yMax      = Math.ceil((dataMax+pad)*10)/10;
const yRange    = yMax-yMin || 1;
const yMid      = parseFloat(((yMin+yMax)/2).toFixed(1));
const GRAPH_H   = 110;

const barH = v => v!==null ? Math.max(((v-yMin)/yRange)*GRAPH_H, 2) : 0;
const barColor = v => (!isNaN(targetNum)&&v!==null) ? (v>=targetNum?"#22c55e":"#ef4444") : color;

/* target line */
const targetPct = (!isNaN(targetNum)&&yRange>0) ? Math.max(0,Math.min(((targetNum-yMin)/yRange)*100,100)) : null;

return (
  <div className="tile-card" key={label}>

    {/* HEADER ROW: title + target */}
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:2}}>
      <div style={{fontSize:12,fontWeight:700,color:"#475569",flex:1,marginRight:8,lineHeight:1.3,wordBreak:"break-word"}}>
        {label}
      </div>
      {target!=="-"&&(
        <span style={{fontSize:11,fontWeight:700,color:color,whiteSpace:"nowrap",flexShrink:0}}>
          Target: {target}
        </span>
      )}
    </div>

    {/* LEGEND */}
    <div style={{display:"flex",gap:12,marginBottom:6}}>
      {[["#22c55e","Above"],["#ef4444","Below"]].map(([c,lbl])=>(
        <span key={lbl} style={{fontSize:10,color:"#64748b",display:"flex",alignItems:"center",gap:3}}>
          <span style={{width:8,height:8,borderRadius:"50%",background:c,display:"inline-block"}}/>
          {lbl}
        </span>
      ))}
    </div>

    {/* VALUE — large, colored */}
    <div style={{fontSize:30,fontWeight:800,color,lineHeight:1,marginBottom:8}}>
      {display}{display!=="--"&&unit?` ${unit}`:""}
    </div>

    {/* GRAPH */}
    <div style={{flex:1,display:"flex",flexDirection:"column",justifyContent:"flex-end"}}>
      {hasG ? (
        <>
          <div style={{display:"flex",alignItems:"flex-end",gap:2}}>
            {/* Y AXIS — zoomed values like Figma */}
            <div style={{
              display:"flex",flexDirection:"column",justifyContent:"space-between",
              height:GRAPH_H,flexShrink:0,marginRight:4,
              minWidth:28,textAlign:"right",
            }}>
              <span style={{fontSize:9,fontWeight:600,color:"#94a3b8",lineHeight:1}}>{yMax}</span>
              <span style={{fontSize:9,fontWeight:600,color:"#94a3b8",lineHeight:1}}>{yMid}</span>
              <span style={{fontSize:9,fontWeight:600,color:"#94a3b8",lineHeight:1}}>{yMin}</span>
            </div>

            {/* BARS + target line */}
            <div style={{
              flex:1,height:GRAPH_H,position:"relative",
              display:"flex",alignItems:"flex-end",
              gap:1,overflow:"hidden",
            }}>
              {nums.map((pt,i)=>(
                <div key={i}
                  title={pt.v!==null?`${pt.v}${unit}`:"No data"}
                  style={{
                    flex:1,height:pt.v!==null?barH(pt.v):0,
                    background:pt.v!==null?barColor(pt.v):"transparent",
                    borderRadius:"2px 2px 0 0",
                    transition:"height 0.3s",
                    minWidth:1.5,
                  }}
                />
              ))}
              {targetPct!==null&&(
                <div style={{
                  position:"absolute",left:0,right:0,
                  bottom:`${targetPct}%`,
                  borderTop:"1.5px dashed #94a3b8",
                  pointerEvents:"none",zIndex:2,
                }}/>
              )}
            </div>
          </div>

          {/* X AXIS — every tick */}
          <div style={{display:"flex",paddingLeft:32,marginTop:3}}>
            {gd.map((d,i)=>{
              const lbl = xAxisLabel(d, tvb||viewBy);
              /* For day view with many bars: show every label but rotate/skip if crowded */
              const vb = tvb||viewBy;
              const total = gd.length;
              /* show every label for day; every other for week/month if many */
              const show = vb==="day" ? true : (total<=6||i%2===0);
              return(
                <span key={String(d)} style={{
                  flex:1,textAlign:"center",
                  fontSize:vb==="day"&&total>20?7:9,
                  fontWeight:600,color:"#94a3b8",
                  whiteSpace:"nowrap",overflow:"visible",
                  lineHeight:1,
                }}>
                  {show?lbl:""}
                </span>
              );
            })}
          </div>
        </>
      ):(
        <div style={{height:GRAPH_H+20,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,color:"#cbd5e1"}}>
          No Data
        </div>
      )}
    </div>

    {/* CURRENT MONTH STATUS */}
    <div style={{marginTop:8,paddingTop:8,borderTop:"1px solid #f1f5f9"}}>
      <div style={{fontSize:11,color:"#475569",lineHeight:1.6}}>
        <span style={{color:"#94a3b8"}}>Current Month: </span>
        <span style={{fontWeight:700,color:
          cms==="Meeting Target"||cms==="Meeting Target and Bonus Eligible"?"#22c55e":
          cms==="Not Meeting Target"?"#ef4444":"#cbd5e1"}}>
          {cms||"—"}
        </span>
      </div>
      {trend&&(
        <div style={{fontSize:10,color:"#94a3b8",marginTop:2}}>
          {trend}
        </div>
      )}
    </div>
  </div>
);
```

}
}
