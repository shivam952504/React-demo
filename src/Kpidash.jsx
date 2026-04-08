import React, { useEffect, useState, useMemo } from “react”;
import axios from “axios”;
import { Select, Table, Spin } from “antd”;
import { LeftOutlined, RightOutlined } from “@ant-design/icons”;
import LoaderOverlay from “../loader/LoaderOverlay”;

const { Option } = Select;
const API_BASE = “http://localhost:9009/api”;

const MONTH_NAMES = [
“January”,“February”,“March”,“April”,“May”,“June”,
“July”,“August”,“September”,“October”,“November”,“December”,
];
const CURRENT_YEAR = new Date().getFullYear();

/* ─────────────────────────────────────────────────────────────
COLOR MAP — backend color strings → CSS hex
──────────────────────────────────────────────────────────────*/
const COLOR_MAP = {
green:  “#389e0d”,
red:    “#cf1322”,
orange: “#fa8c16”,
blue:   “#1890ff”,
yellow: “#faad14”,
purple: “#722ed1”,
white:  “#8c8c8c”,
gray:   “#8c8c8c”,
grey:   “#8c8c8c”,
};
function resolveColor(c) {
if (!c) return “#8c8c8c”;
const lc = String(c).toLowerCase().trim();
return COLOR_MAP[lc] || c;
}
/* light tint of a color for cell backgrounds */
function colorToTint(c, alpha = 0.15) {
const hex = resolveColor(c).replace(”#”,””);
if (hex.length !== 6) return `rgba(0,200,0,${alpha})`;
const r = parseInt(hex.slice(0,2),16);
const g = parseInt(hex.slice(2,4),16);
const b = parseInt(hex.slice(4,6),16);
return `rgba(${r},${g},${b},${alpha})`;
}

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
if (isoW) return parseInt(isoW[1])*100 + parseInt(isoW[2]);
const longW = k.match(/^week(\d{1,2})\s*(/i);
if (longW) return parseInt(longW[1]);
const bareW = k.match(/^w(?:eek\s*)?(\d{1,2})$/i);
if (bareW) return parseInt(bareW[1]);
const lk = k.toLowerCase();
if (MONTH_ORDER[lk]) return MONTH_ORDER[lk];
const mY = k.match(/^([a-z]+)[\s-](\d{4})$/i);
if (mY) { const mo = MONTH_ORDER[mY[1].toLowerCase()]; if (mo) return parseInt(mY[2])*100 + mo; }
return k;
}
function smartSort(dates) {
return […new Set(dates)].sort((a,b) => {
const va = dateKeyToSortValue(a), vb = dateKeyToSortValue(b);
if (typeof va === “number” && typeof vb === “number”) return va - vb;
return String(va).localeCompare(String(vb));
});
}

/* ─────────────────────────────────────────────────────────────
X-AXIS LABEL
──────────────────────────────────────────────────────────────*/
function xAxisLabel(d, i, totalLen, viewBy) {
const k = String(d).trim();
if (viewBy === “week”) {
const m = k.match(/(?:^week|^W)(\d{1,2})/i);
if (m) return `W${m[1]}`;
return k.split(” “)[0];
}
if (viewBy === “month”) {
const iso = k.match(/^\d{4}-(\d{2})$/);
if (iso) return MONTH_NAMES[parseInt(iso[1])-1]?.substring(0,3) ?? k;
const lk = k.toLowerCase();
if (MONTH_ORDER[lk]) return k.substring(0,3);
const my = k.match(/^([a-z]+)/i);
if (my) return my[1].substring(0,3);
return k.substring(0,3);
}
// day — show day number 1,2,3…31
const dt = new Date(k);
if (!isNaN(dt.getTime())) return String(dt.getDate());
return k.split(”-”).pop() || “”;
}

/* ─────────────────────────────────────────────────────────────
FIELD EXTRACTORS
──────────────────────────────────────────────────────────────*/
function extractField(raw, field) {
if (raw === null || raw === undefined) return null;
if (typeof raw === “object” && !Array.isArray(raw))
return raw[field] !== undefined ? raw[field] : null;
if (field === “Overall” || field === “overall”) return raw;
return null;
}
function getOverall(raw) {
const v = extractField(raw,“Overall”) ?? extractField(raw,“overall”)
?? extractField(raw,“overall_percentage”)
?? (typeof raw !== “object” ? raw : null);
if (v === null || v === undefined) return null;
if (typeof v === “boolean”) return null;
const s = String(v).trim();
if (s === “” || s === “-” || s === “–” || s.toLowerCase() === “nan”) return null;
const n = parseFloat(s.replace(”%”,””));
return isNaN(n) ? s : n;
}
function getCellDisplay(raw) { const v = getOverall(raw); return v !== null ? v : “-”; }
function getCellColor(raw)   { return extractField(raw, “color”) || null; }
function getTarget(raw) {
const t = extractField(raw, “target”);
if (t === null || t === undefined) return “-”;
const s = String(t).trim();
return (s === “” || s === “-” || s === “–”) ? “-” : s;
}
function getColor(raw)    { return resolveColor(extractField(raw, “color”)); }
function getBoolFlag(raw, flag) { if (!raw || typeof raw !== “object”) return false; return raw[flag] === true; }
function isNested(raw) {
return raw !== null && typeof raw === “object” && !Array.isArray(raw) &&
(“Overall” in raw || “overall” in raw || “overall_percentage” in raw);
}

/* ─────────────────────────────────────────────────────────────
PARSE DATE ENTRIES
──────────────────────────────────────────────────────────────*/
function parseDateEntries(response) {
const nonTile = Object.keys(response).filter(k => k !== “tile”);
const first   = response[nonTile[0]];
let dates = [], dataMap = {};
const looksLikeEntry = v =>
v && typeof v === “object” && !Array.isArray(v) &&
Object.values(v).some(x =>
typeof x === “string” || typeof x === “number” || typeof x === “boolean” ||
(typeof x === “object” && x !== null && “Overall” in x)
);
if (looksLikeEntry(first)) {
dates = nonTile;
nonTile.forEach(d => { dataMap[d] = response[d]; });
} else {
Object.values(response).forEach(group => {
if (group && typeof group === “object” && !Array.isArray(group))
Object.keys(group).forEach(date => {
if (date !== “tile”) { dates.push(date); dataMap[date] = group[date]; }
});
});
}
return { dates: smartSort(dates), dataMap };
}

function discoverMetricKeys(dates, dataMap) {
const seen = new Set(), ordered = [];
dates.forEach(d => {
const entry = dataMap[d]; if (!entry) return;
Object.keys(entry).forEach(k => { if (!seen.has(k)) { seen.add(k); ordered.push(k); } });
});
return ordered;
}
function keyExistsInAnyEntry(key, dates, dataMap) { return dates.some(d => key in (dataMap[d] || {})); }
function hasRealValue(key, dates, dataMap) { return dates.some(d => getOverall(dataMap[d]?.[key]) !== null); }

function metricPassesToggle(key, dates, dataMap, cOn, bOn, bqOn) {
if (!cOn && !bOn && !bqOn) return true;
const isFlat = !dates.some(d => isNested(dataMap[d]?.[key]));
if (isFlat) return true;
if (cOn  && !dates.some(d => getBoolFlag(dataMap[d]?.[key], “Contractual”)))       return false;
if (bOn  && !dates.some(d => getBoolFlag(dataMap[d]?.[key], “Bonus and Penalty”))) return false;
if (bqOn && !dates.some(d => getBoolFlag(dataMap[d]?.[key], “Bonus Qualifier”)))   return false;
return true;
}

/* ─────────────────────────────────────────────────────────────
TOGGLE SWITCH
──────────────────────────────────────────────────────────────*/
function ToggleSwitch({ label, value, onChange }) {
return (
<div onClick={() => onChange(!value)} style={{
display:“flex”, flexDirection:“column”, alignItems:“center”,
gap:3, cursor:“pointer”, userSelect:“none”, flexShrink:0,
}}>
<span style={{
fontSize:11, fontWeight:700, lineHeight:1.25, textAlign:“center”,
color: value ? “#153a6f” : “#555”, whiteSpace:“nowrap”,
}}>{label}</span>
<div style={{
width:34, height:18, borderRadius:9,
background: value ? “#153a6f” : “#d9d9d9”,
position:“relative”, transition:“background 0.2s”,
}}>
<div style={{
position:“absolute”, top:3, left: value ? 17 : 3,
width:12, height:12, borderRadius:“50%”,
background:”#fff”, transition:“left 0.2s”,
boxShadow:“0 1px 3px rgba(0,0,0,0.25)”,
}}/>
</div>
</div>
);
}

/* =============================================================
COMPONENT
============================================================= */
export default function KPIDashboard() {
const [loading,          setLoading]          = useState(false);
const [tableLoading,     setTableLoading]     = useState(false);
const [viewBy,           setViewBy]           = useState(“day”);
const [contractualOn,    setContractualOn]    = useState(false);
const [bonusOn,          setBonusOn]          = useState(false);
const [bonusQualifierOn, setBonusQualifierOn] = useState(false);
const [columns,          setColumns]          = useState([]);
const [filterOptions,    setFilterOptions]    = useState({});
const [allTileData,      setAllTileData]      = useState([]);
const [allTableRows,     setAllTableRows]     = useState([]);
const [chartDates,       setChartDates]       = useState([]);
const [chartDataMap,     setChartDataMap]     = useState({});
const [tilePage,         setTilePage]         = useState(0);
const [isFilterLoaded,   setIsFilterLoaded]   = useState(false);
const [error,            setError]            = useState(null);

const TILES_PER_PAGE = 6; // 2 rows × 3 cols

const [filters, setFilters] = useState({
year_type:    “Calendar Year”,
year:         CURRENT_YEAR,
month:        “January”,
geo:          [“ALL”],
program:      [“ALL”],
lob:          [“ALL”],
supervisor:   [“ALL”],
tenure_units: [“ALL”],
});

const [debouncedFilters, setDebouncedFilters] = useState(null);
const debounceRef     = React.useRef(null);
const activeViewByRef = React.useRef(viewBy);

/* endpoints */
const dataEndpoint   = vb => vb===“day”?”/get_concora_daily_data/”:vb===“week”?”/get_concora_weekly_data/”:”/get_concora_monthly_data/”;
const filterEndpoint = vb => vb===“day”?”/get_concora_daily_filters/”:vb===“week”?”/get_concora_weekly_filters/”:”/get_concora_monthly_filters/”;

const buildPayload = f => ({
year_type:    f.year_type,
year:         f.year,
month:        f.month,
geo:          f.geo,
program:      f.program,
lob:          f.lob,
supervisor:   f.supervisor,
tenure_units: f.tenure_units,
});

/* debounce */
useEffect(() => {
if (debounceRef.current) clearTimeout(debounceRef.current);
debounceRef.current = setTimeout(() => setDebouncedFilters({…filters}), 600);
return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
}, [filters]);

/* ── EFFECT 1: viewBy change → filter API then data API ──────*/
useEffect(() => {
const thisViewBy = viewBy;
activeViewByRef.current = thisViewBy;
setIsFilterLoaded(false);
setLoading(true);
setTableLoading(true);
setError(null);
setAllTableRows([]); setAllTileData([]); setColumns([]);

```
const p = buildPayload(filters);
axios.post(API_BASE + filterEndpoint(thisViewBy), p)
  .then(res => {
    if (activeViewByRef.current !== thisViewBy) return;
    setFilterOptions(res.data || {});
    setIsFilterLoaded(true);
    setLoading(false);
    return axios.post(API_BASE + dataEndpoint(thisViewBy), p);
  })
  .then(dataRes => {
    if (!dataRes || activeViewByRef.current !== thisViewBy) return;
    if (!dataRes.data || Object.keys(dataRes.data).length === 0) {
      setError("No data available for the selected filters.");
    } else {
      buildDynamicTable(dataRes.data, thisViewBy);
    }
  })
  .catch(() => {
    if (activeViewByRef.current !== thisViewBy) return;
    setError("Failed to load. Please try again.");
    setAllTableRows([]); setAllTileData([]); setColumns([]);
  })
  .finally(() => {
    if (activeViewByRef.current === thisViewBy) {
      setLoading(false); setTableLoading(false);
    }
  });
```

}, [viewBy]); // eslint-disable-line

/* ── EFFECT 2: debounced filter change → filter API then data API */
useEffect(() => {
if (!isFilterLoaded || !debouncedFilters) return;
const thisViewBy = viewBy;
setTableLoading(true);
setError(null);
const p = buildPayload(debouncedFilters);
axios.post(API_BASE + filterEndpoint(thisViewBy), p)
.then(res => {
if (activeViewByRef.current !== thisViewBy) return;
setFilterOptions(res.data || {});
return axios.post(API_BASE + dataEndpoint(thisViewBy), p);
})
.then(dataRes => {
if (!dataRes || activeViewByRef.current !== thisViewBy) return;
if (!dataRes.data || Object.keys(dataRes.data).length === 0) {
setAllTableRows([]); setAllTileData([]); setColumns([]);
setError(“No data available for the selected filters.”);
} else {
buildDynamicTable(dataRes.data, thisViewBy);
}
})
.catch(() => {
if (activeViewByRef.current !== thisViewBy) return;
setAllTableRows([]); setAllTileData([]); setColumns([]);
setError(“Failed to load data.”);
})
.finally(() => { if (activeViewByRef.current === thisViewBy) setTableLoading(false); });
}, [debouncedFilters]); // eslint-disable-line

/* ── BUILD DYNAMIC TABLE ─────────────────────────────────────*/
const buildDynamicTable = (response, currentViewBy) => {
const tileObj            = response.tile || {};
const { dates, dataMap } = parseDateEntries(response);
if (dates.length === 0) {
setColumns([]); setAllTableRows([]); setAllTileData([]); return;
}
setChartDates(dates);
setChartDataMap(dataMap);

```
const metricKeys = discoverMetricKeys(dates, dataMap);
const activeKeys = metricKeys.filter(key => keyExistsInAnyEntry(key, dates, dataMap));

const getMetricTarget = key => {
  for (const d of dates) { const t = getTarget(dataMap[d]?.[key]); if (t !== "-") return t; }
  return "-";
};

/* TABLE COLUMNS */
const cols = [
  { title:"Metric", dataIndex:"metric", width:260, fixed:"left",
    render: text => <span style={{fontWeight:500, fontSize:13}}>{text}</span> },
  { title:"Target", dataIndex:"target", width:90, align:"center" },
  ...dates.map(date => ({
    title: date, dataIndex: date, align:"center",
    render: (val, record) => {
      // get color for this cell from dataMap
      const raw      = dataMap[date]?.[record.key];
      const cellColor = getCellColor(raw);
      const bg       = cellColor ? colorToTint(cellColor, 0.18) : "#d7f5e9";
      const isEmpty  = val === null || val === undefined || val === "" || val === "-";
      return (
        <div style={{
          background: isEmpty ? "#f5f5f5" : bg,
          padding:"4px 6px", borderRadius:4,
          textAlign:"center", fontSize:12,
          color: isEmpty ? "#bbb" : "#222",
        }}>
          {isEmpty ? "-" : val}
        </div>
      );
    },
  })),
];
setColumns(cols);

/* TABLE ROWS */
const rows = activeKeys.map(key => {
  const row = { key, metric:key, target:getMetricTarget(key) };
  dates.forEach(date => { row[date] = getCellDisplay(dataMap[date]?.[key]); });
  return row;
});
setAllTableRows(rows);

/* TILES */
const graphDates = currentViewBy === "day" ? dates : dates.slice(-12);

const tiles = activeKeys
  .filter(key => hasRealValue(key, dates, dataMap))
  .map(key => {
    /* tile display value */
    let tileValue = getOverall(tileObj?.[key]);
    if (tileValue === null) {
      for (let i = dates.length-1; i >= 0; i--) {
        const v = getOverall(dataMap[dates[i]]?.[key]);
        if (v !== null) { tileValue = v; break; }
      }
    }
    /* color */
    let color = getColor(tileObj?.[key]);
    if (!color || color === "#8c8c8c") {
      for (const d of dates) {
        const c = getColor(dataMap[d]?.[key]);
        if (c && c !== "#8c8c8c") { color = c; break; }
      }
    }
    /* target */
    let target = getTarget(tileObj?.[key]);
    if (target === "-") target = getMetricTarget(key);

    /* series: value + color per bar */
    const series = graphDates.map(d => {
      const raw = dataMap[d]?.[key];
      const v   = getOverall(raw);
      return {
        value: v !== null && !isNaN(Number(v)) ? Number(v) : null,
        color: getColor(raw) || color,
      };
    });

    /* unit */
    const sampleRaw  = tileObj?.[key] ?? dataMap[dates[dates.length-1]]?.[key];
    const overallStr = String(extractField(sampleRaw,"Overall") ?? sampleRaw ?? "");
    const unit       = overallStr.includes("%") ? "%" : "";

    const contractual    = dates.some(d => getBoolFlag(dataMap[d]?.[key], "Contractual"));
    const bonus          = dates.some(d => getBoolFlag(dataMap[d]?.[key], "Bonus and Penalty"));
    const bonusQualifier = dates.some(d => getBoolFlag(dataMap[d]?.[key], "Bonus Qualifier"));
    const flat           = !dates.some(d => isNested(dataMap[d]?.[key]));

    /* current month status — placeholder until backend adds field */
    const currentMonthStatus = extractField(tileObj?.[key], "current_month_status") ?? null;

    return {
      key, label:key, color, unit,
      value:tileValue, target, series,
      dates:graphDates, viewBy:currentViewBy,
      contractual, bonus, bonusQualifier, flat,
      currentMonthStatus,
    };
  });

setAllTileData(tiles);
setTilePage(0);
```

};

/* ── FILTERED DATA ───────────────────────────────────────────*/
const tableData = useMemo(() => {
if (!contractualOn && !bonusOn && !bonusQualifierOn) return allTableRows;
return allTableRows.filter(row =>
metricPassesToggle(row.key, chartDates, chartDataMap, contractualOn, bonusOn, bonusQualifierOn)
);
}, [contractualOn, bonusOn, bonusQualifierOn, allTableRows, chartDates, chartDataMap]);

const filteredTiles = useMemo(() => {
if (!contractualOn && !bonusOn && !bonusQualifierOn) return allTileData;
return allTileData.filter(tile => {
if (tile.flat) return true;
if (contractualOn    && !tile.contractual)    return false;
if (bonusOn          && !tile.bonus)           return false;
if (bonusQualifierOn && !tile.bonusQualifier)  return false;
return true;
});
}, [contractualOn, bonusOn, bonusQualifierOn, allTileData]);

useEffect(() => { setTilePage(0); }, [filteredTiles.length]);

const totalTilePages = Math.ceil(filteredTiles.length / TILES_PER_PAGE);
const pagedTiles     = filteredTiles.slice(tilePage*TILES_PER_PAGE, tilePage*TILES_PER_PAGE+TILES_PER_PAGE);
// split into 2 rows of 3
const tileRow1 = pagedTiles.slice(0, 3);
const tileRow2 = pagedTiles.slice(3, 6);

/* ── FILTER UPDATE — auto-deselect ALL when real value chosen */
const updateMultiFilter = (key, val) => {
let next = val;
// if user picked something other than ALL and ALL was in list, remove ALL
if (val.length > 1 && val[val.length-1] !== “ALL”) {
next = val.filter(v => v !== “ALL”);
}
// if user picked ALL, keep only ALL
if (val.includes(“ALL”) && val[val.length-1] === “ALL”) {
next = [“ALL”];
}
// if empty, revert to ALL
if (next.length === 0) next = [“ALL”];
setFilters(prev => ({…prev, [key]: next}));
};

/* ═══════════════════════════════════════════════════════════
RENDER
═══════════════════════════════════════════════════════════*/
return (
<>
{loading && <LoaderOverlay show={loading}/>}
<div style={{padding:4, opacity:loading?0.5:1}}>
<style>{`.filter-col { display:flex; flex-direction:column; min-width:0; flex:1; } .filter-col label { font-size:11px; font-weight:700; text-align:center; color:#222; margin-bottom:3px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; } /* unified 28px height for ALL select types */ .kpi-filter-row .ant-select { height:28px !important; } .kpi-filter-row .ant-select-selector { height:28px !important; min-height:28px !important; padding:0 6px !important; display:flex !important; align-items:center !important; box-sizing:border-box !important; font-size:11px !important; } .kpi-filter-row .ant-select:not(.ant-select-multiple) .ant-select-selection-item, .kpi-filter-row .ant-select:not(.ant-select-multiple) .ant-select-selection-placeholder { line-height:26px !important; font-size:11px !important; } .kpi-filter-row .ant-select-selection-overflow { flex-wrap:nowrap; overflow:hidden; height:26px; align-items:center; } .kpi-filter-row .ant-select-selection-overflow-item { height:20px; } .kpi-filter-row .ant-select-selection-item { height:20px !important; line-height:18px !important; font-size:11px !important; margin:0 2px 0 0 !important; padding:0 4px !important; display:flex !important; align-items:center !important; } .kpi-filter-row .ant-select-selection-item-remove { display:flex !important; align-items:center !important; font-size:10px !important; margin-left:2px !important; } .kpi-filter-row .ant-select-arrow { font-size:10px !important; } .kpi-filter-row .ant-select-selection-placeholder { font-size:11px !important; line-height:26px !important; } .ant-table-thead > tr > th { background:#153a6f !important; color:white !important; font-weight:600; font-size:12px; } /* view by segmented */ .viewby-seg .ant-segmented-item { font-weight:600; font-size:12px; } .viewby-seg .ant-segmented-item-selected { background:#153a6f !important; color:#fff !important; } /* tile card */ .kpi-tile-card { background:#fff; border-radius:12px; box-shadow:0 2px 12px rgba(0,0,0,0.09); padding:14px 16px 12px 16px; box-sizing:border-box; display:flex; flex-direction:column; flex:1; min-width:0; } .nav-btn-lg { width:44px; height:44px; border-radius:50%; border:1.5px solid #d0d0d0; background:#fff; display:flex; align-items:center; justify-content:center; cursor:pointer; box-shadow:0 2px 8px rgba(0,0,0,0.12); transition:all 0.2s; flex-shrink:0; padding:0; } .nav-btn-lg:hover:not(:disabled){background:#f0f0f0;border-color:#888;} .nav-btn-lg:disabled{opacity:0.25;cursor:not-allowed;}`}</style>

```
    {/* ═══ FILTER PANEL — Figma dark navy ══════════════════*/}
    <div className="kpi-filter-row" style={{
      background:"#1a2744", borderRadius:12,
      padding:"14px 18px", marginBottom:14,
    }}>
      {/* ROW 1: Year / Month  ·  Toggles  ·  View By */}
      <div style={{display:"flex",alignItems:"flex-end",gap:16,marginBottom:14}}>

        {viewBy !== "week" && (
          <div style={{display:"flex",flexDirection:"column",gap:4}}>
            <span style={{fontSize:11,fontWeight:700,color:"#94a3b8",letterSpacing:"0.5px"}}>YEAR</span>
            <Select value={filters.year} size="small" style={{width:110}}
              popupMatchSelectWidth={false} styles={{popup:{minWidth:100}}}
              onChange={v=>setFilters(p=>({...p,year:v}))}>
              {(filterOptions.year||[]).map(v=><Option key={v} value={v}>{v}</Option>)}
            </Select>
          </div>
        )}

        {viewBy === "day" && (
          <div style={{display:"flex",flexDirection:"column",gap:4}}>
            <span style={{fontSize:11,fontWeight:700,color:"#94a3b8",letterSpacing:"0.5px"}}>MONTH</span>
            <Select value={filters.month} size="small" style={{width:130}}
              popupMatchSelectWidth={false} styles={{popup:{minWidth:140}}}
              onChange={v=>setFilters(p=>({...p,month:v}))}>
              {(filterOptions.month||[]).map(v=><Option key={v} value={v}>{v}</Option>)}
            </Select>
          </div>
        )}

        <div style={{flex:1}}/>

        {/* TOGGLES — white labels on dark bg */}
        {[
          {label:"Contractual",      val:contractualOn,    set:setContractualOn},
          {label:"Bonus & Penalty",  val:bonusOn,          set:setBonusOn},
          {label:"Bonus Qualifier",  val:bonusQualifierOn, set:setBonusQualifierOn},
        ].map(({label,val,set})=>(
          <div key={label} onClick={()=>set(p=>!p)}
            style={{display:"flex",flexDirection:"column",alignItems:"center",gap:3,cursor:"pointer",userSelect:"none"}}>
            <span style={{fontSize:11,fontWeight:700,color:val?"#93c5fd":"#94a3b8",whiteSpace:"nowrap"}}>{label}</span>
            <div style={{width:34,height:18,borderRadius:9,background:val?"#3b82f6":"#4b5563",position:"relative",transition:"background 0.2s"}}>
              <div style={{position:"absolute",top:3,left:val?17:3,width:12,height:12,borderRadius:"50%",background:"#fff",transition:"left 0.2s",boxShadow:"0 1px 3px rgba(0,0,0,0.3)"}}/>
            </div>
          </div>
        ))}

        {/* VIEW BY */}
        <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
          <span style={{fontSize:11,fontWeight:700,color:"#94a3b8",letterSpacing:"0.5px"}}>View By</span>
          <div style={{display:"flex",borderRadius:6,overflow:"hidden",border:"1px solid #374151"}}>
            {["Day","Week","Month"].map((lbl,li)=>{
              const val=lbl.toLowerCase(), active=viewBy===val;
              return (
                <div key={val} onClick={()=>setViewBy(val)} style={{
                  padding:"5px 14px",cursor:"pointer",fontSize:12,fontWeight:700,
                  background:active?"#3b82f6":"transparent",
                  color:active?"#fff":"#94a3b8",
                  transition:"all 0.2s",
                  borderRight:li<2?"1px solid #374151":"none",
                }}>{lbl}</div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ROW 2: GEO  JC  LOB  SUPERVISOR  TENURE */}
      <div style={{display:"flex",gap:12,flexWrap:"nowrap",alignItems:"flex-end"}}>
        {[
          {label:"GEO",              key:"geo",          opts:filterOptions.geo||[]},
          {label:"JC",               key:"program",      opts:filterOptions.program||[]},
          {label:"LOB",              key:"lob",          opts:filterOptions.lob||[]},
          {label:"SUPERVISOR",       key:"supervisor",   opts:filterOptions.supervisor||[]},
          {label:"TENURE",           key:"tenure_units", opts:filterOptions.tenure_units||filterOptions.tenure_unit||[]},
        ].map(({label,key,opts})=>(
          <div key={key} style={{display:"flex",flexDirection:"column",gap:4,flex:1,minWidth:0}}>
            <span style={{fontSize:11,fontWeight:700,color:"#94a3b8",letterSpacing:"0.5px"}}>{label}</span>
            <Select mode="multiple" value={filters[key]} size="small"
              style={{width:"100%"}} popupMatchSelectWidth={false}
              styles={{popup:{minWidth:160}}} maxTagCount="responsive"
              onChange={v=>updateMultiFilter(key,v)}>
              {opts.map(v=><Option key={v} value={v}>{v}</Option>)}
            </Select>
          </div>
        ))}
      </div>
    </div>

    {/* error banner */}
    {error && (
      <div style={{
        marginBottom:12, padding:"10px 16px",
        background:"#fff2f0", border:"1px solid #ffccc7",
        borderRadius:8, color:"#cf1322", fontSize:13,
        display:"flex", alignItems:"center", gap:8,
      }}>
        <span style={{fontSize:16}}>⚠️</span>{error}
      </div>
    )}

    {/* ═══ TILES — 2 rows × 3, prev/next at row 1 edges ════*/}
    {filteredTiles.length > 0 && (
      <div style={{marginBottom:16}}>
        {/* ROW 1 with nav arrows on left and right */}
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12}}>
          {/* PREV — far left */}
          <button className="nav-btn-lg"
            disabled={tilePage===0}
            onClick={()=>setTilePage(p=>Math.max(0,p-1))}>
            <LeftOutlined style={{fontSize:20,color:"#333"}}/>
          </button>

          {/* 3 tiles row 1 */}
          <div style={{flex:1,display:"flex",gap:12}}>
            {tileRow1.map(tile=>renderKpiCard(tile))}
            {Array.from({length:3-tileRow1.length}).map((_,i)=>(
              <div key={"p1"+i} style={{flex:1}}/>
            ))}
          </div>

          {/* NEXT — far right */}
          <button className="nav-btn-lg"
            disabled={tilePage>=totalTilePages-1}
            onClick={()=>setTilePage(p=>Math.min(totalTilePages-1,p+1))}>
            <RightOutlined style={{fontSize:20,color:"#333"}}/>
          </button>
        </div>

        {/* page dots — centered, only if >1 page */}
        {totalTilePages>1 && (
          <div style={{display:"flex",justifyContent:"center",gap:6,marginBottom:12}}>
            {Array.from({length:totalTilePages}).map((_,i)=>(
              <div key={i} onClick={()=>setTilePage(i)} style={{
                width:i===tilePage?22:8,height:8,borderRadius:4,
                background:i===tilePage?"#153a6f":"#d9d9d9",
                cursor:"pointer",transition:"all 0.3s",
              }}/>
            ))}
          </div>
        )}

        {/* ROW 2 — no arrows, indented to align under tiles */}
        <div style={{display:"flex",gap:12,paddingLeft:54,paddingRight:54}}>
          {tileRow2.map(tile=>renderKpiCard(tile))}
          {Array.from({length:3-tileRow2.length}).map((_,i)=>(
            <div key={"p2"+i} style={{flex:1}}/>
          ))}
        </div>
      </div>
    )}

    {/* ═══ TABLE ══════════════════════════════════════════*/}
    <div style={{minHeight:120}}>
      {tableLoading ? (
        <div style={{
          display:"flex", alignItems:"center", justifyContent:"center",
          padding:"60px 0", background:"#fff", borderRadius:8,
          boxShadow:"0 2px 8px rgba(0,0,0,0.06)",
        }}>
          <Spin size="large" tip="Loading data..."/>
        </div>
      ) : (
        <Table
          columns={columns}
          dataSource={tableData}
          pagination={false}
          bordered
          size="small"
          scroll={{x:"max-content", y:320}}
          rowKey="key"
        />
      )}
    </div>
  </div>
</>
```

);

/* ═══════════════════════════════════════════════════════════
KPI CARD — matches Figma design
═══════════════════════════════════════════════════════════*/
function renderKpiCard(tile) {
const {label, color, unit, value, target, series, dates:gdates, viewBy:tileViewBy, currentMonthStatus} = tile;

```
const display   = (value === null || value === undefined) ? "--" : value;
const targetNum = parseFloat(String(target).replace("%",""));
const valueNum  = typeof display === "number" ? display : parseFloat(String(display).replace("%",""));
const barPct    = (!isNaN(targetNum) && !isNaN(valueNum) && targetNum > 0)
                  ? Math.min((valueNum/targetNum)*100, 100) : 0;

const cleanSeries = series.map(pt => ({
  value: pt.value !== null && !isNaN(Number(pt.value)) ? Number(pt.value) : null,
  color: pt.color || color,
}));
const validNums = cleanSeries.filter(pt => pt.value !== null).map(pt => pt.value);
const hasGraph  = validNums.length > 0;
const maxVal    = hasGraph ? Math.max(...validNums) : 0;
const scaleMax  = maxVal > 0 ? Math.ceil(maxVal / 10) * 10 : 10;
const GRAPH_H   = 68;

const targetLinePct = (!isNaN(targetNum) && targetNum > 0 && scaleMax > 0)
  ? Math.min((targetNum / scaleMax) * 100, 100) : null;

/* above/below legend counts */
const aboveCount = cleanSeries.filter(pt => pt.value !== null && !isNaN(targetNum) && pt.value >= targetNum).length;
const belowCount = cleanSeries.filter(pt => pt.value !== null && !isNaN(targetNum) && pt.value < targetNum).length;

return (
  <div className="kpi-tile-card" key={label}>

    {/* TITLE */}
    <div style={{
      fontSize:12, fontWeight:700, color:"#444",
      whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis",
      marginBottom:4,
    }} title={label}>
      {label}
    </div>

    {/* ABOVE / BELOW legend + TARGET */}
    <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:4}}>
      <div style={{display:"flex", gap:10}}>
        <span style={{fontSize:10, color:"#555", display:"flex", alignItems:"center", gap:3}}>
          <span style={{width:8, height:8, borderRadius:"50%", background:"#389e0d", display:"inline-block"}}/>
          Above
        </span>
        <span style={{fontSize:10, color:"#555", display:"flex", alignItems:"center", gap:3}}>
          <span style={{width:8, height:8, borderRadius:"50%", background:"#cf1322", display:"inline-block"}}/>
          Below
        </span>
      </div>
      <span style={{fontSize:11, fontWeight:700, color:color}}>
        Target: {target}
      </span>
    </div>

    {/* VALUE */}
    <div style={{fontSize:28, fontWeight:800, color, lineHeight:1.1, marginBottom:2}}>
      {display}{display !== "--" && unit ? ` ${unit}` : ""}
    </div>

    {/* TARGET PROGRESS BAR */}
    <div style={{
      height:3, background:"#f0f0f0", borderRadius:2,
      marginBottom:4, overflow:"hidden",
    }}>
      <div style={{width:`${barPct}%`, background:color, height:"100%"}}/>
    </div>

    {/* GRAPH */}
    <div style={{flex:1, display:"flex", flexDirection:"column", justifyContent:"flex-end"}}>
      {hasGraph ? (
        <>
          <div style={{display:"flex", alignItems:"flex-end", gap:3}}>
            {/* Y AXIS */}
            <div style={{
              display:"flex", flexDirection:"column", justifyContent:"space-between",
              height:GRAPH_H, flexShrink:0, marginRight:3, minWidth:24,
            }}>
              <span style={{fontSize:10, fontWeight:700, color:"#666", lineHeight:1}}>{scaleMax}</span>
              <span style={{fontSize:10, fontWeight:700, color:"#666", lineHeight:1}}>{Math.round(scaleMax/2)}</span>
              <span style={{fontSize:10, fontWeight:700, color:"#666", lineHeight:1}}>0</span>
            </div>

            {/* BARS + TARGET LINE */}
            <div style={{
              flex:1, height:GRAPH_H, position:"relative",
              display:"flex", alignItems:"flex-end",
              gap:2, overflow:"hidden",
            }}>
              {cleanSeries.map((pt, i) => {
                const barH = pt.value !== null ? Math.max((pt.value/scaleMax)*GRAPH_H, 2) : 0;
                // color bar green if above target, red if below
                const barColor = (pt.value !== null && !isNaN(targetNum))
                  ? (pt.value >= targetNum ? "#389e0d" : "#cf1322")
                  : (pt.color || color);
                return (
                  <div key={i}
                    title={pt.value !== null ? `${pt.value}${unit}` : "No data"}
                    style={{
                      flex:1, height:barH,
                      background: pt.value !== null ? barColor : "transparent",
                      borderRadius:"2px 2px 0 0",
                      transition:"height 0.3s ease",
                      minWidth:2,
                    }}/>
                );
              })}

              {/* TARGET DOTTED LINE */}
              {targetLinePct !== null && (
                <div title={`Target: ${target}`} style={{
                  position:"absolute", left:0, right:0,
                  bottom:`${targetLinePct}%`,
                  borderTop:"2px dashed #333",
                  opacity:0.5, pointerEvents:"none", zIndex:2,
                }}/>
              )}
            </div>
          </div>

          {/* X AXIS */}
          <div style={{display:"flex", paddingLeft:27, marginTop:3}}>
            {gdates.map((d, i) => {
              const vb = tileViewBy || viewBy;
              const lbl = xAxisLabel(d, i, gdates.length, vb);
              const showLabel = vb === "day"
                ? lbl !== ""
                : (gdates.length <= 6 || i % 2 === 0);
              return (
                <span key={String(d)} style={{
                  flex:1, textAlign:"center",
                  fontSize:10, fontWeight:700, color:"#666",
                  whiteSpace:"nowrap", overflow:"visible",
                }}>
                  {showLabel ? lbl : ""}
                </span>
              );
            })}
          </div>
        </>
      ) : (
        <div style={{
          height:GRAPH_H+14, display:"flex",
          alignItems:"center", justifyContent:"center",
          fontSize:11, color:"#ccc",
        }}>No Data</div>
      )}
    </div>

    {/* CURRENT MONTH STATUS — placeholder until backend adds field */}
    <div style={{
      marginTop:8, paddingTop:8,
      borderTop:"1px solid #f0f0f0",
      fontSize:11, color:"#555",
    }}>
      <div>
        <span style={{color:"#888"}}>Current Month: </span>
        <span style={{
          fontWeight:700,
          color: currentMonthStatus === "Meeting Target" ? "#389e0d"
               : currentMonthStatus === "Not Meeting Target" ? "#cf1322"
               : "#bbb",
        }}>
          {currentMonthStatus || "—"}
        </span>
      </div>
    </div>
  </div>
);
```

}
}
