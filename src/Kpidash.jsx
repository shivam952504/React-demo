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

/* ── color helpers ──────────────────────────────────────────── */
const COLOR_MAP = {
green:”#22c55e”, red:”#ef4444”, orange:”#f97316”,
blue:”#3b82f6”,  yellow:”#eab308”, purple:”#a855f7”,
white:”#94a3b8”, gray:”#94a3b8”,  grey:”#94a3b8”,
};
const resolveColor = c => { if(!c) return “#22c55e”; const l=String(c).toLowerCase().trim(); return COLOR_MAP[l]||c; };
const colorToTint  = (c,a=0.13) => {
const h=resolveColor(c).replace(”#”,””);
if(h.length!==6) return `rgba(34,197,94,${a})`;
return `rgba(${parseInt(h.slice(0,2),16)},${parseInt(h.slice(2,4),16)},${parseInt(h.slice(4,6),16)},${a})`;
};

/* No frontend sorting — backend already returns keys in correct order */

/* ── x-axis label ───────────────────────────────────────────── */
/* xLabel(d, viewBy, year)
year = selected filter year, used to label “Q1 2026” on x-axis   */
function xLabel(d, viewBy, year){
const k = String(d).trim();

if(viewBy === “week”){
const m = k.match(/^W(?:eek)?(\d{1,2})(?:\s|$|()/i);
return m ? `W${parseInt(m[1])}` : k.split(” “)[0];
}

if(viewBy === “month”){
const iso = k.match(/^\d{4}-(\d{2})$/);
if(iso) return MONTH_NAMES[parseInt(iso[1])-1]?.substring(0,3) ?? k;
const my = k.match(/^([a-zA-Z]+)/);
return my ? my[1].substring(0,3) : k.substring(0,3);
}

if(viewBy === “quarterly”){
let qNum = null;
// “Quarter 1”, “Quarter 2” — exact backend format
const wordQ = k.match(/^Quarter\s*(\d)/i);
if(wordQ) qNum = parseInt(wordQ[1]);
// “Q1”, “Q1 2026”, “2026-Q1”
if(qNum===null){ const qm=k.match(/Q(\d)/i); if(qm) qNum=parseInt(qm[1]); }
// plain “1” “2” “3” “4”
if(qNum===null){ const nm=parseInt(k); if(!isNaN(nm)&&nm>=1&&nm<=4) qNum=nm; }
// ISO month “2026-03” → Q1
if(qNum===null){ const iso=k.match(/^\d{4}-(\d{2})$/); if(iso) qNum=Math.ceil(parseInt(iso[1])/3); }
// year: prefer embedded in key, else use filter year
let yr = year ?? “”;
const emb = k.match(/(\d{4})/); if(emb) yr = emb[1];
if(qNum!==null) return yr ? `Q${qNum} ${yr}` : `Q${qNum}`;
return k;
}

// day
const dt = new Date(k);
if(!isNaN(dt.getTime())) return String(dt.getDate());
return k.split(”-”).pop() || “”;
}

/* ── field extractors ───────────────────────────────────────── */
function extractField(raw,field){
if(raw===null||raw===undefined)return null;
if(typeof raw===“object”&&!Array.isArray(raw))return raw[field]!==undefined?raw[field]:null;
if(field===“Overall”||field===“overall”)return raw;
return null;
}
function getOverall(raw){
const v=extractField(raw,“Overall”)??extractField(raw,“overall”)??extractField(raw,“overall_percentage”)??(typeof raw!==“object”?raw:null);
if(v===null||v===undefined)return null;if(typeof v===“boolean”)return null;
const s=String(v).trim();if(s===””||s===”-”||s===”–”||s.toLowerCase()===“nan”)return null;
const n=parseFloat(s.replace(”%”,””));return isNaN(n)?s:n;
}
function getCellDisplay(raw){const v=getOverall(raw);return v!==null?v:”-”;}
function getCellColor(raw){return extractField(raw,“color”)||null;}
function getTarget(raw){const t=extractField(raw,“target”);if(t===null||t===undefined)return “-”;const s=String(t).trim();return(s===””||s===”-”||s===”–”)?”-”:s;}
function getColor(raw){return resolveColor(extractField(raw,“color”));}
function getBoolFlag(raw,flag){if(!raw||typeof raw!==“object”)return false;return raw[flag]===true;}
function isNested(raw){return raw!==null&&typeof raw===“object”&&!Array.isArray(raw)&&(“Overall” in raw||“overall” in raw||“overall_percentage” in raw);}

/* ── parse response ─────────────────────────────────────────── */
function parseDateEntries(response){
const nonTile=Object.keys(response).filter(k=>k!==“tile”);
const first=response[nonTile[0]];let dates=[],dataMap={};
const ok=v=>v&&typeof v===“object”&&!Array.isArray(v)&&Object.values(v).some(x=>typeof x===“string”||typeof x===“number”||typeof x===“boolean”||(typeof x===“object”&&x!==null&&“Overall” in x));
if(ok(first)){dates=nonTile;nonTile.forEach(d=>{dataMap[d]=response[d];});}
else{Object.values(response).forEach(g=>{if(g&&typeof g===“object”&&!Array.isArray(g))Object.keys(g).forEach(d=>{if(d!==“tile”){dates.push(d);dataMap[d]=g[d];}});});}
return{dates:[…new Set(dates)],dataMap}; // preserve backend order, no sorting
}
function discoverKeys(dates,dataMap){const seen=new Set(),o=[];dates.forEach(d=>{const e=dataMap[d];if(!e)return;Object.keys(e).forEach(k=>{if(!seen.has(k)){seen.add(k);o.push(k);}});});return o;}
function keyExists(k,dates,dataMap){return dates.some(d=>k in(dataMap[d]||{}));}
function hasReal(k,dates,dataMap){return dates.some(d=>getOverall(dataMap[d]?.[k])!==null);}
function passesToggle(k,dates,dataMap,cOn,bOn,bqOn){
if(!cOn&&!bOn&&!bqOn)return true;
if(!dates.some(d=>isNested(dataMap[d]?.[k])))return true;
if(cOn&&!dates.some(d=>getBoolFlag(dataMap[d]?.[k],“Contractual”)))return false;
if(bOn&&!dates.some(d=>getBoolFlag(dataMap[d]?.[k],“Bonus and Penalty”)))return false;
if(bqOn&&!dates.some(d=>getBoolFlag(dataMap[d]?.[k],“Bonus Qualifier”)))return false;
return true;
}

/* ── pill button helper ─────────────────────────────────────── */
function PillBtn({label,active,onClick}){
return(
<div onClick={onClick} style={{
padding:“6px 16px”,cursor:“pointer”,fontSize:13,fontWeight:700,
background:active?”#3b82f6”:“transparent”,
color:active?”#fff”:”#94a3b8”,
borderRadius:6,transition:“all 0.15s”,whiteSpace:“nowrap”,userSelect:“none”,
}}>{label}</div>
);
}
function PillGroup({children}){
return <div style={{display:“flex”,background:”#0f172a”,borderRadius:8,padding:3,gap:2}}>{children}</div>;
}

/* =============================================================
COMPONENT
============================================================= */
export default function KPIDashboard(){
const [loading,       setLoading]       = useState(false);
const [tableLoading,  setTableLoading]  = useState(false);
const [viewBy,        setViewBy]        = useState(“day”);
const [cOn,           setCOn]           = useState(false);
const [bOn,           setBOn]           = useState(false);
const [bqOn,          setBqOn]          = useState(false);
const [columns,       setColumns]       = useState([]);
const [filterOptions, setFilterOptions] = useState({});
const [allTiles,      setAllTiles]      = useState([]);
const [allRows,       setAllRows]       = useState([]);
const [chartDates,    setChartDates]    = useState([]);
const [chartDataMap,  setChartDataMap]  = useState({});
const [showAll,       setShowAll]       = useState(false);
const [isFlReady,     setIsFlReady]     = useState(false);
const [error,         setError]         = useState(null);

const [filters,setFilters]=useState({
year_type:“Calendar Year”,year:CURRENT_YEAR,month:“January”,
geo:[“ALL”],program:[“ALL”],lob:[“ALL”],supervisor:[“ALL”],tenure_units:[“ALL”],
});
const [debFilters,setDebFilters]=useState(null);
const debRef=React.useRef(null);
const activeVb=React.useRef(viewBy);

const dataEp  =vb=>vb===“day”?”/get_concora_daily_data/”:vb===“week”?”/get_concora_weekly_data/”:vb===“quarterly”?”/get_concora_quarterly_data/”:”/get_concora_monthly_data/”;
const filterEp=vb=>vb===“day”?”/get_concora_daily_filters/”:vb===“week”?”/get_concora_weekly_filters/”:vb===“quarterly”?”/get_quarterly_filters/”:”/get_concora_monthly_filters/”;
const mkP     =f=>({year_type:f.year_type,year:f.year,month:f.month,geo:f.geo,program:f.program,lob:f.lob,supervisor:f.supervisor,tenure_units:f.tenure_units});

useEffect(()=>{
if(debRef.current)clearTimeout(debRef.current);
debRef.current=setTimeout(()=>setDebFilters({…filters,_t:Date.now()}),600);
return()=>{if(debRef.current)clearTimeout(debRef.current);};
},[filters]);

const runFetch=(vb,payload)=>{
setLoading(true);setTableLoading(true);setError(null);
setAllRows([]);setAllTiles([]);setColumns([]);
return axios.post(API_BASE+filterEp(vb),payload)
.then(r=>{if(activeVb.current!==vb)return;setFilterOptions(r.data||{});setIsFlReady(true);setLoading(false);return axios.post(API_BASE+dataEp(vb),payload);})
.then(r=>{if(!r||activeVb.current!==vb)return;if(!r.data||!Object.keys(r.data).length){setError(“No data available.”);return;}buildTable(r.data,vb);})
.catch(()=>{if(activeVb.current!==vb)return;setError(“Failed to load. Please try again.”);})
.finally(()=>{if(activeVb.current===vb){setLoading(false);setTableLoading(false);}});
};

useEffect(()=>{const vb=viewBy;activeVb.current=vb;setIsFlReady(false);runFetch(vb,mkP(filters));},[viewBy]); // eslint-disable-line

useEffect(()=>{
if(!isFlReady||!debFilters)return;
const vb=viewBy;setTableLoading(true);setError(null);
const p=mkP(debFilters);
axios.post(API_BASE+filterEp(vb),p)
.then(r=>{if(activeVb.current!==vb)return;setFilterOptions(r.data||{});return axios.post(API_BASE+dataEp(vb),p);})
.then(r=>{if(!r||activeVb.current!==vb)return;if(!r.data||!Object.keys(r.data).length){setAllRows([]);setAllTiles([]);setColumns([]);setError(“No data.”);return;}buildTable(r.data,vb);})
.catch(()=>{if(activeVb.current!==vb)return;setAllRows([]);setAllTiles([]);setColumns([]);setError(“Failed.”);})
.finally(()=>{if(activeVb.current===vb)setTableLoading(false);});
},[debFilters]); // eslint-disable-line

const buildTable=(response,currentVb)=>{
const tileObj=response.tile||{};
const{dates,dataMap}=parseDateEntries(response);
if(!dates.length){setColumns([]);setAllRows([]);setAllTiles([]);return;}
setChartDates(dates);setChartDataMap(dataMap);
const keys=discoverKeys(dates,dataMap);
const active=keys.filter(k=>keyExists(k,dates,dataMap));
const getT=k=>{for(const d of dates){const t=getTarget(dataMap[d]?.[k]);if(t!==”-”)return t;}return “-”;};

```
setColumns([
  {title:"Metric",dataIndex:"metric",width:260,fixed:"left",render:t=><span style={{fontWeight:500,fontSize:13}}>{t}</span>},
  {title:"Target",dataIndex:"target",width:90,align:"center"},
  ...dates.map(date=>({
    title:date,dataIndex:date,align:"center",
    render:(val,rec)=>{
      const raw=dataMap[date]?.[rec.key];
      const cc=getCellColor(raw);
      const empty=val===null||val===undefined||val===""||val==="-";
      return <div style={{background:empty?"#f8fafc":cc?colorToTint(cc,0.18):"#f0fdf4",padding:"4px 6px",borderRadius:4,textAlign:"center",fontSize:12,color:empty?"#94a3b8":"#1e293b"}}>{empty?"-":val}</div>;
    },
  })),
]);

setAllRows(active.map(k=>{const row={key:k,metric:k,target:getT(k)};dates.forEach(d=>{row[d]=getCellDisplay(dataMap[d]?.[k]);});return row;}));

const gDates=currentVb==="day"?dates:dates.slice(-12);
setAllTiles(active.filter(k=>hasReal(k,dates,dataMap)).map(k=>{
  let val=getOverall(tileObj?.[k]);
  if(val===null){for(let i=dates.length-1;i>=0;i--){const v=getOverall(dataMap[dates[i]]?.[k]);if(v!==null){val=v;break;}}}
  let color=getColor(tileObj?.[k]);
  if(!color||color==="#94a3b8"){for(const d of dates){const c=getColor(dataMap[d]?.[k]);if(c&&c!=="#94a3b8"){color=c;break;}}}
  let target=getTarget(tileObj?.[k]);if(target==="-")target=getT(k);
  const series=gDates.map(d=>{const raw=dataMap[d]?.[k];const v=getOverall(raw);return{v:v!==null&&!isNaN(Number(v))?Number(v):null,c:getColor(raw)||color};});
  const sr=tileObj?.[k]??dataMap[dates[dates.length-1]]?.[k];
  const unit=String(extractField(sr,"Overall")??sr??"").includes("%")?"%":"";
  const contractual=dates.some(d=>getBoolFlag(dataMap[d]?.[k],"Contractual"));
  const bonus=dates.some(d=>getBoolFlag(dataMap[d]?.[k],"Bonus and Penalty"));
  const bonusQ=dates.some(d=>getBoolFlag(dataMap[d]?.[k],"Bonus Qualifier"));
  const flat=!dates.some(d=>isNested(dataMap[d]?.[k]));
  // exact field names from backend tile response
  const cms=extractField(tileObj?.[k],"Current Trend")??extractField(tileObj?.[k],"current_month_status")??null;
  const trend=extractField(tileObj?.[k],"Bonus and Target Trend")??extractField(tileObj?.[k],"bonus_trend")??null;
  return{key:k,label:k,color,unit,value:val,target,series,dates:gDates,viewBy:currentVb,year:filters.year,contractual,bonus,bonusQ,flat,cms,trend};
}));
setShowAll(false);
```

};

const upMulti=(key,val)=>{
let n=val;
if(val.length>1&&val[val.length-1]!==“ALL”)n=val.filter(v=>v!==“ALL”);
else if(val.includes(“ALL”)&&val[val.length-1]===“ALL”)n=[“ALL”];
if(!n.length)n=[“ALL”];
setFilters(p=>({…p,[key]:n}));
};

const tableData=useMemo(()=>{
if(!cOn&&!bOn&&!bqOn)return allRows;
return allRows.filter(r=>passesToggle(r.key,chartDates,chartDataMap,cOn,bOn,bqOn));
},[cOn,bOn,bqOn,allRows,chartDates,chartDataMap]);

const filteredTiles=useMemo(()=>{
if(!cOn&&!bOn&&!bqOn)return allTiles;
return allTiles.filter(t=>{
if(t.flat)return true;
if(cOn&&!t.contractual)return false;
if(bOn&&!t.bonus)return false;
if(bqOn&&!t.bonusQ)return false;
return true;
});
},[cOn,bOn,bqOn,allTiles]);

const visible=showAll?filteredTiles:filteredTiles.slice(0,6);
const hasMore=filteredTiles.length>6;

/* ── year_type options: from API or fallback ── */
const yearTypeOpts=filterOptions.year_type?.length>0
?filterOptions.year_type
:[“Calendar Year”,“Fiscal Year”];

return(
<>
{loading&&<LoaderOverlay show={loading}/>}
{/* page wrapper — WHITE background like Figma */}
<div style={{padding:“16px”,opacity:loading?0.5:1,background:”#fff”,minHeight:“100vh”}}>
<style>{`/* selects inside dark cards */ .kfi-sel .ant-select-selector{ background:#fff !important;border-color:#334155 !important; height:36px !important;min-height:36px !important; padding:0 10px !important;border-radius:6px !important; font-size:13px !important; } .kfi-sel .ant-select:not(.ant-select-multiple) .ant-select-selection-item, .kfi-sel .ant-select:not(.ant-select-multiple) .ant-select-selection-placeholder{ line-height:34px !important;font-size:13px !important;color:#1e293b !important; } .kfi-sel .ant-select-selection-overflow{flex-wrap:nowrap;overflow:hidden;height:34px;align-items:center;} .kfi-sel .ant-select-selection-item{ height:24px !important;line-height:22px !important;font-size:12px !important; background:#e2e8f0 !important;border-color:#cbd5e1 !important; color:#1e293b !important;border-radius:4px !important; padding:0 6px !important;display:flex !important;align-items:center !important; } .kfi-sel .ant-select-selection-item-remove{color:#64748b !important;margin-left:3px !important;} .kfi-sel .ant-select-arrow{color:#94a3b8 !important;} .kfi-sel .ant-select-selection-placeholder{line-height:34px !important;font-size:13px !important;color:#94a3b8 !important;} /* table header */ .ant-table-thead>tr>th{background:#1e3a5f !important;color:#fff !important;font-weight:600;font-size:12px;} /* tile card */ .kpi-tile{ background:#fff;border-radius:12px; border:1px solid #e2e8f0; box-shadow:0 1px 4px rgba(0,0,0,0.06); padding:18px 18px 14px 18px; box-sizing:border-box; display:flex;flex-direction:column;min-width:0;overflow:hidden; }`}</style>

```
    {/* ══════════════════════════════════════════════════════
        CARD 1 — dark navy: Year pill | Metric pills | Period pills
        Exact Figma layout
    ══════════════════════════════════════════════════════*/}
    <div style={{
      background:"#1e293b",borderRadius:12,
      padding:"14px 24px",marginBottom:12,
      boxShadow:"0 2px 8px rgba(0,0,0,0.18)",
      display:"flex",alignItems:"center",
      gap:0,flexWrap:"nowrap",
    }}>
      {/* YEAR: Fiscal / Calendar */}
      <div style={{display:"flex",alignItems:"center",gap:12,paddingRight:28}}>
        <span style={{fontSize:13,fontWeight:700,color:"#94a3b8",whiteSpace:"nowrap"}}>Year:</span>
        <PillGroup>
          {yearTypeOpts.map(yt=>{
            // shorten long labels: "Calendar Year"→"Calendar", "Fiscal Year"→"Fiscal"
            const short=yt.replace(" Year","").replace(" year","");
            return <PillBtn key={yt} label={short} active={filters.year_type===yt}
              onClick={()=>setFilters(p=>({...p,year_type:yt}))}/>;
          })}
        </PillGroup>
      </div>

      {/* divider */}
      <div style={{width:1,height:32,background:"#334155",flexShrink:0,marginRight:28}}/>

      {/* METRIC: Contractual | Bonus & Penalty | Bonus Qualifier */}
      <div style={{display:"flex",alignItems:"center",gap:12,paddingRight:28}}>
        <span style={{fontSize:13,fontWeight:700,color:"#94a3b8",whiteSpace:"nowrap"}}>Metric:</span>
        <PillGroup>
          <PillBtn label="Contractual"    active={cOn}  onClick={()=>setCOn(p=>!p)}/>
          <PillBtn label="Bonus & Penalty" active={bOn} onClick={()=>setBOn(p=>!p)}/>
          <PillBtn label="Bonus Qualifier" active={bqOn} onClick={()=>setBqOn(p=>!p)}/>
        </PillGroup>
      </div>

      {/* divider */}
      <div style={{width:1,height:32,background:"#334155",flexShrink:0,marginRight:28}}/>

      {/* PERIOD: Day | Week | Month */}
      <div style={{display:"flex",alignItems:"center",gap:12}}>
        <span style={{fontSize:13,fontWeight:700,color:"#94a3b8",whiteSpace:"nowrap"}}>Period:</span>
        <PillGroup>
          <PillBtn label="Day"       active={viewBy==="day"}       onClick={()=>setViewBy("day")}/>
          <PillBtn label="Week"      active={viewBy==="week"}      onClick={()=>setViewBy("week")}/>
          <PillBtn label="Month"     active={viewBy==="month"}     onClick={()=>setViewBy("month")}/>
          <PillBtn label="Quarterly" active={viewBy==="quarterly"} onClick={()=>setViewBy("quarterly")}/>
        </PillGroup>
      </div>
    </div>

    {/* ══════════════════════════════════════════════════════
        CARD 2 — dark navy: Year + Month dropdowns + GEO/JC/LOB/SUPERVISOR/TENURE
    ══════════════════════════════════════════════════════*/}
    <div className="kfi-sel" style={{
      background:"#1e293b",borderRadius:12,
      padding:"14px 24px",marginBottom:20,
      boxShadow:"0 2px 8px rgba(0,0,0,0.18)",
    }}>
      <div style={{display:"flex",gap:16,flexWrap:"nowrap",alignItems:"flex-end"}}>

        {/* Year number dropdown */}
        {viewBy!=="week"&&(
          <div style={{display:"flex",flexDirection:"column",gap:5,minWidth:88}}>
            <span style={{fontSize:10,fontWeight:700,color:"#94a3b8",letterSpacing:"1px",textTransform:"uppercase"}}>Year</span>
            <Select value={filters.year} style={{width:"100%"}}
              popupMatchSelectWidth={false} styles={{popup:{minWidth:88}}}
              onChange={v=>setFilters(p=>({...p,year:v}))}>
              {(filterOptions.year||[]).map(v=><Option key={v} value={v}>{v}</Option>)}
            </Select>
          </div>
        )}

        {/* Month dropdown — day only */}
        {viewBy==="day"&&(
          <div style={{display:"flex",flexDirection:"column",gap:5,minWidth:110}}>
            <span style={{fontSize:10,fontWeight:700,color:"#94a3b8",letterSpacing:"1px",textTransform:"uppercase"}}>Month</span>
            <Select value={filters.month} style={{width:"100%"}}
              popupMatchSelectWidth={false} styles={{popup:{minWidth:130}}}
              onChange={v=>setFilters(p=>({...p,month:v}))}>
              {(filterOptions.month||[]).map(v=><Option key={v} value={v}>{v}</Option>)}
            </Select>
          </div>
        )}

        {/* GEO JC LOB SUPERVISOR TENURE */}
        {[
          {lbl:"GEO",      key:"geo",         opts:filterOptions.geo||[]},
          {lbl:"JC",       key:"program",     opts:filterOptions.program||[]},
          {lbl:"LOB",      key:"lob",         opts:filterOptions.lob||[]},
          {lbl:"SUPERVISOR",key:"supervisor", opts:filterOptions.supervisor||[]},
          {lbl:"TENURE",   key:"tenure_units",opts:filterOptions.tenure_units||filterOptions.tenure_unit||[]},
        ].map(({lbl,key,opts})=>(
          <div key={key} style={{flex:1,minWidth:0,display:"flex",flexDirection:"column",gap:5}}>
            <span style={{fontSize:10,fontWeight:700,color:"#94a3b8",letterSpacing:"1px",textTransform:"uppercase"}}>{lbl}</span>
            <Select mode="multiple" value={filters[key]} style={{width:"100%"}}
              popupMatchSelectWidth={false} styles={{popup:{minWidth:180}}} maxTagCount="responsive"
              onChange={v=>upMulti(key,v)}>
              {opts.map(v=><Option key={v} value={v}>{v}</Option>)}
            </Select>
          </div>
        ))}
      </div>
    </div>

    {/* error banner */}
    {error&&(
      <div style={{marginBottom:16,padding:"10px 16px",background:"#fef2f2",border:"1px solid #fecaca",borderRadius:8,color:"#dc2626",fontSize:13,display:"flex",alignItems:"center",gap:8}}>
        ⚠️ {error}
      </div>
    )}

    {/* ══════════════════════════════════════════════════════
        TILE GRID — 2 rows × 3 cols, Show More / Show Less
    ══════════════════════════════════════════════════════*/}
    {filteredTiles.length>0&&(
      <div style={{marginBottom:24}}>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,minmax(0,1fr))",gap:16,marginBottom:14}}>
          {visible.map(t=>renderTile(t))}
          {/* pad last row */}
          {visible.length%3!==0&&Array.from({length:3-visible.length%3}).map((_,i)=><div key={"p"+i}/>)}
        </div>
        {hasMore&&(
          <div style={{display:"flex",justifyContent:"center"}}>
            <button onClick={()=>setShowAll(p=>!p)} style={{
              padding:"8px 32px",borderRadius:20,
              border:"1.5px solid #3b82f6",background:"#fff",
              color:"#3b82f6",fontSize:13,fontWeight:700,cursor:"pointer",
              transition:"background 0.2s",
            }}
              onMouseEnter={e=>e.currentTarget.style.background="#eff6ff"}
              onMouseLeave={e=>e.currentTarget.style.background="#fff"}>
              {showAll?"↑ Show Less":"Show More ↓"}
            </button>
          </div>
        )}
      </div>
    )}

    {/* ══ TABLE ═══════════════════════════════════════════*/}
    <div>
      {tableLoading?(
        <div style={{display:"flex",alignItems:"center",justifyContent:"center",padding:"60px 0",background:"#fff",borderRadius:10,border:"1px solid #e2e8f0"}}>
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

/* ══════════════════════════════════════════════════════════
renderTile — exact Figma card layout
══════════════════════════════════════════════════════════*/
function renderTile(tile){
const{label,color,unit,value,target,series,dates:gd,viewBy:tvb,year:tYear,cms,trend}=tile;
const display=(value===null||value===undefined)?”–”:value;
const targetNum=parseFloat(String(target).replace(”%”,””));

```
/* Y axis — always starts from 0 so target line is always visible */
const nums=series.map(pt=>({v:pt.v!==null&&!isNaN(Number(pt.v))?Number(pt.v):null,c:pt.c||color}));
const valid=nums.filter(p=>p.v!==null).map(p=>p.v);
const hasG=valid.length>0;
const dMax=hasG?Math.max(...valid):100;
const yMin=0;
// yMax = at least the max data value + 5% headroom, rounded up to nice number
const rawMax=Math.max(dMax*1.05, isNaN(targetNum)?0:targetNum*1.05);
const yMax=Math.ceil(rawMax/10)*10||100;
const yMid=Math.round(yMax/2);
const yRange=yMax; // since yMin=0
const GH=110; // graph height px
const bH=v=>Math.max((v/yRange)*GH,2);
const bColor=v=>(!isNaN(targetNum)&&v!==null)?(v>=targetNum?"#22c55e":"#ef4444"):(color);
const tPct=(!isNaN(targetNum)&&yRange>0)?Math.min((targetNum/yRange)*100,100):null;

const vb=tvb||viewBy;
const total=gd.length;

return(
  <div className="kpi-tile" key={label}>

    {/* row 1: title + target */}
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:4}}>
      <div style={{fontSize:12,fontWeight:700,color:"#475569",flex:1,marginRight:8,lineHeight:1.4,whiteSpace:"normal",overflow:"hidden",display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical"}}>{label}</div>
      {target!=="-"&&(
        <span style={{fontSize:11,fontWeight:700,whiteSpace:"nowrap",flexShrink:0}}>
          Target: <span style={{color}}>{target}</span>
        </span>
      )}
    </div>

    {/* row 2: legend */}
    <div style={{display:"flex",gap:14,marginBottom:6}}>
      {[["#22c55e","Above"],["#ef4444","Below"]].map(([c,l])=>(
        <span key={l} style={{fontSize:10,color:"#64748b",display:"flex",alignItems:"center",gap:3}}>
          <span style={{width:8,height:8,borderRadius:"50%",background:c,display:"inline-block"}}/>
          {l}
        </span>
      ))}
    </div>

    {/* row 3: big value */}
    <div style={{fontSize:28,fontWeight:800,color,lineHeight:1.1,marginBottom:6,whiteSpace:"nowrap"}}>
      {display}{display!=="--"&&unit?` ${unit}`:""}
    </div>

    {/* row 4: SVG chart */}
    <div style={{width:"100%",minWidth:0,marginTop:6}}>
      {hasG?(()=>{
        const VW=280, VH=GH, yAW=34, xAH=14;
        const cW=VW-yAW;
        const barGap=cW/total;
        const barW=Math.max(1.5, barGap*0.72);
        const tY=tPct!==null ? VH*(1-tPct/100) : null;
        const step=1; // show every label — alignment handled by SVG x position
        return(
          <svg viewBox={`0 0 ${VW} ${VH+xAH}`}
            style={{width:"100%",height:"auto",display:"block",overflow:"visible"}}
            preserveAspectRatio="none">

            {/* ── Y axis tick lines (horizontal, full chart width) */}
            {[[0,"#c8d5e0"],[VH/2,"#c8d5e0"],[VH,"#c8d5e0"]].map(([y,col],i)=>(
              <line key={i} x1={yAW} y1={y} x2={VW} y2={y}
                stroke={col} strokeWidth={0.8} strokeOpacity={0.6}/>
            ))}

            {/* ── Y axis labels */}
            <text x={yAW-3} y={9}       textAnchor="end" fontSize={8} fill="#94a3b8" fontWeight="600" fontFamily="sans-serif">{yMax}</text>
            <text x={yAW-3} y={VH/2+4}  textAnchor="end" fontSize={8} fill="#94a3b8" fontWeight="600" fontFamily="sans-serif">{yMid}</text>
            <text x={yAW-3} y={VH+1}    textAnchor="end" fontSize={8} fill="#94a3b8" fontWeight="600" fontFamily="sans-serif">{yMin}</text>

            {/* ── Bars */}
            {nums.map((pt,i)=>{
              if(pt.v===null) return null;
              const h=bH(pt.v);
              const x=yAW+i*barGap+(barGap-barW)/2;
              const tipLabel=xLabel(gd[i],vb,tYear);
              const tipVal=`${tipLabel}: ${pt.v}${unit}`;
              return(
                <rect key={i} x={x} y={VH-h} width={barW} height={h}
                  fill={bColor(pt.v)} rx={1}
                  style={{cursor:"pointer"}}>
                  <title>{tipVal}</title>
                </rect>
              );
            })}

            {/* ── Dashed target line */}
            {tY!==null&&(
              <line x1={yAW} y1={tY} x2={VW} y2={tY}
                stroke="#3b82f6" strokeWidth={1.5} strokeDasharray="5,3" strokeOpacity={0.8}/>
            )}

            {/* ── X axis labels */}
            {gd.map((d,i)=>{
              if(i%step!==0) return null;
              const lbl=xLabel(d,vb,tYear);
              const x=yAW+i*barGap+barGap/2;
              return <text key={i} x={x} y={VH+xAH}
                textAnchor="middle" fontSize={7} fill="#94a3b8" fontWeight="600" fontFamily="sans-serif">{lbl}</text>;
            })}
          </svg>
        );
      })():(
        <div style={{height:80,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,color:"#cbd5e1"}}>No Data</div>
      )}
    </div>

    {/* row 5: current trend + bonus/target trend from backend */}
    <div style={{marginTop:8,paddingTop:8,borderTop:"1px solid #f1f5f9"}}>
      <div style={{fontSize:11,lineHeight:1.5}}>
        <span style={{color:"#64748b",fontWeight:500}}>Current Month: </span>
        <span style={{fontWeight:700,color:
          (cms&&cms.toLowerCase().includes("not meeting"))?"#ef4444":
          (cms&&cms.toLowerCase().includes("meeting"))?"#22c55e":"#94a3b8"}}>
          {cms||"—"}
        </span>
      </div>
      {trend&&(
        <div style={{fontSize:10,lineHeight:1.4,marginTop:2}}>
          <span style={{color:"#64748b"}}>Bonus and Target Trend: </span>
          <span style={{fontWeight:600,color:"#3b82f6"}}>{trend}</span>
        </div>
      )}
    </div>
  </div>
);
```

}
}
