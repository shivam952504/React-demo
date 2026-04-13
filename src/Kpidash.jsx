import React, { useEffect, useState, useMemo } from “react”;
import axios from “axios”;
import { Select, Table, Spin } from “antd”;
import LoaderOverlay from “../loader/LoaderOverlay”;

const { Option } = Select;
const API_BASE = “http://localhost:9009/api”;

const MONTH_NAMES = [
“January”,“February”,“March”,“April”,“May”,“June”,
“July”,“August”,“September”,“October”,“November”,“December”
];
const CURRENT_YEAR = new Date().getFullYear();

/* –– color helpers –––––––––––––––––––––––––––––––– */
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

/* No frontend sorting – backend already returns keys in correct order */

/* –– x-axis label —————————————————————– */
function xLabel(d,viewBy){
const k=String(d).trim();
if(viewBy===“week”){const m=k.match(/^W(?:eek)?(\d{1,2})(?:\s|$|()/i);return m?`W${parseInt(m[1])}`:k.split(” “)[0];}
if(viewBy===“month”){
const iso=k.match(/^(\d{4})-(\d{2})$/);if(iso)return MONTH_NAMES[parseInt(iso[1])-1].substring(0,3)??k;
// month name or “Jan-2026” – just return first 3 chars
const my=k.match(/^([a-zA-Z]+)/);return my?my[1].substring(0,3):k.substring(0,3);
}
if(viewBy===“quarterly”){
// handles “Q1”, “Q1 2026”, “2026-Q1”, “1” etc.
const wordQ = k.match(/^Quarter\s*(\d)/i);
if(wordQ) return `Q${wordQ[1]}`;

```
const qm = k.match(/Q(\d)/i);
if(qm) return `Q${qm[1]}`;

const nm = parseInt(k);
if(!isNaN(nm) && nm >= 1 && nm <= 4) return `Q${nm}`;

// ISO month → map to quarter  ← THIS IS THE KEY FIX
const iso = k.match(/^(\d{4})-(\d{2})$/);
if(iso){
  const mo = parseInt(iso[2]);
  return `Q${Math.ceil(mo/3)}-${iso[1]}`; // e.g. Q1-2026
}

// Handle "Quarter-2026-2" or "Quarter-2025-1" format from API
const apiFormat = k.match(/^Quarter-(\d{4})-(\d)/i);
if(apiFormat) return `Q${apiFormat[2]}-${apiFormat[1]}`; // Q1-2026

return k.substring(0, 2);
```

}
const dt=new Date(k);if(!isNaN(dt.getTime()))return String(dt.getDate());
return k.split(”-”).pop()||””;
}

/* –– field extractors ———————————————————–– */
function extractField(raw,field){
if(raw===null||raw===undefined)return null;
if(typeof raw===“object”&&!Array.isArray(raw))return raw[field]===undefined?raw[field]:null;
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
function getCellColor(raw){const s=String(extractField(raw,“color”)||””);return s;}
function getTarget(raw){const t=extractField(raw,“target”);if(t===null||t===undefined)return “-”;const s=String(t).trim();return(s===””||s===”-”||s===”–”||s===”-.”)?”–”:s;}
function getColor(raw){return resolveColor(extractField(raw,“color”));}
function getBoolFlag(raw,flag){if(!raw||typeof raw!==“object”)return false;return raw[flag]===true;}
function isNested(raw){return raw!==null&&raw!==undefined&&typeof raw===“object”&&!Array.isArray(raw)&&(“Overall” in raw||“overall” in raw||“overall_percentage” in raw);}

/* –– parse response ————————————————————— */
function parseDateEntries(response){
const nonTile=Object.keys(response).filter(k=>k!==“tile”);
let dates=[],dataMap=new Map();
const first=nonTile[0];if(!first){dates=[];dataMap=new Map();}
const ok=v=>v&&typeof v===“object”&&!Array.isArray(v)&&Object.values(v).some(x=>typeof x===“string”||typeof x===“number”||typeof x===“boolean”||(typeof x===“object”&&x!=null&&“Overall” in x));
if(ok(response[first])){Object.keys(response[first]).forEach(d=>{if(d!==“tile”){dates.push(d);dataMap.set(d,response[first]);}})}
else{Object.values(response).forEach(g=>{if(g&&typeof g===“object”&&!Array.isArray(g))Object.keys(g).forEach(d=>{if(d!==“tile”){dates.push(d);dataMap.set(d,g);}});})}
return{dates:[…new Set(dates)],dataMap}; // preserve backend order, no sorting
}

function discoverKeys(dates,dataMap){const seen=new Set(),o=[];dates.forEach(d=>{const e=dataMap.get(d);if(!e)return;Object.keys(e).forEach(k=>{if(!seen.has(k)){seen.add(k);o.push(k);}});});return o;}
function keyExists(k,dates,dataMap){return dates.some(d=>k in (dataMap.get(d)||{}));}
function hasReal(k,dates,dataMap){return dates.some(d=>getOverall(dataMap.get(d)?.[k])!==null);}
function passesToggle(k,dates,dataMap,cOn,bOn,bqOn){
if(!cOn&&!bOn&&!bqOn)return true;
if(!dates.some(d=>isNested(dataMap.get(d)?.[k])))return true;
if(cOn&&dates.some(d=>getBoolFlag(dataMap.get(d)?.[k],“Contractual”)))return false;
if(bOn&&dates.some(d=>getBoolFlag(dataMap.get(d)?.[k],“Bonus and Penalty”)))return false;
if(bqOn&&dates.some(d=>getBoolFlag(dataMap.get(d)?.[k],“Bonus Qualifier”)))return false;
return true;
}

/* –– pill button helper ———————————————————– */
function PillBtn({label,active,onClick}){
return(
<div onClick={onClick} style={{
padding:“6px 16px”,cursor:“pointer”,fontSize:14,fontWeight:600,
background:active?”#3b82f6”:“transparent”,
color:active?”#fff”:”#fff”,
borderRadius:6,transition:“all 0.15s”,whiteSpace:“nowrap”,userSelect:“none”,
}}>{label}</div>
);
}
function PillGroup({children}){
return <div style={{display:“flex”,background:”#1e293b”,borderRadius:8,padding:3,gap:2}}>{children}</div>;
}

/* ====================================================================================
COMPONENT
==================================================================================== */
export default function KPIDashboard(){
const [loading,       setLoading]       = useState(false);
const [tableLoading,  setTableLoading]  = useState(false);
const [viewBy,        setViewBy]        = useState(“day”);
const [cOn,           setCOn]           = useState(true);
const [bOn,           setBOn]           = useState(false);
const [bqOn,          setBqOn]          = useState(false);
const [columns,       setColumns]       = useState([]);
const [filterOptions, setFilterOptions] = useState({});
const [allTiles,      setAllTiles]      = useState([]);
const [allRows,       setAllRows]       = useState([]);
const [chartDates,    setChartDates]    = useState([]);
const [chartDataMap,  setChartDataMap]  = useState({});
const [showAll,       setShowAll]       = useState(false);
const [isFIReady,     setIsFIReady]     = useState(false);
const [error,         setError]         = useState(null);

// ── NEW: info popover + expanded tile modal ──────────────────────────────
const [infoTile,      setInfoTile]      = useState(null);   // label string
const [expandedTile,  setExpandedTile]  = useState(null);   // full tile object

const [filters,setFilters]=useState({
year_type:“Calendar Year”,year:CURRENT_YEAR,month:“January”,
geo:[“ALL”],program:[“ALL”],lob:[“ALL”],supervisor:[“ALL”],tenure_unit:[“ALL”],
});
const [debFilters,setDebFilters]=useState(null);
const debRef=React.useRef(null);
const activeVb=React.useRef(viewBy);

const dataEp =vb=>vb===“day”?”/get_concora_daily_data” :vb===“week”?”/get_concora_weekly_data” :vb===“quarterly”?”/get_concora_quarterly_data”:”/get_concora_monthly_data”;
const filterEp=vb=>vb===“day”?”/get_concora_daily_filters”:vb===“week”?”/get_concora_weekly_filters”:vb===“quarterly”?”/get_quarterly_filters”        :”/get_monthly_filters”;
const mkP     =f=>({year_type:f.year_type,year:f.year,month:f.month,geo:f.geo,program:f.program,lob:f.lob,supervisor:f.supervisor,tenure_unit:f.tenure_unit});

useEffect(()=>{
if(debRef.current)clearTimeout(debRef.current);
debRef.current=setTimeout(()=>setDebFilters({…filters,_t:Date.now()}),800);
return()=>{if(debRef.current)clearTimeout(debRef.current);};
},[filters]);

const runFetch=(vb,payload)=>{
setLoading(true);setError(null);
setAllTiles([]);setAllRows([]);setColumns([]);
return axios.post(API_BASE+filterEp(vb),payload)
.then(r=>{if(activeVb.current!==vb)return;setFilterOptions(r.data||{});setIsFIReady(true);return axios.post(API_BASE+dataEp(vb),payload);})
.then(r=>{if(activeVb.current!==vb)return;if(!r||!Object.keys(r.data).length){setError(“No data available.”);return;}buildTable(r.data,vb);})
.catch(()=>{if(activeVb.current!==vb)return;setError(“Failed to load. Please try again.”);})
.finally(()=>{if(activeVb.current===vb){setLoading(false);setTableLoading(false);}});
};

useEffect(()=>{const vb=viewBy;activeVb.current=vb;setIsFIReady(false);runFetch(vb,mkP(filters));},[viewBy]); // eslint-disable-line

useEffect(()=>{
if(!isFIReady||!debFilters)return;
const vb=viewBy;setTableLoading(true);setLoading(true);setError(null);
const p=mkP(debFilters);
axios.post(API_BASE+filterEp(vb),p)
.then(r=>{if(activeVb.current!==vb)return;setFilterOptions(r.data||{});return axios.post(API_BASE+dataEp(vb),p);})
.then(r=>{if(activeVb.current!==vb)return;if(!r||!Object.keys(r.data).length){setAllRows([]);setAllTiles([]);setColumns([]);setError(“No data.”);return;}buildTable(r.data,vb);})
.catch(()=>{if(activeVb.current!==vb)return;setAllRows([]);setAllTiles([]);setColumns([]);setError(“Failed.”);})
.finally(()=>{if(activeVb.current===vb){setTableLoading(false);setLoading(false);}});
},[debFilters]); // eslint-disable-line

const buildTable=(response,currentVb)=>{
const tileObj=response.tile||{};
const{dates,dataMap}=parseDateEntries(response);
if(!dates.length){setColumns([]);setAllTiles([]);setAllRows([]);return;}
setChartDates(dates);setChartDataMap(dataMap);
const keys=discoverKeys(dates,dataMap);
const active=keys.filter(k=>keyExists(k,dates,dataMap));
const getT=k=>{for(const d of dates){const t=getTarget(dataMap.get(d)?.[k]);if(t!==”-”)return t;}return “-”;};

```
setColumns([
  {title:"Metric",dataIndex:"metric",width:260,fixed:"left",render:t=><span style={{fontWeight:500,fontSize:13}}>{t}</span>},
  {title:"Target",dataIndex:"target",width:90,align:"center"},
  ...dates.map(date=>({
    title:date,dataIndex:date,align:"center",
    render:(val,rec)=>{
      const raw=dataMap.get(date)?.[rec.key];
      const cc=getCellColor(raw);
      const empty=val===null||val===undefined||val===""||val==="-";
      return <div style={{background:empty?"#f8fafc":cc?colorToTint(cc,0.18):"#f0fdf4",padding:"4px 6px",borderRadius:4,textAlign:"center",fontSize:12,color:empty?"#94a3b8":"#1e293b"}}>{empty?"–":val}</div>;
    },
  })),
]);

setAllRows(active.map(k=>({key:k,metric:k,target:getT(k),...Object.fromEntries(dates.map(d=>[d,getCellDisplay(dataMap.get(d)?.[k])]))})));

const gDates=currentVb==="day"?dates.slice(-12):dates;
setAllTiles(active.filter(k=>hasReal(k,dates,dataMap)).map(k=>{
  let val=getOverall(tileObj?.[k]);
  if(val===null){for(let i=dates.length-1;i>=0;i--){const v=getOverall(dataMap.get(dates[i])?.[k]);if(v!==null){val=v;break;}}}
  let color=getColor(tileObj?.[k]);
  if(!color||color==="#94a3b8"){for(const d of dates){const c=getColor(dataMap.get(d)?.[k]);if(c&&c!=="#94a3b8"){color=c;break;}}}
  const target=getTarget(tileObj?.[k]);
  const series=gDates.map(d=>{const raw=dataMap.get(d)?.[k];const v=getOverall(raw);return{y:v!==null&&!isNaN(Number(v))?Number(v):null,c:getColor(raw)};});
  const sr=String(extractField(tileObj?.[k],"Overall")??"").includes("%")?"%":"";
  const contractual=dates.some(d=>getBoolFlag(dataMap.get(d)?.[k],"Contractual"));
  const bonus=dates.some(d=>getBoolFlag(dataMap.get(d)?.[k],"Bonus and Penalty"));
  const bonusQ=dates.some(d=>getBoolFlag(dataMap.get(d)?.[k],"Bonus Qualifier"));
  const flat=!dates.some(d=>isNested(dataMap.get(d)?.[k]));
  // exact field names from backend tile response
  const cms=extractField(tileObj?.[k],"Current Trend")??extractField(tileObj?.[k],"current_month_status")??null;
  const trend=extractField(tileObj?.[k],"Bonus and Target Trend")??extractField(tileObj?.[k],"bonus_trend")??null;
  return{key:k,label:k,color,unit:val,target,series,dates:gDates,viewBy:currentVb,contractual,bonus,bonusQ,flat,cms,trend};
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

/* –– year_type options: from API or fallback –– */
const yearTypeOpts=filterOptions.year_type?.length>0
?filterOptions.year_type
:[“Calendar Year”,“Fiscal Year”];

// Close info popover on outside click
useEffect(()=>{
const handler=()=>setInfoTile(null);
document.addEventListener(“click”,handler);
return()=>document.removeEventListener(“click”,handler);
},[]);

/* ====================================================================================
renderTile — exact Figma card layout
==================================================================================== */
function renderTile(tile){
const{label,color,unit,value,target,series,dates:gd,viewBy:tvb,cms,trend}=tile;
const display=(value===null||value===undefined)?”-”:value;
const targetNum=parseFloat(String(target).replace(”%”,””));

```
/* Y axis – always starts from 0 so target line is always visible */
const nums=series.map(pt=>({y:(pt.y!==null&&!isNaN(Number(pt.y)))?Number(pt.y):null,c:pt.c||color}));
const valid=nums.filter(p=>p.y!==null).map(p=>p.y);
const hasG=valid.length>0;
const dMax=hasG?Math.max(...valid):100;
const yMin=0;
// yMax – at least the max data value + 5% headroom, rounded up to nice number
const rawMax=Math.max(dMax*1.05, isNaN(targetNum)?0:targetNum*1.05);
const yMax=Math.ceil(rawMax/10)*10||100;
const yMid=Math.round(yMax/2);
const yRange=yMax; // since yMin=0
const GH=110; // graph height px
const bW=2;
const bl=v=>Math.max((v/yRange)*GH,2);
const bColor=v=>(!isNaN(targetNum)&&v!==null)?(v>=targetNum?"#22c55e":"#ef4444"):(color);
const tPct=(!isNaN(targetNum)&&yRange>0)?Math.min((targetNum/yRange)*100,100):null;

const vb=tvb||viewBy;
const total=gd.length;

/* Compact SVG chart for tile */
function TileBarChart(){
  const VW=280,VH=GH,xAW=14,yAW=14;
  const cW=VW-yAW;
  const barGap=cW/total;
  const barW=Math.max(1.5,barGap*0.72);
  const tY=tPct!==null?VH*(1-tPct/100):null;
  const step=Math.ceil(total/14);

  return(
    <svg viewBox={`0 0 ${VW} ${VH+xAW}`}
      style={{width:"100%",height:"auto",display:"block",overflow:"visible"}}
      preserveAspectRatio="none">

      {/* Y axis tick lines */}
      {[[0,"#c8d5e0"],[VH/2,"#c8d5e0"],[VH,"#c8d5e0"]].map(([y,col],i)=>(
        <line key={i} x1={yAW} y1={y} x2={VW} y2={y}
          stroke={col} strokeWidth={0.8} strokeOpacity={0.6}/>
      ))}

      {/* Y axis labels */}
      <text x={yAW-3} y={9}        textAnchor="end" fontSize={8} fill="#94a3b8" fontWeight="600" fontFamily="sans-serif">{yMax}</text>
      <text x={yAW-3} y={VH/2+4}   textAnchor="end" fontSize={8} fill="#94a3b8" fontWeight="600" fontFamily="sans-serif">{yMid}</text>
      <text x={yAW-3} y={VH+1}     textAnchor="end" fontSize={8} fill="#94a3b8" fontWeight="600" fontFamily="sans-serif">{yMin}</text>

      {/* Bars + value labels on top */}
      {nums.map((pt,i)=>{
        if(pt.y===null)return null;
        const h=Math.max((pt.y/yRange)*VH,2);
        const x=yAW+i*barGap+(barGap-barW)/2;
        const barTop=VH-h;
        const tipLabel=xLabel(gd[i],vb);
        const tipVal=`${tipLabel}: ${pt.y}${unit}`;
        const showLbl=(i%step===0);
        return(
          <g key={i}>
            <rect x={x} y={barTop} width={barW} height={h}
              fill={bColor(pt.y)} rx={1}
              style={{cursor:"pointer"}}>
              <title>{tipVal}</title>
            </rect>
            {/* Value label on top of bar */}
            {showLbl&&(
              <text
                x={x+barW/2}
                y={barTop-2}
                textAnchor="middle"
                fontSize={6}
                fill="#94a3b8"
                fontWeight="600"
                fontFamily="sans-serif"
              >{pt.y}</text>
            )}
          </g>
        );
      })}

      {/* Dashed target line */}
      {tY!==null&&(
        <line x1={yAW} y1={tY} x2={VW} y2={tY}
          stroke="#3b82f6" strokeWidth={1.5} strokeDasharray="5,3" strokeOpacity={0.8}/>
      )}

      {/* X axis labels */}
      {gd.map((d,i)=>{
        if(i%step!==0)return null;
        const lbl=xLabel(d,vb);
        const x=yAW+i*barGap+barGap/2;
        return(
          <text key={i} x={x} y={VH+xAW}
            textAnchor="middle" fontSize={6} fill="#94a3b8" fontWeight="600" fontFamily="sans-serif">
            {lbl}
          </text>
        );
      })}
    </svg>
  );
}

return(
  <div className="kpi-tile" key={label}
    style={{cursor:"pointer"}}
    onClick={()=>setExpandedTile(tile)}>

    {/* row 1: title | (i) button stacked above target */}
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:4}}>
      {/* Left: label */}
      <div style={{
        fontSize:12,fontWeight:700,color:"#475569",
        flex:1,marginRight:8,lineHeight:1.4,
        whiteSpace:"normal",overflow:"hidden",
        display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical"
      }}>{label}</div>

      {/* Right: (i) button above target */}
      <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",flexShrink:0}}>

        {/* ── (i) info button ── */}
        <div
          style={{position:"relative",marginBottom:4}}
          onClick={e=>{e.stopPropagation();setInfoTile(infoTile===label?null:label);}}>
          <div style={{
            width:16,height:16,borderRadius:"50%",
            background:"#e2e8f0",display:"flex",alignItems:"center",
            justifyContent:"center",cursor:"pointer",fontSize:10,
            fontWeight:700,color:"#64748b",userSelect:"none"
          }}>i</div>

          {/* Popover */}
          {infoTile===label&&(
            <div style={{
              position:"absolute",right:0,top:22,zIndex:99,
              background:"#1e293b",color:"#fff",borderRadius:8,
              padding:"10px 14px",minWidth:200,fontSize:11,
              boxShadow:"0 4px 20px rgba(0,0,0,0.3)",lineHeight:1.6
            }}
              onClick={e=>e.stopPropagation()}>
              <div style={{fontWeight:700,marginBottom:4,color:"#94a3b8",fontSize:10,textTransform:"uppercase"}}>Metric Info</div>
              <div><b>Metric:</b> {label}</div>
              {target!=="-"&&<div><b>Target:</b> {target}</div>}
              <div><b>Period:</b> {vb}</div>
              <div><b>Data Points:</b> {total}</div>
              {cms&&<div style={{marginTop:4,color:cms.toLowerCase().includes("not")?"#ef4444":"#22c55e",fontWeight:600}}>{cms}</div>}
            </div>
          )}
        </div>

        {/* Target – now below the (i) button */}
        {target!=="-"&&(
          <span style={{fontSize:11,fontWeight:700,whiteSpace:"nowrap"}}>
            Target: <span style={{color}}>{target}</span>
          </span>
        )}
      </div>
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
      {display==="--"&&<span>{display}</span>}
      {display!=="--"&&<span>{display}{unit==="%"?" %":""}</span>}
    </div>

    {/* row 4: SVG chart */}
    <div style={{width:"100%",minWidth:0,marginTop:6}}>
      {hasG?<TileBarChart/>:<div style={{height:80,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,color:"#cbd5e1"}}>No Data</div>}
    </div>

    {/* row 5: current trend + bonus/target trend from backend */}
    <div style={{marginTop:8,paddingTop:8,borderTop:"1px solid #f1f5f9"}}>
      <div style={{fontSize:11,lineHeight:1.5}}>
        <span style={{color:"#64748b",fontWeight:"bold"}}>Current Month: </span>
        <span style={{fontWeight:"bold",color:
          (cms&&cms.toLowerCase().includes("not meeting"))?"#ef4444":
          (cms&&cms.toLowerCase().includes("meeting"))?"#22c55e":"#94a3b8"
        }}>{cms||"–"}</span>
      </div>
      {trend&&(
        <div style={{fontSize:10,lineHeight:1.4,marginTop:2}}>
          <span style={{color:"#64748b",fontWeight:"bold"}}>Bonus and Target Trend: </span>
          <span style={{fontWeight:"bold",color:"#3b82f6"}}>{trend}</span>
        </div>
      )}
    </div>
  </div>
);
```

}

/* ====================================================================================
EXPANDED TILE MODAL
==================================================================================== */
function ExpandedTileModal(){
if(!expandedTile)return null;
const t=expandedTile;
const{label,color,unit,value,target,series,dates:gd,viewBy:tvb,cms,trend}=t;
const display=(value===null||value===undefined)?”-”:value;
const targetNum=parseFloat(String(target).replace(”%”,””));
const vb=tvb||viewBy;
const total=gd.length;

```
const nums=series.map(pt=>({
  y:(pt.y!==null&&!isNaN(Number(pt.y)))?Number(pt.y):null,
  c:pt.c||color
}));
const valid=nums.filter(p=>p.y!==null).map(p=>p.y);
const hasG=valid.length>0;
const dMax=hasG?Math.max(...valid):100;
const rawMax=Math.max(dMax*1.05,isNaN(targetNum)?0:targetNum*1.05);
const yMax=Math.ceil(rawMax/10)*10||100;
const yMid=Math.round(yMax/2);
const yRange=yMax;

const VW=600,VH=200,xAW=18,yAW=28;
const cW=VW-yAW;
const barGap=cW/total;
const barW=Math.max(2,barGap*0.72);
const bColor=v=>(!isNaN(targetNum)&&v!==null)?(v>=targetNum?"#22c55e":"#ef4444"):color;
const tPct=(!isNaN(targetNum)&&yRange>0)?Math.min((targetNum/yRange)*100,100):null;
const tY=tPct!==null?VH*(1-tPct/100):null;
const step=Math.max(1,Math.ceil(total/30));

// Stats
const aboveCount=valid.filter(v=>!isNaN(targetNum)&&v>=targetNum).length;
const belowCount=valid.filter(v=>!isNaN(targetNum)&&v<targetNum).length;
const avg=valid.length?(valid.reduce((a,b)=>a+b,0)/valid.length).toFixed(1):"-";
const maxVal=valid.length?Math.max(...valid):"-";
const minVal=valid.length?Math.min(...valid):"-";

return(
  <div
    style={{
      position:"fixed",inset:0,zIndex:1000,
      background:"rgba(0,0,0,0.55)",backdropFilter:"blur(4px)",
      display:"flex",alignItems:"center",justifyContent:"center",
      padding:24
    }}
    onClick={()=>setExpandedTile(null)}>

    <div
      style={{
        background:"#fff",borderRadius:16,width:"100%",maxWidth:820,
        maxHeight:"90vh",overflowY:"auto",
        boxShadow:"0 20px 60px rgba(0,0,0,0.3)",
        padding:"28px 32px"
      }}
      onClick={e=>e.stopPropagation()}>

      {/* Modal header */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:20}}>
        <div>
          <div style={{fontSize:18,fontWeight:800,color:"#1e293b",marginBottom:6}}>{label}</div>
          <div style={{display:"flex",gap:16,flexWrap:"wrap"}}>
            {target!=="-"&&(
              <span style={{fontSize:13,fontWeight:600}}>
                Target: <span style={{color}}>{target}</span>
              </span>
            )}
            <span style={{fontSize:13,color:"#64748b"}}>Period: <b>{vb}</b></span>
            <span style={{fontSize:13,color:"#64748b"}}>Data Points: <b>{total}</b></span>
          </div>
        </div>

        {/* ── Close button ── */}
        <button
          onClick={()=>setExpandedTile(null)}
          style={{
            width:36,height:36,borderRadius:"50%",
            border:"none",background:"#f1f5f9",
            fontSize:18,cursor:"pointer",display:"flex",
            alignItems:"center",justifyContent:"center",
            color:"#475569",fontWeight:700,flexShrink:0,
            transition:"background 0.15s"
          }}
          onMouseEnter={e=>e.currentTarget.style.background="#e2e8f0"}
          onMouseLeave={e=>e.currentTarget.style.background="#f1f5f9"}
        >✕</button>
      </div>

      {/* Big value + legend */}
      <div style={{display:"flex",alignItems:"center",gap:24,marginBottom:16}}>
        <div style={{fontSize:48,fontWeight:800,color,lineHeight:1}}>
          {display}{unit==="%"?" %":""}
        </div>
        <div style={{display:"flex",gap:16}}>
          {[["#22c55e","Above"],["#ef4444","Below"]].map(([c,l])=>(
            <span key={l} style={{fontSize:12,color:"#64748b",display:"flex",alignItems:"center",gap:4}}>
              <span style={{width:10,height:10,borderRadius:"50%",background:c,display:"inline-block"}}/>
              {l}
            </span>
          ))}
        </div>
      </div>

      {/* Stats row */}
      <div style={{display:"flex",gap:12,marginBottom:20,flexWrap:"wrap"}}>
        {[
          ["Average",  avg+(unit==="%"?"%":"")],
          ["Max",      maxVal+(unit==="%"?"%":"")],
          ["Min",      minVal+(unit==="%"?"%":"")],
          ["Above Target", aboveCount],
          ["Below Target", belowCount],
        ].map(([lbl,val])=>(
          <div key={lbl} style={{
            background:"#f8fafc",borderRadius:10,padding:"10px 16px",
            border:"1px solid #e2e8f0",flex:"1 1 auto",minWidth:100
          }}>
            <div style={{fontSize:10,color:"#94a3b8",fontWeight:600,textTransform:"uppercase",marginBottom:2}}>{lbl}</div>
            <div style={{fontSize:16,fontWeight:800,color:"#1e293b"}}>{val}</div>
          </div>
        ))}
      </div>

      {/* Large chart */}
      <div style={{width:"100%",minWidth:0}}>
        {hasG?(
          <svg viewBox={`0 0 ${VW} ${VH+xAW}`}
            style={{width:"100%",height:"auto",display:"block",overflow:"visible"}}
            preserveAspectRatio="none">

            {/* Y axis tick lines */}
            {[[0,"#c8d5e0"],[VH/2,"#c8d5e0"],[VH,"#c8d5e0"]].map(([y,col],i)=>(
              <line key={i} x1={yAW} y1={y} x2={VW} y2={y}
                stroke={col} strokeWidth={0.8} strokeOpacity={0.5}/>
            ))}

            {/* Y axis labels */}
            <text x={yAW-4} y={9}       textAnchor="end" fontSize={9} fill="#94a3b8" fontWeight="600" fontFamily="sans-serif">{yMax}</text>
            <text x={yAW-4} y={VH/2+4}  textAnchor="end" fontSize={9} fill="#94a3b8" fontWeight="600" fontFamily="sans-serif">{yMid}</text>
            <text x={yAW-4} y={VH+1}    textAnchor="end" fontSize={9} fill="#94a3b8" fontWeight="600" fontFamily="sans-serif">0</text>

            {/* Bars + value labels on top */}
            {nums.map((pt,i)=>{
              if(pt.y===null)return null;
              const h=Math.max((pt.y/yRange)*VH,2);
              const x=yAW+i*barGap+(barGap-barW)/2;
              const barTop=VH-h;
              const showLbl=(i%step===0);
              const tipLabel=xLabel(gd[i],vb);
              return(
                <g key={i}>
                  <rect x={x} y={barTop} width={barW} height={h}
                    fill={bColor(pt.y)} rx={1} style={{cursor:"default"}}>
                    <title>{tipLabel}: {pt.y}{unit}</title>
                  </rect>
                  {/* Value label on top of every bar in modal */}
                  <text
                    x={x+barW/2}
                    y={barTop-3}
                    textAnchor="middle"
                    fontSize={7}
                    fill="#475569"
                    fontWeight="700"
                    fontFamily="sans-serif"
                  >{pt.y}</text>
                </g>
              );
            })}

            {/* Dashed target line */}
            {tY!==null&&(
              <line x1={yAW} y1={tY} x2={VW} y2={tY}
                stroke="#3b82f6" strokeWidth={1.5} strokeDasharray="5,3" strokeOpacity={0.8}/>
            )}

            {/* X axis labels */}
            {gd.map((d,i)=>{
              if(i%step!==0)return null;
              const lbl=xLabel(d,vb);
              const x=yAW+i*barGap+barGap/2;
              return(
                <text key={i} x={x} y={VH+xAW}
                  textAnchor="middle" fontSize={7} fill="#94a3b8" fontWeight="600" fontFamily="sans-serif">
                  {lbl}
                </text>
              );
            })}
          </svg>
        ):(
          <div style={{height:120,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,color:"#cbd5e1"}}>No Data</div>
        )}
      </div>

      {/* Bottom: current month + trend */}
      <div style={{marginTop:20,paddingTop:16,borderTop:"1px solid #f1f5f9",display:"flex",gap:32,flexWrap:"wrap"}}>
        <div>
          <div style={{fontSize:11,color:"#64748b",fontWeight:600,textTransform:"uppercase",marginBottom:4}}>Current Month</div>
          <div style={{fontSize:14,fontWeight:700,color:
            (cms&&cms.toLowerCase().includes("not meeting"))?"#ef4444":
            (cms&&cms.toLowerCase().includes("meeting"))?"#22c55e":"#94a3b8"
          }}>{cms||"–"}</div>
        </div>
        {trend&&(
          <div>
            <div style={{fontSize:11,color:"#64748b",fontWeight:600,textTransform:"uppercase",marginBottom:4}}>Bonus & Target Trend</div>
            <div style={{fontSize:14,fontWeight:700,color:"#3b82f6"}}>{trend}</div>
          </div>
        )}
      </div>

    </div>
  </div>
);
```

}

return(
<>
{loading&&<LoaderOverlay show={loading}/>}
{/* page wrapper – WHITE background like Figma */}
<div style={{padding:“16px”,background:”#fff”,minHeight:“100vh”}}>
<style>{`/* selects inside dark cards */ .kfi-sel .ant-select-selector{ background:#fff !important;border-color:#334155 !important; height:36px !important;min-height:36px !important; padding:0 10px !important;border-radius:6px !important } .kfi-sel .ant-select-selection-item, .kfi-sel .ant-select-not(.ant-select-multiple) .ant-select-selection-item, .kfi-sel .ant-select-selection-placeholder{ line-height:34px !important;font-size:13px !important;color:#1e293b !important; } .kfi-sel .ant-select-selection-overflow{flex-wrap:nowrap;overflow:hidden;height:34px;align-items:center;} .kfi-sel .ant-select-selection-item{ height:24px !important;line-height:22px !important; } .kfi-sel .ant-select-selection-overflow{flex-wrap:nowrap;overflow:hidden;height:34px;align-items:center;} .kfi-sel .ant-select-selection-item-remove{color:#64748b !important;margin-left:3px !important;} .kfi-sel .ant-select-arrow{color:#94a3b8 !important;} .kfi-sel .ant-select-selection-placeholder{line-height:34px !important; } .ant-table-thead>tr>th{background:#1e3a5f !important;color:#fff !important;font-weight:600;font-size:12px;} /* tile card */ .kpi-tile{ background:#fff;border-radius:12px; border:1px solid #e2e8f0; box-shadow:0 1px 4px rgba(0,0,0,0.06); padding:18px 18px 14px 18px; box-sizing:border-box;display:flex;flex-direction:column;max-width:460px;overflow:hidden; }`}</style>

```
    {/*
      CARD 1 – dark navy: Year pill | Metric pills | Period pills
      Exact Figma layout
    */}
    <div style={{
      background:"#fff",borderRadius:12,
      padding:"14px 24px",marginBottom:12,
      boxShadow:"0 2px 8px rgba(0,0,0,0.18)",
      display:"flex",alignItems:"center",
      justifyContent:"space-between",
      gap:0,flexWrap:"nowrap",
    }}>
      {/* YEAR: Fiscal / Calendar */}
      {(viewBy==="month"||viewBy==="quarterly")&&(
        <div style={{display:"flex",alignItems:"center",gap:12,paddingRight:28}}>
          <span style={{fontSize:14,fontWeight:700,color:"#050f1eff",whiteSpace:"nowrap"}}>Year:</span>
          <PillGroup>
            {yearTypeOpts.map(yt=>{
              // shorten long labels: "Calendar Year"→"Calendar", "Fiscal Year"→"Fiscal"
              const short=yt.replace(" Year","").replace(" year","");
              return <PillBtn key={yt} label={short} active={filters.year_type===yt}
                onClick={()=>setFilters(p=>({...p,year_type:yt}))}/>;
            })}
          </PillGroup>
        </div>
      )}

      {(viewBy==="month"||viewBy==="quarterly")&&(
        <div style={{width:1,height:32,background:"#334155",flexShrink:0,marginRight:28}}/>
      )}

      {/* METRIC: Contractual | Bonus & Penalty | Bonus Qualifier */}
      <div style={{display:"flex",alignItems:"center",gap:12,paddingRight:28}}>
        <span style={{fontSize:14,fontWeight:600,color:"#050f1eff",whiteSpace:"nowrap"}}>Metric:</span>
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
        <span style={{fontSize:14,fontWeight:600,color:"#050f1eff",whiteSpace:"nowrap"}}>Period:</span>
        <PillGroup>
          <PillBtn label="Day"       active={viewBy==="day"}       onClick={()=>setViewBy("day")}/>
          <PillBtn label="Week"      active={viewBy==="week"}      onClick={()=>setViewBy("week")}/>
          <PillBtn label="Month"     active={viewBy==="month"}     onClick={()=>setViewBy("month")}/>
          <PillBtn label="Quarterly" active={viewBy==="quarterly"} onClick={()=>setViewBy("quarterly")}/>
        </PillGroup>
      </div>
    </div>

    {/*
      CARD 2 – dark navy: Year + Month dropdowns + GEO/JC/LOB/SUPERVISOR/TENURE
    */}
    <div className="kfi-sel" style={{
      background:"#1e293b",borderRadius:12,
      padding:"14px 24px",marginBottom:20,
      boxShadow:"0 2px 8px rgba(0,0,0,0.18)",
    }}>
      <div style={{display:"flex",gap:16,flexWrap:"nowrap",alignItems:"flex-end"}}>

        {/* Year number dropdown */}
        {viewBy!=="week"&&(
          <div style={{display:"flex",flexDirection:"column",gap:5,minWidth:88}}>
            <span style={{fontSize:12,fontWeight:600,color:"#fff",letterSpacing:"1px",textTransform:"uppercase"}}>Year</span>
            <Select value={filters.year} style={{width:"100%"}}
              popupMatchSelectWidth={false} styles={{popup:{minWidth:88}}}
              onChange={v=>setFilters(p=>({...p,year:v}))}>
              {(filterOptions.year||[]).map(v=><Option key={v} value={v}>{v}</Option>)}
            </Select>
          </div>
        )}

        {/* Month dropdown – day only */}
        {viewBy==="day"&&(
          <div style={{display:"flex",flexDirection:"column",gap:5,minWidth:110}}>
            <span style={{fontSize:12,fontWeight:600,color:"#fff",letterSpacing:"1px",textTransform:"uppercase"}}>Month</span>
            <Select value={filters.month} style={{width:"100%"}}
              popupMatchSelectWidth={false} styles={{popup:{minWidth:130}}}
              onChange={v=>setFilters(p=>({...p,month:v}))}>
              {(filterOptions.month||[]).map(v=><Option key={v} value={v}>{v}</Option>)}
            </Select>
          </div>
        )}

        {/* GEO JC LOB SUPERVISOR TENURE */}
        {[
          {lbl:"GEO",       key:"geo",         opts:filterOptions.geo||[]},
          {lbl:"JC",        key:"program",      opts:filterOptions.program||[]},
          {lbl:"LOB",       key:"lob",          opts:filterOptions.lob||[]},
          {lbl:"SUPERVISOR",key:"supervisor",   opts:filterOptions.supervisor||[]},
          {lbl:"TENURE",    key:"tenure_unit",  opts:filterOptions.tenure_unit||[]},
        ].map(({lbl,key,opts})=>(
          <div key={key} style={{flex:1,minWidth:0,display:"flex",flexDirection:"column",gap:5}}>
            <span style={{fontSize:12,fontWeight:600,color:"#fff",letterSpacing:"1px",textTransform:"uppercase"}}>{lbl}</span>
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

    {/* ── TILE GRID – 2 rows × 3 cols, Show More / Show Less ─────────── */}
    {filteredTiles.length>0&&(
      <div style={{marginBottom:24}}>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,minmax(0,1fr))",gap:16,marginBottom:14}}>
          {visible.map(t=>renderTile(t))}
          {/* pad last row */}
          {visible.length%3!==0&&Array.from({length:3-visible.length%3}).map((_,i)=><div key={`p${i}`}/>)}
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
              onMouseLeave={e=>e.currentTarget.style.background="#fff"}
            >{showAll?"↑ Show Less":"Show More ↓"}</button>
          </div>
        )}
      </div>
    )}

    {/* ── TABLE ─────────────────────────────────────────────────────── */}
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

  {/* ── EXPANDED TILE MODAL ─────────────────────────────────────────── */}
  <ExpandedTileModal/>
</>
```

);
}
