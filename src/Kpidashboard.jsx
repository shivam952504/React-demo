
import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { apiClient } from "../auth/apiClient";
import { getIdToken } from "../auth/authStorage";
import { Select, Table, Spin,Button } from "antd";
import LoaderOverlay from "../loader/LoaderOverlay";
import KPITileModal from "./KPITileModal";
const { Option } = Select;
import { InfoCircleOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import concoraLogo from "../assets/concoraLogo.PNG";
import ChatbotWidget from '../KPIChatBot/ChatbotWidget'
import {API_BASE_URL} from "../config/api";
import { clients } from "../data/mockData";
import { useParams, useNavigate, Link } from "react-router-dom";

// const API_BASE = "https://eu2azecep03.azurewebsites.net/api";
const MONTH_NAMES = [
"January","February","March","April","May","June",
"July","August","September","October","November","December",
];
const CURRENT_YEAR = new Date().getFullYear();
const DATE_RANGE_MIN = "2025-07-01";
const COLOR_MAP = {
green:"#22c55e", red:"#ef4444", orange:"#f97316",
blue:"#3b82f6",  yellow:"#eab308", purple:"#a855f7",
white:"#94a3b8", gray:"#94a3b8",  grey:"#94a3b8",
};
const resolveColor = c => { if(!c) return "#22c55e"; const l=String(c).toLowerCase().trim(); return COLOR_MAP[l]||c; };
const colorToTint  = (c,a=0.13) => {
const h=resolveColor(c).replace("#","");
if(h.length!==6) return `rgba(34,197,94,${a})`;
return `rgba(${parseInt(h.slice(0,2),16)},${parseInt(h.slice(2,4),16)},${parseInt(h.slice(4,6),16)},${a})`;
};



function xLabel(d,viewBy){
  const k=String(d).trim();
  if(viewBy==="week"){const m=k.match(/^W(?:eek)?(\d{1,2})(?:\s|$|\()/i);return m?`W${parseInt(m[1])}`:k.split(" ")[0];}
  if(viewBy==="month"){
  const iso=k.match(/^\d{4}-(\d{2})$/);if(iso)return MONTH_NAMES[parseInt(iso[1])-1]?.substring(0,3)??k;
  const my=k.match(/^([a-zA-Z]+)/);return my?my[1].substring(0,3):k.substring(0,3);
  }
  if(viewBy==="quarterly"){
    const wordQ = k.match(/^Quarter\s*(\d)/i);
    if(wordQ) return `Q${wordQ[1]}`;

    const qWithYear = k.match(/Q(\d)[^0-9]*(\d{4})/i);
    if(qWithYear) return `Q${qWithYear[1]}(${qWithYear[2]})`;

    const apiFormat = k.match(/^Quarter-(\d{4})-(\d)$/i);
    if(apiFormat) return `Q${apiFormat[2]}(${apiFormat[1]})`;

    const iso = k.match(/^(\d{4})-(\d{2})$/);
    if(iso){
      const mo = parseInt(iso[2]);
      return `Q${Math.ceil(mo/3)}(${iso[1]})`;
    }

    const qm = k.match(/Q(\d)/i);
    if(qm) return `Q${qm[1]}`;

    const nm = parseInt(k);
    if(!isNaN(nm) && nm >= 1 && nm <= 4) return `Q${nm}`;

    return k.substring(0, 2);
  }

  const dt=new Date(k);if(!isNaN(dt.getTime()))return String(dt.getDate());
  return k.split("-").pop()||"";
}

function extractField(raw,field){
if(raw===null||raw===undefined)return null;
if(typeof raw==="object"&&!Array.isArray(raw))return raw[field]!==undefined?raw[field]:null;
if(field==="Overall"||field==="overall")return raw;
return null;
}
function getOverall(raw){
const v=extractField(raw,"Overall")??extractField(raw,"overall")??extractField(raw,"overall_percentage")??(typeof raw!=="object"?raw:null);
if(v===null||v===undefined)return null;if(typeof v==="boolean")return null;
const s=String(v).trim();if(s===""||s==="-"||s==="-"||s.toLowerCase()==="nan")return null;
const n=parseFloat(s.replace("%",""));return isNaN(n)?s:n;
}
function getCellDisplay(raw){const v=getOverall(raw);return v!==null?v:"-";}
function getCellColor(raw){return extractField(raw,"color")||null;}
function getTarget(raw){const t=extractField(raw,"target");if(t===null||t===undefined)return "-";const s=String(t).trim();return(s===""||s==="-"||s==="-")?"-":s;}
function getColor(raw){return resolveColor(extractField(raw,"color"));}
function getBoolFlag(raw,flag){if(!raw||typeof raw!=="object")return false;return raw[flag]===true;}
function isNested(raw){return raw!==null&&typeof raw==="object"&&!Array.isArray(raw)&&("Overall" in raw||"overall" in raw||"overall_percentage" in raw);}

/* ── parse response ─────────────────────────────────────────── */
function parseDateEntries(response){
const nonTile=Object.keys(response).filter(k=>k!=="tile");
const first=response[nonTile[0]];let dates=[],dataMap={};
const ok=v=>v&&typeof v==="object"&&!Array.isArray(v)&&Object.values(v).some(x=>typeof x==="string"||typeof x==="number"||typeof x==="boolean"||(typeof x==="object"&&x!==null&&"Overall" in x));
if(ok(first)){dates=nonTile;nonTile.forEach(d=>{dataMap[d]=response[d];});}
else{Object.values(response).forEach(g=>{if(g&&typeof g==="object"&&!Array.isArray(g))Object.keys(g).forEach(d=>{if(d!=="tile"){dates.push(d);dataMap[d]=g[d];}});});}
return{dates:[...new Set(dates)],dataMap}; // preserve backend order, no sorting
}
function discoverKeys(dates,dataMap){const seen=new Set(),o=[];dates.forEach(d=>{const e=dataMap[d];if(!e)return;Object.keys(e).forEach(k=>{if(!seen.has(k)){seen.add(k);o.push(k);}});});return o;}
function keyExists(k,dates,dataMap){return dates.some(d=>k in(dataMap[d]||{}));}
function hasReal(k,dates,dataMap){return dates.some(d=>getOverall(dataMap[d]?.[k])!==null);}
function passesToggle(k,dates,dataMap,cOn,bOn,bqOn){
if(!cOn&&!bOn&&!bqOn)return true;
if(!dates.some(d=>isNested(dataMap[d]?.[k])))return true;
if(cOn&&!dates.some(d=>getBoolFlag(dataMap[d]?.[k],"Contractual")))return false;
if(bOn&&!dates.some(d=>getBoolFlag(dataMap[d]?.[k],"Bonus and Penalty")))return false;
if(bqOn&&!dates.some(d=>getBoolFlag(dataMap[d]?.[k],"Bonus Qualifier")))return false;
return true;
}

function PillBtn({label,active,onClick}){
return(
<div onClick={onClick} style={{
padding:"6px 16px",cursor:"pointer",fontSize:14,fontWeight:600,
background:active?"#3b82f6":"transparent",
color:active?"#fff":"#fff",
borderRadius:6,transition:"all 0.15s",whiteSpace:"nowrap",userSelect:"none",
}}>{label}</div>
);
}
function PillGroup({children}){
  return <div style={{display:"flex",background:"#1e293b",borderRadius:8,padding:3,gap:2}}>{children}</div>;
}

function loadScript(src) {
  return new Promise((resolve, reject) => {
  if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
  const s = document.createElement("script");
  s.src = src; s.onload = resolve; s.onerror = reject;
  document.head.appendChild(s);
  });
}

export default function KPIDashboard(){
const [loading,       setLoading]       = useState(false);
const [tableLoading,  setTableLoading]  = useState(false);
const [viewBy,        setViewBy]        = useState("day");
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
const [isFlReady,     setIsFlReady]     = useState(false);
const [error,         setError]         = useState(null);
const [modalTile, setModalTile] = useState(null);
const [showDownloadMenu, setShowDownloadMenu] = useState(false);
const [lastUpdatedMap, setLastUpdatedMap] = useState({});
const [isRecoveryMode, setIsRecoveryMode] = useState(false);
const [recoveryFilterOptions, setRecoveryFilterOptions] = useState(null);
const [otherLob, setOtherLob] = useState("Combined");

 const today = new Date();
  const currentMonthStart = new Date(today.getFullYear(), today.getMonth(), 1)
    .toISOString().split("T")[0];
  const todayStr = today.toISOString().split("T")[0];
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [isDateRangeActive, setIsDateRangeActive] = useState(false);
  const [userName, setUserName] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);

  const { clientId } = useParams();
  const client = clients.find((c) => c.id === clientId);
   const navigate = useNavigate();

const [filters,setFilters]=useState({
year_type:"Calendar Year",year:CURRENT_YEAR,month:"January",
geo:["ALL"],program:["ALL"],lob:"",supervisor:["ALL"],tenure_unit:["ALL"],
});
const [pendingFilters, setPendingFilters] = useState(null);
const [debFilters,setDebFilters]=useState(null);
const debRef=React.useRef(null);
const activeVb=React.useRef(viewBy);
const isFetching=React.useRef(false); // blocks debFilters during runFetch chain
const lastUpdatedFetched = React.useRef(false);
const isFirstRender = React.useRef(true);
const lastUpdatedMapRef = React.useRef({});
const dataEp  =vb=>vb==="day"?"/get_concora_daily_data/":vb==="week"?"/get_concora_weekly_data/":vb==="quarterly"?"/get_concora_quarterly_data/":"/get_concora_monthly_data/";
const filterEp=vb=>vb==="day"?"/get_concora_daily_filters/":vb==="week"?"/get_concora_weekly_filters/":vb==="quarterly"?"/get_quarterly_filters/":"/get_monthly_filters/";
const mkP     =f=>({year_type:f.year_type,year:f.year,month:f.month,geo:f.geo,program:f.program,lob:f.lob,supervisor:f.supervisor,tenure_unit:f.tenure_unit});

const authPost = (url, body) => {
  const idToken = getIdToken();
  const fullUrl = idToken ? `${url}?id_token=${idToken}` : url;
  return apiClient(fullUrl, {
    method: "POST",
    body: JSON.stringify(body),
  }).then(r => r.json());
};

useEffect(() => {
  if (lastUpdatedFetched.current) return;
  lastUpdatedFetched.current = true;

  // fetch user name
  const idToken = getIdToken();
  if (idToken) {
    apiClient(`${API_BASE_URL}api/get_login_user_info/?id_token=${idToken}`, { method: "POST" })
      .then(r => r.json())
      .then(data => { if (data?.user_name) setUserName(data.user_name); })
      .catch(() => {});
  }

  authPost(`${API_BASE_URL}api/Concora/last_updated_date`, {})
    .then(r => {
      if (r) { setLastUpdatedMap(r); lastUpdatedMapRef.current = r; }
    })
    .then(() => {
      runFetch(viewBy, mkP(filters));
    })
    .catch(() => {});
}, []);

useEffect(()=>{
if(debRef.current)clearTimeout(debRef.current);
debRef.current=setTimeout(()=>setDebFilters({...filters,_t:Date.now()}),);
return()=>{if(debRef.current)clearTimeout(debRef.current);};
},[filters]);


const getMaxEndDate = (start) => {
  if (!start) return todayStr;
  const d = new Date(start);
  d.setMonth(d.getMonth() + 3);
  d.setDate(d.getDate() - 1);
  const oneMonthLater = d.toISOString().split("T")[0];
  return oneMonthLater >todayStr ? todayStr : oneMonthLater;
};

function findLastUpdated(lastUpdatedMap, tileKey) {
  const map = (lastUpdatedMap && Object.keys(lastUpdatedMap).length > 0)
    ? lastUpdatedMap
    : lastUpdatedMapRef.current;

  if (!tileKey || !map) return null;

  if (map[tileKey]?.lastUpdated) return map[tileKey].lastUpdated;

  const lower = tileKey.toLowerCase();
  const found = Object.keys(map).find(
    k => k.toLowerCase() === lower ||
         k.toLowerCase().includes(lower) ||
         lower.includes(k.toLowerCase())
  );
  return found ? map[found]?.lastUpdated : null;
}

const runDateRangeFetch = (start, end) => {
  setIsDateRangeActive(true);  
  setLoading(true); setTableLoading(true); setError(null);
  setAllRows([]); setAllTiles([]); setColumns([]);
  const p = {
    start_date: start,
    end_date: end,
    geo: filters.geo,
    program: filters.program,
    lob: filters.lob,
    supervisor: filters.supervisor,
    tenure_unit: filters.tenure_unit,
  };
  authPost(`${API_BASE_URL}api/get_concora_date_range_data/`, p)
    .then(r => {
      if (!r || !Object.keys(r).length)
        return setError("No data available.");
      buildTable(r, "day");
    })
    .catch(() => setError("Failed to load. Please try again."))
    .finally(() => { setLoading(false); setTableLoading(false); });
};

const runFetch=(vb,payload)=>{
  setIsDateRangeActive(false);
  setLoading(true);setTableLoading(true);setError(null);
  setAllRows([]);setAllTiles([]);setColumns([]);
  isFetching.current = true; // block debFilters from firing during this chain
  return authPost(`${API_BASE_URL}api${filterEp(vb)}`,payload)
  .then(r=>{
    if(activeVb.current!==vb)return;
    const lobList = r?.lob || [];
    const firstLob = lobList.length > 0 ? lobList[0] : payload.lob;
    const dataPayload = {...payload, lob: firstLob};
    setFilterOptions(r||{});
    setIsFlReady(true);
    // silently sync LOB into filters without triggering debFilters cascade
    setFilters(prev => ({...prev, lob: firstLob}));
    return authPost(`${API_BASE_URL}api${dataEp(vb)}`,dataPayload);
  })
  .then(r=>{if(!r||activeVb.current!==vb)return;
    if(!r||!Object.keys(r).length){setError("No data available.");return;}buildTable(r,vb);})
  .catch(()=>{if(activeVb.current!==vb)return;setError("Failed to load. Please try again.");})
  .finally(()=>{
    if(activeVb.current===vb){setLoading(false);setTableLoading(false);}
    // release block AFTER a tick so debFilters settles first
    setTimeout(()=>{ isFetching.current = false; }, 100);
  });
};

const fetchRecoveryFilters = (currentFilters) => {
  const p = {
    year_type: currentFilters.year_type,
    year: currentFilters.year,
    month: currentFilters.month,
    geo: currentFilters.geo,
    program: currentFilters.program,
    lob: currentFilters.lob,
    supervisor: currentFilters.supervisor,
    tenure_unit: currentFilters.tenure_unit,
  };
  authPost(`${API_BASE_URL}api/get_other_recovery_metrics_filters/`, p)
    .then(r => {
      if (r) setRecoveryFilterOptions(r);
    })
    .catch(() => {});
};

const runRecoveryFetch = (currentFilters, currentOtherLob) => {
  setLoading(true); setTableLoading(true); setError(null);
  setAllRows([]); setAllTiles([]); setColumns([]);
  const p = {
    year: currentFilters.year,
    year_type: currentFilters.year_type,
    data_type: "monthly",
    month: currentFilters.month,
    geo: currentFilters.geo,
    program: currentFilters.program,
    other_lob: currentOtherLob || "Combined",
    supervisor: currentFilters.supervisor,
  };
  authPost(`${API_BASE_URL}api/get_other_recovery_metrics/`, p)
    .then(r => {
      if (!r || !Object.keys(r).length)
        return setError("No data available.");
      buildTable(r, "month");
    })
    .catch(() => setError("Failed to load. Please try again."))
    .finally(() => { setLoading(false); setTableLoading(false); });
};

useEffect(() => {
  if (isFirstRender.current) {
    isFirstRender.current = false;
    return;
  }
  if (viewBy === "daterange") return;
  const vb = viewBy;
  activeVb.current = vb;
  setIsFlReady(false);
  runFetch(vb, mkP(filters));
}, [viewBy]);

useEffect(()=>{
  if (isFirstRender.current) { isFirstRender.current = false; return; }
  if(!isFlReady||!debFilters)return;
  if(!debFilters.lob)return;  // wait until LOB is known
  if(isFetching.current)return; // runFetch is in progress, skip
  if (viewBy === "daterange") return;
// if (isRecoveryMode) return;
// const vb=viewBy;setTableLoading(true);setLoading(true);setError(null);
// const p=mkP(debFilters);
// axios.post(`${API_BASE_URL}api${filterEp(vb)}`,p)
// .then(r=>{if(activeVb.current!==vb)return;setFilterOptions(r.data||{});return axios.post(API_BASE_URL+'api'+dataEp(vb),p);})
// .then(r=>{if(!r||activeVb.current!==vb)return;if(!r.data||!Object.keys(r.data).length){setAllRows([]);setAllTiles([]);
//   setColumns([]);setError("No data.");return;}buildTable(r.data,vb);})
// .catch(()=>{if(activeVb.current!==vb)return;setAllRows([]);setAllTiles([]);setColumns([]);setError("Failed.");})
// .finally(()=>{if(activeVb.current===vb){setTableLoading(false); setLoading(false);}});
  if (isRecoveryMode) {
    fetchRecoveryFilters(debFilters);
    runRecoveryFetch(debFilters, otherLob);
    return;
  }
  const vb=viewBy;setTableLoading(true);setLoading(true);setError(null);
  const p=mkP(debFilters);
  authPost(`${API_BASE_URL}api${filterEp(vb)}`,p)
  .then(r=>{if(activeVb.current!==vb)return;setFilterOptions(r||{});return authPost(`${API_BASE_URL}api${dataEp(vb)}`,p);})
  .then(r=>{if(!r||activeVb.current!==vb)return;if(!r||!Object.keys(r).length){setAllRows([]);setAllTiles([]);
    setColumns([]);setError("No data.");return;}buildTable(r,vb);})
  .catch(()=>{if(activeVb.current!==vb)return;setAllRows([]);setAllTiles([]);setColumns([]);setError("Failed.");})
  .finally(()=>{if(activeVb.current===vb){setTableLoading(false); setLoading(false);}});
},[debFilters]);

const buildTable=(response,currentVb)=>{
  const tileObj=response.tile||{};
  const{dates,dataMap}=parseDateEntries(response);
  if(!dates.length){setColumns([]);setAllRows([]);setAllTiles([]);return;}
  setChartDates(dates);setChartDataMap(dataMap);
  const keys=discoverKeys(dates,dataMap);
  const active=keys.filter(k=>keyExists(k,dates,dataMap));
  const getT=k=>{for(const d of dates){const t=getTarget(dataMap[d]?.[k]);if(t!=="-")return t;}return "-";};


  setColumns([
    {title:"Metric",dataIndex:"metric",width:260,fixed:"left",render:t=><span style={{fontWeight:500,fontSize:13}}>{t}</span>},
    {title:"Target",dataIndex:"target",width:90,align:"center"},
    ...dates.map(date=>({
      title:date,dataIndex:date,align:"center",
      render:(val,rec)=>{
        const raw=dataMap[date]?.[rec.key];
        const cc=getCellColor(raw);
        const empty=val===null||val===undefined||val===""||val==="-";
        const resolvedCc = cc ? resolveColor(cc) : null;
        const isNeutral = !resolvedCc || resolvedCc === "#94a3b8";
        return <div style={{background:empty?"#f8fafc":isNeutral?"#f1f5f9":colorToTint(resolvedCc,0.18),padding:"4px 6px",borderRadius:4,
          textAlign:"center",fontSize:12,color:empty?"#94a3b8":"#1e293b"}}>{empty?"-":val}</div>;
      },
    })),
  ]);

  setAllRows(active.map(k=>{const row={key:k,metric:k,target:getT(k)};dates.forEach(d=>{row[d]=getCellDisplay(dataMap[d]?.[k]);});
  return row;}));

  const gDates=currentVb==="day"?dates:dates.slice(-12);
  setAllTiles(active.map(k=>{
    let val=getOverall(tileObj?.[k]);
    if(val===null){for(let i=dates.length-1;i>=0;i--){const v=getOverall(dataMap[dates[i]]?.[k]);if(v!==null){val=v;break;}}}
    let color=getColor(tileObj?.[k]);
if(!color||color==="#94a3b8"){for(const d of dates){const c=getColor(dataMap[d]?.[k]);if(c&&c!=="#94a3b8"){color=c;break;}}}
if(color==="#94a3b8") color="#3b82f6";
    let target=getTarget(tileObj?.[k]);if(target==="-")target=getT(k);
    const series=gDates.map(d=>{const raw=dataMap[d]?.[k];const v=getOverall(raw);
      return{v:v!==null&&!isNaN(Number(v))?Number(v):null,c:getColor(raw)||color};});
    const sr=tileObj?.[k]??dataMap[dates[dates.length-1]]?.[k];
    const unit=String(extractField(sr,"Overall")??sr??"").includes("%")?"%":"";
    const contractual=dates.some(d=>getBoolFlag(dataMap[d]?.[k],"Contractual"));
    const bonus=dates.some(d=>getBoolFlag(dataMap[d]?.[k],"Bonus and Penalty"));
    const bonusQ=dates.some(d=>getBoolFlag(dataMap[d]?.[k],"Bonus Qualifier"));
    const flat=!dates.some(d=>isNested(dataMap[d]?.[k]));
    const cms=extractField(tileObj?.[k],"Current Trend")??extractField(tileObj?.[k],"current_month_status")??null;
    const trend=extractField(tileObj?.[k],"Bonus and Target Trend")??extractField(tileObj?.[k],"bonus_trend")??null;
    return{key:k,label:k,color,unit,value:val,target,series,dates:gDates,viewBy:currentVb,contractual,bonus,bonusQ,flat,cms,trend,
       lastUpdated : findLastUpdated(Object.keys(lastUpdatedMap).length > 0 ? lastUpdatedMap : lastUpdatedMapRef.current, k)};
  }));
  setShowAll(false);


};


const upMulti = (key, val) => {
  let n = val;
  if (val.length > 1 && val[val.length - 1] !== "ALL") n = val.filter(v => v !== "ALL");
  else if (val.includes("ALL") && val[val.length - 1] === "ALL") n = ["ALL"];
  if (!n.length) n = ["ALL"];
  setPendingFilters(p => ({ ...(p || filters), [key]: n }));
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

  const visible=showAll?filteredTiles:filteredTiles.slice(0,3);
  const hasMore=filteredTiles.length>3;

  const yearTypeOpts=filterOptions.year_type?.length>0
  ?filterOptions.year_type
  :["Calendar Year","Fiscal Year"];

  const MULTISELECT_KEYS = ["geo", "program", "supervisor", "tenure_unit"];

const hasNonAllPending = pendingFilters !== null && MULTISELECT_KEYS.some(key => {
  const pending  = (pendingFilters[key] || []).slice().sort().join(",");
  const applied  = (filters[key]        || []).slice().sort().join(",");
  return pending !== applied;
});

  const buildFileName = (ext) => {
  const parts = [`KPI_Dashboard`, String(filters.year)];

  parts.push(viewBy.charAt(0).toUpperCase() + viewBy.slice(1));

  if (filters.month && (viewBy === "day" || viewBy === "week")) {
    parts.push(filters.month.slice(0, 3)); // "Jan", "Feb" etc.
  }

  if (viewBy === "month" || viewBy === "quarterly") {
    parts.push(filters.year_type === "Fiscal Year" ? "Fiscal" : "Calendar");
  }

  if (cOn && !bOn && !bqOn)  parts.push("Contractual");
  if (!cOn && bOn && !bqOn)  parts.push("Bonus_Penalty");
  if (!cOn && !bOn && bqOn)  parts.push("Bonus_Qualifier");
  if (cOn && bOn)            parts.push("Contractual_Bonus");
  if (bqOn && (cOn || bOn))  parts.push("BQ");

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
      const first = String(val[0]).replace(/\s+/g, "_").slice(0, 12);
      parts.push(`${label}_${first}${val.length > 1 ? `+${val.length - 1}` : ""}`);
    }
  });

  return parts.join("_") + `.${ext}`;
};

  const handleDownloadExcel = async () => {
    setShowDownloadMenu(false);

    if (!columns.length || !tableData.length) return;

    if (!window.XLSX) {
      await loadScript("https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js");
    }
    const XLSXLib = window.XLSX;

    const dateCols = columns.filter(c => c.dataIndex !== "metric" && c.dataIndex !== "target");
    const header   = ["Metric", "Target", ...dateCols.map(c => c.title)];

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
      [],
    ];

    const infoSheet = XLSXLib.utils.aoa_to_sheet([
      ...infoRows,
      header,
      ...dataRows,
    ]);
    infoSheet["!cols"] = ws["!cols"];

    const wb = XLSXLib.utils.book_new();
    const sheetLabel = `KPI_${filters.year}`.slice(0, 31);
    XLSXLib.utils.book_append_sheet(wb, infoSheet, sheetLabel);

    XLSXLib.writeFile(wb, buildFileName("xlsx"));
  };


  const handleDownloadPDF = async () => {
    setShowDownloadMenu(false);

    if (!columns.length || !tableData.length) return;

    await loadScript("https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js");
    await loadScript("https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js");

    const { jsPDF } = window.jspdf;
    const doc  = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const margin = 20;

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

    const LOWER_IS_BETTER = ["aht","average handle time","formal substantiated","complaints","shrinkage","attrition","absenteeism","acw"];

    const drawFooter = () => {
      const total = doc.internal.getNumberOfPages();
      const cur   = doc.internal.getCurrentPageInfo().pageNumber;
      doc.setFontSize(6.5); doc.setFont("helvetica","normal"); doc.setTextColor(148,163,184);
      doc.text(`Page ${cur} of ${total}`, pageW/2, pageH-7, { align:"center" });
    };

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

return(
<>
{loading&&<LoaderOverlay show={loading}/>}
{/* page wrapper — WHITE background like Figma */}
<div style={{padding:"16px",opacity:loading?0.5:1,background:"#fff",minHeight:"100vh"}}>
<style>{`/* selects inside dark cards */ .kfi-sel .ant-select-selector{ background:#fff !important;border-color:#334155 !important; height:36px !important;min-height:36px !important; padding:0 10px !important;border-radius:6px !important; font-size:13px !important; } .kfi-sel .ant-select:not(.ant-select-multiple) .ant-select-selection-item, .kfi-sel .ant-select:not(.ant-select-multiple) .ant-select-selection-placeholder{ line-height:34px !important;font-size:13px !important;color:#1e293b !important; } .kfi-sel .ant-select-selection-overflow{flex-wrap:nowrap;overflow:hidden;height:34px;align-items:center;} .kfi-sel .ant-select-selection-item{ height:24px !important;line-height:22px !important;font-size:12px !important; background:#e2e8f0 !important;border-color:#cbd5e1 !important; color:#1e293b !important;border-radius:4px !important; padding:0 6px !important;display:flex !important;align-items:center !important; } .kfi-sel .ant-select-selection-item-remove{color:#64748b !important;margin-left:3px !important;} .kfi-sel .ant-select-arrow{color:#94a3b8 !important;} .kfi-sel .ant-select-selection-placeholder{line-height:34px !important;font-size:13px !important;color:#94a3b8 !important;} /* table header */ .ant-table-thead>tr>th{background:#1e3a5f !important;color:#fff !important;font-weight:600;font-size:12px;} /* tile card */ .kpi-tile{ background:#fff;border-radius:12px; border:1px solid #e2e8f0; box-shadow:0 1px 4px rgba(0,0,0,0.06); padding:18px 18px 14px 18px; box-sizing:border-box; display:flex;flex-direction:column;max-width:460px;overflow:hidden; }`}</style>
    {userName && (
      <div style={{display:"flex",alignItems:"center",gap:4,fontSize:13,whiteSpace:"nowrap",marginLeft:"auto", position: "absolute", right: 32, top: 2}}>
        <span style={{color:"#94a3b8",fontWeight:400}}>Welcome,</span>
        <span style={{fontWeight:700,color:"#1e293b"}}>{userName}</span>
      </div>
    )}
    <div style={{display:"flex", gap:"12px", alignItems:"center", marginBottom:8, marginTop:6}}>
      {/* Logo + BETA stacked */}
      <div style={{display:"flex", flexDirection:"column", alignItems:"center", flexShrink:0, paddingBottom:14}}>
        <img src={concoraLogo} alt="Concora Logo" className="client-logo" style={{height:"40px", width:"108px"}}/>
        <span style={{
          fontSize:9, fontWeight:700, letterSpacing:"1px",
          color:"#faad14", background:"rgba(250,173,20,0.12)",
          padding:"1px 6px", borderRadius:4, whiteSpace:"nowrap", marginTop:4,
        }}>BETA</span>
      </div>
      <div style={{
        background:"#fff",borderRadius:12,
        padding:"14px 24px",marginBottom:12,
        boxShadow:"0 2px 8px rgba(0,0,0,0.18)",
        display:"flex",alignItems:"center",
        justifyContent: "space-between",
        gap:0,flexWrap:"nowrap",width:"100%"
      }}>
        {/* YEAR: Fiscal / Calendar */}
      {(viewBy==="month" || viewBy==="quarterly") && (
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

      {(viewBy==="month" || viewBy==="quarterly") && (
        <div style={{width:1,height:32,background:"#334155",flexShrink:0,marginRight:28}}/> )} 

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
        {/* <div style={{display:"flex",alignItems:"center",gap:12}}>
          <span style={{fontSize:14,fontWeight:600,color:"#050f1eff",whiteSpace:"nowrap"}}>Period:</span>
          <PillGroup>
            <PillBtn label="Day"   active={viewBy==="day"}   onClick={()=>setViewBy("day")}/>
            <PillBtn label="Week"  active={viewBy==="week"}  onClick={()=>setViewBy("week")}/>
            <PillBtn label="Month" active={viewBy==="month"} onClick={()=>setViewBy("month")}/>
            <PillBtn label="Quarterly" active={viewBy==="quarterly"} onClick={()=>setViewBy("quarterly")}/>
          </PillGroup>
        </div> */}
       {!isRecoveryMode &&  <div style={{display:"flex",alignItems:"center",gap:12,position:"relative"}}>
          <span style={{fontSize:14,fontWeight:600,color:"#050f1eff",whiteSpace:"nowrap"}}>Period:</span>
          <PillGroup>
            <PillBtn label="Day"        active={viewBy==="day"}        onClick={()=>{setViewBy("day");setShowDatePicker(false);}}/>
            <PillBtn label="Week"       active={viewBy==="week"}       onClick={()=>{setViewBy("week");setShowDatePicker(false);}}/>
            <PillBtn label="Month"      active={viewBy==="month"}      onClick={()=>{setViewBy("month");setShowDatePicker(false);}}/>
            <PillBtn label="Quarterly"  active={viewBy==="quarterly"}  onClick={()=>{setViewBy("quarterly");setShowDatePicker(false);}}/>
            <PillBtn label="Date Range" active={viewBy==="daterange"}  onClick={()=>{setViewBy("daterange");setShowDatePicker(true);}}/>
          </PillGroup>

          {/* Date Range Picker Popup */}
          {viewBy==="daterange" && showDatePicker && (
            <div style={{
              position:"absolute", top:"calc(100% + 8px)", left:0,
              background:"#fff", borderRadius:10, padding:"14px 18px",
              boxShadow:"0 4px 20px rgba(0,0,0,0.15)", zIndex:999,
              display:"flex", flexDirection:"column", gap:10, minWidth:280,
            }}>
              <div style={{fontSize:12,fontWeight:700,color:"#334155",letterSpacing:"0.5px"}}>
                SELECT DATE RANGE
              </div>
              <div style={{display:"flex",gap:10,alignItems:"center"}}>
                <div style={{display:"flex",flexDirection:"column",gap:4,flex:1}}>
                  <label style={{fontSize:11,color:"#64748b",fontWeight:600}}>Start Date</label>
                  <input
                    type="date"
                    value={dateRange.start}
                    min={DATE_RANGE_MIN}
                    max={new Date().toISOString().split("T")[0]}
                    placeholder={currentMonthStart}
                    onChange={e => {
                      const newStart = e.target.value;
                      setDateRange({ start: newStart, end: "" }); 
                    }}
                    style={{
                      border:"1px solid #e2e8f0", borderRadius:6, padding:"6px 8px",
                      fontSize:13, color:"#1e293b", outline:"none", width:"100%",
                    }}
                  />
                </div>
                <div style={{display:"flex",flexDirection:"column",gap:4,flex:1}}>
                  <label style={{fontSize:11,color:"#64748b",fontWeight:600}}>End Date</label>
                 <input
                  type="date"
                  value={dateRange.end}
                  min={dateRange.start || DATE_RANGE_MIN}
                  max={getMaxEndDate(dateRange.start)}
                  onChange={e => setDateRange(p => ({...p, end: e.target.value}))}
                  disabled={!dateRange.start} 
                  style={{
                    border:"1px solid #e2e8f0", borderRadius:6, padding:"6px 8px",
                    fontSize:13, color:"#1e293b", outline:"none", width:"100%",
                    opacity: !dateRange.start ? 0.4 : 1,
                    cursor: !dateRange.start ? "not-allowed" : "auto",
                  }}
                />
                </div>
              </div>
              <div style={{display:"flex",gap:8,justifyContent:"flex-end",marginTop:2}}>
                <button
                  onClick={()=>{setShowDatePicker(false);setViewBy("day");}}
                  style={{
                    padding:"6px 14px",borderRadius:6,border:"1px solid #e2e8f0",
                    background:"#f8fafc",fontSize:13,cursor:"pointer",color:"#64748b",
                  }}
                >Cancel</button>
                <button
                onClick={() => {
                  setDateRange({ start: "", end: "" });
                }}
                style={{
                  padding:"6px 14px", borderRadius:6, border:"1px solid #e2e8f0",
                  background:"#f8fafc", fontSize:13, cursor:"pointer", color:"#64748b",
                }}
              >Clear</button>
                <button
                  disabled={!dateRange.start||!dateRange.end}
                  onClick={()=>{
                    setShowDatePicker(false);
                    runDateRangeFetch(dateRange.start, dateRange.end);
                  }}
                  style={{
                    padding:"6px 14px",borderRadius:6,border:"none",
                    background:(!dateRange.start||!dateRange.end)?"#94a3b8":"#3b82f6",
                    color:"#fff",fontSize:13,fontWeight:600,
                    cursor:(!dateRange.start||!dateRange.end)?"not-allowed":"pointer",
                    transition:"background 0.15s",
                  }}
                >Apply</button>
              </div>
            </div>
          )}
        </div> }
      </div>
    </div>
    <div className="kfi-sel" style={{
      background:"#1e293b",borderRadius:12,
      padding:"6px 16px",marginBottom:20,
      boxShadow:"0 2px 8px rgba(0,0,0,0.18)",
    }}>
      <div style={{display:"flex",gap:10,flexWrap:"nowrap",alignItems:"center"}}>
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

        {/* Month dropdown — day only */}
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
        <div style={{ flex:1, minWidth:0, display:"flex", flexDirection:"column", gap:5 }}>
          <span style={{ fontSize:12, fontWeight:600, color:"#fff", letterSpacing:"1px", textTransform:"uppercase" }}>LOB</span>
          <Select
            value={filters.lob}
            style={{ width:"100%" }}
            popupMatchSelectWidth={false}
            styles={{ popup: { minWidth: 180 } }}
            onChange={v => {
              const isRecovery = v === "Additional Recovery Metrics";
              setFilters(p => ({ ...p, lob: v }));
              if (isRecovery) {
                setCOn(false);
                setIsRecoveryMode(true);
                setOtherLob("Combined");
                fetchRecoveryFilters({ ...filters, lob: v });
                runRecoveryFetch({ ...filters, lob: v }, "Combined");
              } else {
                setIsRecoveryMode(false);
                const noContractual = ["Recovery Solutions Inbound", "Recovery Solutions Outbound"];
                setCOn(!noContractual.includes(v));   // ← false for those two LOBs, true for everything else
                setRecoveryFilterOptions(null);
                setOtherLob("Combined");
              }
            }}
          >
            {(filterOptions.lob||[]).map(v => <Option key={v} value={v}>{v}</Option>)}
          </Select>
        </div>
        {[
          {lbl:"GEO",       key:"geo",         opts:filterOptions.geo||[]},
          {lbl:"JC",        key:"program",     opts:filterOptions.program||[]},
          {lbl:"SUPERVISOR",key:"supervisor",  opts:filterOptions.supervisor||[]},
          // TENURE — hide if not in recovery filter response when in recovery mode
          ...(!isRecoveryMode || recoveryFilterOptions?.tenure_unit
            ? [{lbl:"TENURE", key:"tenure_unit", opts:
                isRecoveryMode
                  ? (recoveryFilterOptions?.tenure_unit||[])
                  : (filterOptions.tenure_unit||[])}]
            : []
          ),
        ].map(({lbl,key,opts})=>(
          // only show if opts has values
          opts.length === 0 ? null :
          <div key={key} style={{flex:1,minWidth:0,display:"flex",flexDirection:"column",gap:5}}>
            <span style={{fontSize:12,fontWeight:600,color:"#fff",letterSpacing:"1px",textTransform:"uppercase"}}>{lbl}</span>
            <Select
              mode="multiple"
              value={(pendingFilters||filters)[key]}
              style={{width:"100%"}}
              popupMatchSelectWidth={false}
              styles={{popup:{minWidth:180}}}
              maxTagCount="responsive"
              onChange={v=>upMulti(key,v)}
            >
              {opts.map(v=><Option key={v} value={v}>{v}</Option>)}
            </Select>
          </div>
        ))}

        {/* OTHER_LOB — only when Additional Recovery Metrics */}
        {isRecoveryMode && recoveryFilterOptions?.other_lobs && (
          <div style={{flex:1,minWidth:0,display:"flex",flexDirection:"column",gap:5}}>
            <span style={{fontSize:12,fontWeight:600,color:"#fff",letterSpacing:"1px",textTransform:"uppercase"}}>
              LOB Type
            </span>
            <Select
              value={otherLob}
              style={{width:"100%"}}
              popupMatchSelectWidth={false}
              styles={{popup:{minWidth:180}}}
              onChange={v => {
                setOtherLob(v);
                runRecoveryFetch(filters, v);
              }}
            >
              {recoveryFilterOptions.other_lobs.map(v =>
                <Option key={v} value={v}>{v}</Option>
              )}
            </Select>
          </div>
        )}
        {hasNonAllPending && (
          <div style={{ display: "flex", alignItems: "flex-end", paddingTop: 10 }}>
            <button
              onClick={() => {
                setFilters(pendingFilters);
                setPendingFilters(null);
              }}
              style={{
                background: "#3b82f6",
                color: "#fff",
                border: "none",
                borderRadius: 8,
                padding: "6px 20px",
                fontWeight: 700,
                fontSize: 13,
                cursor: "pointer",
                whiteSpace: "nowrap",
                height: 36,
                transition: "background 0.15s",
              }}
              onMouseEnter={e => e.currentTarget.style.background = "#2563eb"}
              onMouseLeave={e => e.currentTarget.style.background = "#3b82f6"}
            >
              Apply
            </button>
            </div>
        )}
                {/* ── CHANGE 2: Download button ── */}
        <div className="no-print" style={{ display: "flex", alignItems: "flex-end", paddingTop: 10, position: "relative" }}>
          <button
            onClick={() => setShowDownloadMenu(v => !v)}
            style={{
              background: "rgb(15 171 35)",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              padding: "6px 16px",
              fontWeight: 700,
              fontSize: 13,
              cursor: "pointer",
              height: 36,
              transition: "background 0.15s",
              whiteSpace: "nowrap",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
            onMouseEnter={e=>e.currentTarget.style.background="rgb(15 171 35)"}
            onMouseLeave={e=>e.currentTarget.style.background="rgb(15 171 35)"}
          >
            ⬇ Download
          </button>
          {showDownloadMenu && (
            <div style={{
              position: "absolute",
              top: "calc(100% + 6px)",
              right: 0,
              background: "#fff",
              borderRadius: 8,
              boxShadow: "0 4px 20px rgba(0,0,0,0.18)",
              zIndex: 999,
              minWidth: 160,
              overflow: "hidden",
            }}>
              <button
                onClick={handleDownloadExcel}
                style={{
                  display: "block", width: "100%", padding: "10px 18px",
                  background: "none", border: "none", textAlign: "left",
                  fontSize: 13, fontWeight: 600, cursor: "pointer", color: "#1e293b",
                }}
                onMouseEnter={e=>e.currentTarget.style.background="#f1f5f9"}
                onMouseLeave={e=>e.currentTarget.style.background="none"}
              >
                📊 CSV / Excel
              </button>
              <button
                onClick={handleDownloadPDF}
                style={{
                  display: "block", width: "100%", padding: "10px 18px",
                  background: "none", border: "none", textAlign: "left",
                  fontSize: 13, fontWeight: 600, cursor: "pointer", color: "#1e293b",
                  borderTop: "1px solid #f1f5f9",
                }}
                onMouseEnter={e=>e.currentTarget.style.background="#f1f5f9"}
                onMouseLeave={e=>e.currentTarget.style.background="none"}
              >
                📄 PDF
              </button>
            </div>
          )}
        </div>

      </div>
      
    </div>

    {/* error banner */}
    {error&&(
      <div style={{marginBottom:16,padding:"10px 16px",background:"#fef2f2",border:"1px solid #fecaca",borderRadius:8,color:"#dc2626",fontSize:13,display:"flex",alignItems:"center",gap:8}}>
        ⚠️ {error}
      </div>
    )}

    {filteredTiles.length>0&&(
      <div style={{marginBottom:24}}>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,minmax(0,1fr))",gap:16,marginBottom:14}}>
          {visible.map(t=>renderTile(t, isRecoveryMode))}
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
  {modalTile && <KPITileModal tile={modalTile} isRecoveryMode={isRecoveryMode} onClose={() => setModalTile(null)} />}
  <ChatbotWidget
      defaultMode="popup"
      defaultOpen={false}
      accentColor="#6366f1" 
    />
</>


);

function renderTile(tile, isRecoveryMode){
  const{label,color,unit,value,target,series,dates:gd,viewBy:tvb,cms,trend,lastUpdated}=tile;
  const display=(value===null||value===undefined)?"–":value;
  const targetNum=parseFloat(String(target).replace("%",""));


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
  const LOWER_IS_BETTER_LABELS = ["aht","average handle time","formal substantiated","complaints","shrinkage","attrition","absenteeism","acw"];
  const isLowerBetterTile = LOWER_IS_BETTER_LABELS.some(k => label.toLowerCase().includes(k));
  const bColor = v => {
    if (v === null) return resolveColor(color);
    if (!isNaN(targetNum) && targetNum > 0) {
      const meeting = isLowerBetterTile ? v <= targetNum : v >= targetNum;
      return meeting ? "#22c55e" : "#ef4444";
    }
    return resolveColor(color);
  };
  const tPct=(!isNaN(targetNum)&&yRange>0)?Math.min((targetNum/yRange)*100,100):null;
  console.log(color);
  const vb=tvb||viewBy;
  const total=gd.length;

  return(
    <div className="kpi-tile" key={label}>

      {/* row 1: title + target */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:4}}>
        <div style={{fontSize:12,fontWeight:700,color:"#475569",flex:1,marginRight:8,lineHeight:1.4,whiteSpace:"normal",overflow:"hidden",display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical"}}>{label}</div>
          <div style={{display: "flex", flexDirection: "column"}}>
            <span style={{fontSize:11,fontWeight:700,whiteSpace:"nowrap",flexShrink:0,display:"flex",justifyContent: "space-between",gap:4}}>
            {target && target!=="-"&&( <span>Target: <span style={{color}}>{target}</span> </span> )}
              <button
                onClick={e=>{e.stopPropagation();setModalTile(tile);}}
                title="View details"
                style={{
                  position: "relative", right: "0",
                  background:"transparent",cursor:"pointer",
                  fontSize:14,lineHeight:1,marginLeft: "auto", border: "none",
                  display:"inline-flex",alignItems:"center",
                }}
              ><InfoCircleOutlined /></button>
            </span>
            {lastUpdated && (
              <div style={{
                fontSize: 9,
                color: "#9ca3af",
                fontFamily: "'DM Mono', monospace",
                marginTop: 2,
                marginBottom: 4,
              }}>
                Last Updated {lastUpdated}
              </div>
            )}
          </div>
        {/* {target!=="-"&&(
          <span style={{fontSize:11,fontWeight:700,whiteSpace:"nowrap",flexShrink:0}}>
            Target: <span style={{color}}>{target}</span>
          </span>
        )} */}
      </div>

      {/* row 2: legend */}
    {filters.lob !== "ALL" && !isRecoveryMode && target && target !=="-" && <div style={{display:"flex",gap:14,marginBottom:6}}>
        {[["#22c55e","Above"],["#ef4444","Below"]].map(([c,l])=>(
          <span key={l} style={{fontSize:10,color:"#64748b",display:"flex",alignItems:"center",gap:3}}>
            <span style={{width:8,height:8,borderRadius:"50%",background:c,display:"inline-block"}}/>
            {l}
          </span>
        ))}
      </div>}

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
          // const step=1;
          const step = isDateRangeActive ? Math.max(1, Math.ceil(total / 16)) : 1;
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
                const tipLabel=xLabel(gd[i],vb);
                const tipVal=`${tipLabel}: ${pt.v}${unit}`;
                return(
                  <rect key={i} x={x} y={VH-h} width={barW} height={h}
                    // fill={bColor(pt.v)} rx={1}
                     fill={pt.c}  
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
                const lbl=xLabel(d,vb);
                const x=yAW+i*barGap+barGap/2;
                return <text key={i} x={x} y={VH+xAH}
                  textAnchor="middle" fontSize={6} fill="#94a3b8" fontWeight="600" fontFamily="sans-serif">{lbl}</text>;
              })}
            </svg>
          );
        })():(
          <div style={{height:80,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,color:"#cbd5e1"}}>No Data</div>
        )}
      </div>

      {/* row 5: current trend + bonus/target trend from backend */}
    {(filters.lob !== "ALL" && hasG) && (cms && cms !== "-") && (
      <div style={{marginTop:8,paddingTop:8,borderTop:"1px solid #f1f5f9"}}>
        <div style={{fontSize:11,lineHeight:1.5}}>
          {viewBy==="day"&&( <span style={{color:"#64748b",fontWeight:'bold'}}>Current Month: </span>)}
          {viewBy==="week"&&( <span style={{color:"#64748b",fontWeight:'bold'}}>Last 12 Weeks: </span>)}
          {(viewBy==="month" || viewBy==="quarterly")&&( <span style={{color:"#64748b",fontWeight:'bold'}}>Current Year: </span>)}
          <span style={{fontWeight:'bold',color:
            (cms&&cms.toLowerCase().includes("not meeting"))?"#ef4444":
            (cms&&cms.toLowerCase().includes("meeting"))?"#22c55e":"#94a3b8"}}>
            {cms}
          </span>
        </div>
        {trend && trend !== "-" && (
          <div style={{fontSize:10,lineHeight:1.4,marginTop:2}}>
            <span style={{color:"#64748b",fontWeight:'bold'}}>Bonus and Target Trend: </span>
            <span style={{fontWeight:'bold',color:"#3b82f6"}}>{trend}</span>
          </div>
        )}
      </div>
    )}
    </div>   
  );

  }
}
