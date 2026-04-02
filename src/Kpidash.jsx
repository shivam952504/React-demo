import React, { useEffect, useState, useMemo } from “react”;
import axios from “axios”;
import { Select, Table, Segmented, Spin } from “antd”;
import { LeftOutlined, RightOutlined } from “@ant-design/icons”;
import LoaderOverlay from “../loader/LoaderOverlay”;

const { Option } = Select;
const API_BASE = “http://localhost:9009/api”;

const MONTH_NAMES = [
“January”,“February”,“March”,“April”,“May”,“June”,
“July”,“August”,“September”,“October”,“November”,“December”,
];
const CURRENT_YEAR  = new Date().getFullYear();
const CURRENT_MONTH = MONTH_NAMES[new Date().getMonth()];
const TILES_PER_PAGE = 5;

/* ─────────────────────────────────────────────────────────────────
COLOR MAP — maps backend color strings to real CSS colors.
“white” is invisible on white background so we remap it.
──────────────────────────────────────────────────────────────────*/
const COLOR_MAP = {
green:  “#389e0d”,
red:    “#cf1322”,
orange: “#fa8c16”,
blue:   “#1890ff”,
yellow: “#faad14”,
purple: “#722ed1”,
white:  “#8c8c8c”,   // remap white → visible gray
gray:   “#8c8c8c”,
grey:   “#8c8c8c”,
};
function resolveColor(c) {
if (!c) return “#8c8c8c”;
const lc = String(c).toLowerCase().trim();
return COLOR_MAP[lc] || c; // use mapped or raw CSS string
}

/* ─────────────────────────────────────────────────────────────────
smartSort — chronological sort for day/week/month key formats
──────────────────────────────────────────────────────────────────*/
const MONTH_ORDER = {
january:1,february:2,march:3,april:4,may:5,june:6,
july:7,august:8,september:9,october:10,november:11,december:12,
jan:1,feb:2,mar:3,apr:4,jun:6,jul:7,aug:8,sep:9,oct:10,nov:11,dec:12,
};
function dateKeyToSortValue(key) {
const k = key.trim();
if (/^\d{4}-\d{2}-\d{2}$/.test(k))  return new Date(k).getTime();
if (/^\d{4}-\d{2}$/.test(k))         return new Date(k + “-01”).getTime();
const isoWeek = k.match(/^(\d{4})-W(\d{1,2})$/i);
if (isoWeek) return parseInt(isoWeek[1]) * 100 + parseInt(isoWeek[2]);
const plainWeek = k.match(/^W(?:eek\s*)?(\d{1,2})$/i);
if (plainWeek) return parseInt(plainWeek[1]);
// “week2 (04 Jan - 10 Jan)” — backend long format
const longWeek = k.match(/^week(\d{1,2})\s*(/i);
if (longWeek) return parseInt(longWeek[1]);
const bareWeek = k.match(/^week(\d{1,2})$/i);
if (bareWeek) return parseInt(bareWeek[1]);
const lk = k.toLowerCase();
if (MONTH_ORDER[lk]) return MONTH_ORDER[lk];
const monthYear = k.match(/^([a-z]+)[\s-](\d{4})$/i);
if (monthYear) {
const mo = MONTH_ORDER[monthYear[1].toLowerCase()];
if (mo) return parseInt(monthYear[2]) * 100 + mo;
}
return k;
}
function smartSort(dates) {
return […new Set(dates)].sort((a, b) => {
const va = dateKeyToSortValue(a), vb = dateKeyToSortValue(b);
if (typeof va === “number” && typeof vb === “number”) return va - vb;
return String(va).localeCompare(String(vb));
});
}

/* ─────────────────────────────────────────────────────────────────
extractField(raw, field)
Safely read a field from a metric entry which may be:
- a nested object: { Overall, target, color, Contractual, … }
- a flat primitive: “-”, 0, “92.5%”
──────────────────────────────────────────────────────────────────*/
function extractField(raw, field) {
if (raw === null || raw === undefined) return null;
if (typeof raw === “object” && !Array.isArray(raw)) {
return raw[field] !== undefined ? raw[field] : null;
}
// flat primitive — only “Overall” makes sense to return
if (field === “Overall” || field === “overall”) return raw;
return null;
}

/* getOverall — returns parsed number/string or null */
function getOverall(raw) {
const v = extractField(raw, “Overall”) ?? extractField(raw, “overall”)
?? extractField(raw, “overall_percentage”) ?? raw;
if (v === null || v === undefined) return null;
if (typeof v === “boolean”) return null;
const s = String(v).trim();
if (s === “” || s === “-” || s === “–” || s.toLowerCase() === “nan”) return null;
const n = parseFloat(s.replace(”%”, “”));
return isNaN(n) ? s : n;
}

/* getCellDisplay — same but always returns “-” for missing */
function getCellDisplay(raw) {
const v = getOverall(raw);
return v !== null ? v : “-”;
}

/* getTarget — returns target string or “-” */
function getTarget(raw) {
const t = extractField(raw, “target”);
if (t === null || t === undefined) return “-”;
const s = String(t).trim();
return (s === “” || s === “-” || s === “–”) ? “-” : s;
}

/* getColor — returns resolved CSS color string */
function getColor(raw) {
return resolveColor(extractField(raw, “color”));
}

function getBoolFlag(raw, flag) {
if (!raw || typeof raw !== “object”) return false;
return raw[flag] === true;
}

function isNested(raw) {
return raw !== null && typeof raw === “object” && !Array.isArray(raw);
}

/* ─────────────────────────────────────────────────────────────────
parseDateEntries — works for daily/weekly/monthly response shapes
──────────────────────────────────────────────────────────────────*/
function parseDateEntries(response) {
const nonTileKeys = Object.keys(response).filter((k) => k !== “tile”);
const firstEntry  = response[nonTileKeys[0]];
let dates = [], dataMap = {};

const looksLikeEntry = (v) =>
v && typeof v === “object” && !Array.isArray(v) &&
Object.values(v).some((x) =>
typeof x === “string” || typeof x === “number” || typeof x === “boolean” ||
(typeof x === “object” && x !== null && “Overall” in x)
);

if (looksLikeEntry(firstEntry)) {
dates = nonTileKeys;
nonTileKeys.forEach((d) => { dataMap[d] = response[d]; });
} else {
Object.values(response).forEach((group) => {
if (group && typeof group === “object” && !Array.isArray(group)) {
Object.keys(group).forEach((date) => {
if (date !== “tile”) { dates.push(date); dataMap[date] = group[date]; }
});
}
});
}
dates = smartSort(dates);
return { dates, dataMap };
}

function discoverMetricKeys(dates, dataMap) {
const seen = new Set(), ordered = [];
dates.forEach((d) => {
const entry = dataMap[d];
if (!entry) return;
Object.keys(entry).forEach((k) => {
if (!seen.has(k)) { seen.add(k); ordered.push(k); }
});
});
return ordered;
}

function keyExistsInAnyEntry(key, dates, dataMap) {
return dates.some((d) => key in (dataMap[d] || {}));
}

function hasRealValue(key, dates, dataMap) {
return dates.some((d) => getOverall(dataMap[d]?.[key]) !== null);
}

function metricPassesToggle(key, dates, dataMap, contractualOn, bonusOn, bonusQualifierOn) {
if (!contractualOn && !bonusOn && !bonusQualifierOn) return true;
const isFlat = !dates.some((d) => isNested(dataMap[d]?.[key]));
if (isFlat) return true;
if (contractualOn    && !dates.some((d) => getBoolFlag(dataMap[d]?.[key], “Contractual”)))       return false;
if (bonusOn          && !dates.some((d) => getBoolFlag(dataMap[d]?.[key], “Bonus and Penalty”))) return false;
if (bonusQualifierOn && !dates.some((d) => getBoolFlag(dataMap[d]?.[key], “Bonus Qualifier”)))   return false;
return true;
}

/* ─── ToggleSwitch ───────────────────────────────────────────────*/
function ToggleSwitch({ label, value, onChange }) {
return (
<div onClick={() => onChange(!value)} style={{
display:“flex”, flexDirection:“column”, alignItems:“center”,
gap:3, cursor:“pointer”, userSelect:“none”, flexShrink:0,
}}>
<span style={{
fontSize:10, fontWeight:600, lineHeight:1.25, textAlign:“center”,
color: value ? “#153a6f” : “#888”, whiteSpace:“nowrap”,
}}>{label}</span>
<div style={{
width:34, height:18, borderRadius:9,
background: value ? “#153a6f” : “#d9d9d9”,
position:“relative”, transition:“background 0.2s”,
}}>
<div style={{
position:“absolute”, top:3,
left: value ? 17 : 3,
width:12, height:12, borderRadius:“50%”,
background:”#fff”, transition:“left 0.2s”,
boxShadow:“0 1px 3px rgba(0,0,0,0.25)”,
}} />
</div>
</div>
);
}

/* =============================================================
COMPONENT
============================================================= */
export default function KPIDashboard() {
const [loading,          setLoading]          = useState(false);
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
const [tileIndex,        setTileIndex]        = useState(0);
const [isFilterLoaded,   setIsFilterLoaded]   = useState(false);
const [error,            setError]            = useState(null);

/* multi-select filter values — all stored as arrays */
const [filters, setFilters] = useState({
year_type:    “Calendar Year”,
year:         CURRENT_YEAR,
month:        [CURRENT_MONTH],
geo:          [“ALL”],
program:      [“ALL”],
lob:          [“ALL”],
supervisor:   [“ALL”],
tenure_unit:  [“ALL”],
});

const activeViewByRef = React.useRef(viewBy);

/* ── endpoint helpers ────────────────────────────────────── */
const dataEndpoint = (vb) => {
if (vb === “day”)  return “/get_concora_daily_data/”;
if (vb === “week”) return “/get_concora_weekly_data/”;
return “/get_concora_monthly_data/”;
};
const filterEndpoint = (vb) => {
if (vb === “day”)  return “/get_concora_daily_filters/”;
if (vb === “week”) return “/get_concora_weekly_filters/”;
return “/get_concora_monthly_filters/”;
};

/* ── payload — arrays sent as-is ────────────────────────── */
const defaultFilterPayload = {
year_type: “Calendar Year”, year: 0,
month: [“ALL”], geo: [“ALL”], program: [“ALL”],
lob: [“ALL”], supervisor: [“ALL”], tenure_unit: [“ALL”],
};

const payload = useMemo(() => ({
year_type:   filters.year_type,
year:        filters.year,
month:       filters.month,
geo:         filters.geo,
program:     filters.program,
lob:         filters.lob,
supervisor:  filters.supervisor,
tenure_unit: filters.tenure_unit,
}), [filters]);

/* ── load filters ─────────────────────────────────────────*/
useEffect(() => {
const thisViewBy = viewBy;
activeViewByRef.current = thisViewBy;
setIsFilterLoaded(false);
setLoading(true);
axios.post(API_BASE + filterEndpoint(thisViewBy), defaultFilterPayload)
.then((res) => {
if (activeViewByRef.current !== thisViewBy) return;
const data = res.data || {};
setFilterOptions(data);
setFilters((prev) => ({
…prev,
year_type:   data.year_type?.includes(“Calendar Year”) ? “Calendar Year” : (data.year_type?.[0] ?? “Calendar Year”),
year:        CURRENT_YEAR,
month:       [CURRENT_MONTH],
geo:         [“ALL”],
program:     [“ALL”],
lob:         [“ALL”],
supervisor:  data.supervisor?.[0] ? [data.supervisor[0]] : [“ALL”],
tenure_unit: data.tenure_unit?.[0] ? [data.tenure_unit[0]] : [“ALL”],
}));
setIsFilterLoaded(true);
})
.catch(() => {
if (activeViewByRef.current !== thisViewBy) return;
setError(“Failed to load filters. Please try again.”);
})
.finally(() => { if (activeViewByRef.current === thisViewBy) setLoading(false); });
}, [viewBy]);

/* ── load data ───────────────────────────────────────────*/
useEffect(() => {
if (!isFilterLoaded) return;
const thisViewBy = viewBy;
setLoading(true);
setError(null);
axios.post(API_BASE + dataEndpoint(thisViewBy), payload)
.then((res) => {
if (activeViewByRef.current !== thisViewBy) return;
if (!res.data || Object.keys(res.data).length === 0) {
setColumns([]); setAllTableRows([]); setAllTileData([]);
setError(“No data available for the selected filters.”);
return;
}
buildDynamicTable(res.data, thisViewBy);
})
.catch(() => {
if (activeViewByRef.current !== thisViewBy) return;
setColumns([]); setAllTableRows([]); setAllTileData([]);
setError(“Failed to load data. Please check your connection and try again.”);
})
.finally(() => { if (activeViewByRef.current === thisViewBy) setLoading(false); });
}, [filters, viewBy, isFilterLoaded]);

/* ═══════════════════════════════════════════════════════════
buildDynamicTable
═══════════════════════════════════════════════════════════*/
const buildDynamicTable = (response, currentViewBy = viewBy) => {
const tileObj            = response.tile || {};
const { dates, dataMap } = parseDateEntries(response);
if (dates.length === 0) {
setColumns([]); setAllTableRows([]); setAllTileData([]); return;
}
setChartDates(dates);
setChartDataMap(dataMap);

```
const metricKeys = discoverMetricKeys(dates, dataMap);
const activeKeys = metricKeys.filter((key) => keyExistsInAnyEntry(key, dates, dataMap));

/* ── COLUMNS — target pulled from first real entry ── */
const getMetricTarget = (key) => {
  for (const d of dates) {
    const t = getTarget(dataMap[d]?.[key]);
    if (t !== "-") return t;
  }
  return "-";
};

const cols = [
  {
    title: "Metric", dataIndex: "metric", width: 260, fixed: "left",
    render: (text) => <span style={{ fontWeight:500, fontSize:13 }}>{text}</span>,
  },
  { title: "Target", dataIndex: "target", width: 90, align: "center" },
  ...dates.map((date) => ({
    title: date, dataIndex: date, align: "center",
    render: (val) => (
      <div className="heat-cell">
        {val === null || val === undefined || val === "" ? "-" : val}
      </div>
    ),
  })),
];
setColumns(cols);

/* ── ROWS — include target from response ── */
const rows = activeKeys.map((key) => {
  const row = { key, metric: key, target: getMetricTarget(key) };
  dates.forEach((date) => { row[date] = getCellDisplay(dataMap[date]?.[key]); });
  return row;
});
setAllTableRows(rows);

/* ── TILES — color + target from response ── */
const graphDates = currentViewBy === "day" ? dates : dates.slice(-12);

const tiles = activeKeys
  .filter((key) => hasRealValue(key, dates, dataMap))
  .map((key) => {
    /* tile value: prefer tile obj, else most recent real value */
    let tileValue = getOverall(tileObj?.[key]);
    if (tileValue === null) {
      for (let i = dates.length - 1; i >= 0; i--) {
        const v = getOverall(dataMap[dates[i]]?.[key]);
        if (v !== null) { tileValue = v; break; }
      }
    }

    /* color: from tile obj first, else from most recent date entry */
    let color = getColor(tileObj?.[key]);
    if (!color || color === "#8c8c8c") {
      for (const d of dates) {
        const c = getColor(dataMap[d]?.[key]);
        if (c && c !== "#8c8c8c") { color = c; break; }
      }
    }

    /* target: from tile obj or first real date entry */
    let target = getTarget(tileObj?.[key]);
    if (target === "-") target = getMetricTarget(key);

    /* graph series using response color per point */
    const series = graphDates.map((d) => {
      const raw = dataMap[d]?.[key];
      const v   = getOverall(raw);
      const c   = getColor(raw) || color;
      return {
        value: v !== null && !isNaN(Number(v)) ? Number(v) : null,
        color: c,
      };
    });

    /* unit detection */
    const sampleRaw = tileObj?.[key] ?? dataMap[dates[dates.length - 1]]?.[key];
    const overallStr = String(extractField(sampleRaw, "Overall") ?? sampleRaw ?? "");
    const unit = overallStr.includes("%") ? "%" : "";

    const contractual    = dates.some((d) => getBoolFlag(dataMap[d]?.[key], "Contractual"));
    const bonus          = dates.some((d) => getBoolFlag(dataMap[d]?.[key], "Bonus and Penalty"));
    const bonusQualifier = dates.some((d) => getBoolFlag(dataMap[d]?.[key], "Bonus Qualifier"));
    const flat           = !dates.some((d) => isNested(dataMap[d]?.[key]));

    return {
      key, label: key, color, unit,
      value: tileValue, target, series,
      dates: graphDates,
      contractual, bonus, bonusQualifier, flat,
    };
  });

setAllTileData(tiles);
setTileIndex(0);
```

};

/* ── filtered data ───────────────────────────────────────*/
const tableData = useMemo(() => {
if (!contractualOn && !bonusOn && !bonusQualifierOn) return allTableRows;
return allTableRows.filter((row) =>
metricPassesToggle(row.key, chartDates, chartDataMap, contractualOn, bonusOn, bonusQualifierOn)
);
}, [contractualOn, bonusOn, bonusQualifierOn, allTableRows, chartDates, chartDataMap]);

const filteredTiles = useMemo(() => {
if (!contractualOn && !bonusOn && !bonusQualifierOn) return allTileData;
return allTileData.filter((tile) => {
if (tile.flat) return true;
if (contractualOn    && !tile.contractual)    return false;
if (bonusOn          && !tile.bonus)           return false;
if (bonusQualifierOn && !tile.bonusQualifier)  return false;
return true;
});
}, [contractualOn, bonusOn, bonusQualifierOn, allTileData]);

useEffect(() => { setTileIndex(0); }, [filteredTiles.length]);

const totalPages = Math.ceil(filteredTiles.length / TILES_PER_PAGE);
const pagedTiles = filteredTiles.slice(
tileIndex * TILES_PER_PAGE,
tileIndex * TILES_PER_PAGE + TILES_PER_PAGE
);

const updateFilter = (key, val) =>
setFilters((prev) => ({ …prev, [key]: val }));

/* ═══════════════════════════════════════════════════════════
RENDER
═══════════════════════════════════════════════════════════*/
return (
<>
{loading && <LoaderOverlay show={loading} />}
<div style={{ padding:4, opacity: loading ? 0.5 : 1 }}>
<style>{`.filter-col { display: flex; flex-direction: column; min-width: 0; flex: 1; } .filter-col label { font-size: 11px; font-weight: 700; text-align: center; color: #333; margin-bottom: 3px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; } .kpi-filter-row .ant-select-selector { font-size: 11px !important; padding: 0 6px !important; height: 26px !important; } .kpi-filter-row .ant-select-selection-item, .kpi-filter-row .ant-select-selection-placeholder { line-height: 24px !important; font-size: 11px !important; } .kpi-filter-row .ant-select-arrow { font-size: 10px !important; } .kpi-filter-row .ant-select-selection-overflow { flex-wrap: nowrap; overflow: hidden; } .heat-cell { background: #d7f5e9; padding: 4px 6px; border-radius: 4px; text-align: center; font-size: 12px; } .ant-table-thead > tr > th { background: #153a6f !important; color: white !important; font-weight: 600; font-size: 12px; } .kpi-card { background: #fff; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.08); padding: 12px 14px 10px 14px; height: 220px; box-sizing: border-box; display: flex; flex-direction: column; min-width: 0; flex: 1; } .kpi-title { font-size: 13px; font-weight: 700; color: #333; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-bottom: 4px; } .kpi-value { font-size: 26px; font-weight: 800; line-height: 1.1; margin-bottom: 4px; } .kpi-target-bar-bg { height: 4px; background: #f0f0f0; border-radius: 4px; margin-bottom: 2px; overflow: hidden; } .kpi-target-text { font-size: 11px; color: #aaa; margin-bottom: 4px; } .nav-btn { width: 38px; height: 38px; border-radius: 50%; border: 1.5px solid #d0d0d0; background: #fff; display: flex; align-items: center; justify-content: center; cursor: pointer; box-shadow: 0 2px 6px rgba(0,0,0,0.1); transition: all 0.2s; flex-shrink: 0; padding: 0; } .nav-btn:hover:not(:disabled) { background: #f0f0f0; border-color: #999; } .nav-btn:disabled { opacity: 0.3; cursor: not-allowed; }`}</style>

```
    {/* ═══ TOP BAR ═════════════════════════════════════════ */}
    <div style={{ display:"flex", gap:10, alignItems:"stretch" }}>

      {/* FILTER PANEL */}
      <div
        className="kpi-filter-row"
        style={{
          background:"#fff", padding:"10px 14px", borderRadius:10,
          boxShadow:"0 2px 8px rgba(0,0,0,0.08)", flex:1, minWidth:0,
          display:"flex", flexDirection:"row", alignItems:"flex-end",
          gap:8, flexWrap:"nowrap",
        }}
      >
        {/* year type — single select */}
        {viewBy !== "week" && viewBy !== "day" && (
          <div className="filter-col">
            <label>YEAR TYPE</label>
            <Select value={filters.year_type} size="small"
              style={{ width:"100%" }} popupMatchSelectWidth={false}
              styles={{ popup:{ minWidth:160 } }}
              onChange={(v) => updateFilter("year_type", v)}>
              {(filterOptions.year_type || []).map((v) => <Option key={v} value={v}>{v}</Option>)}
            </Select>
          </div>
        )}

        {/* year — single select */}
        {viewBy !== "week" && (
          <div className="filter-col">
            <label>YEAR</label>
            <Select value={filters.year} size="small"
              style={{ width:"100%" }} popupMatchSelectWidth={false}
              styles={{ popup:{ minWidth:120 } }}
              onChange={(v) => updateFilter("year", v)}>
              {(filterOptions.year || []).map((v) => <Option key={v} value={v}>{v}</Option>)}
            </Select>
          </div>
        )}

        {/* month — multi-select */}
        {viewBy !== "month" && viewBy !== "week" && (
          <div className="filter-col">
            <label>MONTH</label>
            <Select mode="multiple" value={filters.month} size="small"
              style={{ width:"100%" }} popupMatchSelectWidth={false}
              styles={{ popup:{ minWidth:160 } }} maxTagCount={1}
              onChange={(v) => updateFilter("month", v)}>
              {(filterOptions.month || []).map((v) => <Option key={v} value={v}>{v}</Option>)}
            </Select>
          </div>
        )}

        {/* geo — multi-select */}
        <div className="filter-col">
          <label>GEOGRAPHY</label>
          <Select mode="multiple" value={filters.geo} size="small"
            style={{ width:"100%" }} popupMatchSelectWidth={false}
            styles={{ popup:{ minWidth:160 } }} maxTagCount={1}
            onChange={(v) => updateFilter("geo", v)}>
            {(filterOptions.geo || []).map((v) => <Option key={v} value={v}>{v}</Option>)}
          </Select>
        </div>

        {/* program — multi-select */}
        <div className="filter-col">
          <label>JOB CODE</label>
          <Select mode="multiple" value={filters.program} size="small"
            style={{ width:"100%" }} popupMatchSelectWidth={false}
            styles={{ popup:{ minWidth:160 } }} maxTagCount={1}
            onChange={(v) => updateFilter("program", v)}>
            {(filterOptions.program || []).map((v) => <Option key={v} value={v}>{v}</Option>)}
          </Select>
        </div>

        {/* lob — multi-select */}
        <div className="filter-col">
          <label>LINE OF BUSINESS</label>
          <Select mode="multiple" value={filters.lob} size="small"
            style={{ width:"100%" }} popupMatchSelectWidth={false}
            styles={{ popup:{ minWidth:160 } }} maxTagCount={1}
            onChange={(v) => updateFilter("lob", v)}>
            {(filterOptions.lob || []).map((v) => <Option key={v} value={v}>{v}</Option>)}
          </Select>
        </div>

        {/* supervisor — multi-select */}
        <div className="filter-col">
          <label>SUPERVISOR</label>
          <Select mode="multiple" value={filters.supervisor} size="small"
            style={{ width:"100%" }} popupMatchSelectWidth={false}
            styles={{ popup:{ minWidth:160 } }} maxTagCount={1}
            onChange={(v) => updateFilter("supervisor", v)}>
            {(filterOptions.supervisor || []).map((v) => <Option key={v} value={v}>{v}</Option>)}
          </Select>
        </div>

        {/* tenure_unit — multi-select */}
        <div className="filter-col">
          <label>TENURE</label>
          <Select mode="multiple" value={filters.tenure_unit} size="small"
            style={{ width:"100%" }} popupMatchSelectWidth={false}
            styles={{ popup:{ minWidth:140 } }} maxTagCount={1}
            onChange={(v) => updateFilter("tenure_unit", v)}>
            {(filterOptions.tenure_unit || []).map((v) => <Option key={v} value={v}>{v}</Option>)}
          </Select>
        </div>

        {/* divider */}
        <div style={{ width:1, alignSelf:"stretch", background:"#ebebeb", flexShrink:0, margin:"0 2px" }} />

        {/* toggle switches */}
        <ToggleSwitch label="Contractual"    value={contractualOn}    onChange={setContractualOn} />
        <ToggleSwitch label={<>Bonus &<br/>Penalty</>} value={bonusOn} onChange={setBonusOn} />
        <ToggleSwitch label={<>Bonus<br/>Qualifier</>} value={bonusQualifierOn} onChange={setBonusQualifierOn} />
      </div>

      {/* VIEW BY */}
      <div style={{
        display:"flex", flexDirection:"column", justifyContent:"center",
        alignItems:"center", gap:5, background:"#fff",
        padding:"10px 14px", borderRadius:10,
        boxShadow:"0 2px 8px rgba(0,0,0,0.08)", flexShrink:0,
      }}>
        <span style={{ fontSize:11, fontWeight:700, color:"#333" }}>View By</span>
        <Segmented
          options={[
            { label:"Day",   value:"day"   },
            { label:"Week",  value:"week"  },
            { label:"Month", value:"month" },
          ]}
          value={viewBy}
          onChange={(val) => setViewBy(val)}
        />
      </div>
    </div>

    {/* error banner */}
    {error && (
      <div style={{
        margin:"12px 0 6px", padding:"10px 16px",
        background:"#fff2f0", border:"1px solid #ffccc7",
        borderRadius:8, color:"#cf1322", fontSize:13,
        display:"flex", alignItems:"center", gap:8,
      }}>
        <span style={{ fontSize:16 }}>⚠️</span>{error}
      </div>
    )}

    {/* ═══ KPI TILE CAROUSEL ══════════════════════════════ */}
    {filteredTiles.length > 0 && (
      <>
        <div style={{ display:"flex", alignItems:"center", gap:10, margin:"16px 0 6px" }}>
          <button className="nav-btn" disabled={tileIndex === 0}
            onClick={() => setTileIndex((p) => Math.max(0, p - 1))}>
            <LeftOutlined style={{ fontSize:16, color:"#444" }} />
          </button>

          <div style={{ flex:1, display:"flex", gap:12 }}>
            {pagedTiles.map((tile) => renderKpiCard(tile))}
            {Array.from({ length: TILES_PER_PAGE - pagedTiles.length }).map((_, i) => (
              <div key={`sp-${i}`} style={{ flex:1 }} />
            ))}
          </div>

          <button className="nav-btn" disabled={tileIndex >= totalPages - 1}
            onClick={() => setTileIndex((p) => Math.min(totalPages - 1, p + 1))}>
            <RightOutlined style={{ fontSize:16, color:"#444" }} />
          </button>
        </div>

        {totalPages > 1 && (
          <div style={{ display:"flex", justifyContent:"center", gap:6, marginBottom:10 }}>
            {Array.from({ length: totalPages }).map((_, i) => (
              <div key={i} onClick={() => setTileIndex(i)} style={{
                width: i === tileIndex ? 20 : 8, height:8, borderRadius:4,
                background: i === tileIndex ? "#153a6f" : "#d9d9d9",
                cursor:"pointer", transition:"all 0.3s",
              }} />
            ))}
          </div>
        )}
      </>
    )}

    {/* ═══ TABLE ══════════════════════════════════════════ */}
    <div style={{ marginTop:8 }}>
      {loading ? (
        <div style={{ textAlign:"center", padding:40 }}><Spin /></div>
      ) : (
        <Table
          columns={columns}
          dataSource={tableData}
          pagination={false}
          bordered
          size="small"
          scroll={{ x:"max-content", y:320 }}
          rowKey="key"
        />
      )}
    </div>
  </div>
</>
```

);

/* ═══════════════════════════════════════════════════════════
renderKpiCard
═══════════════════════════════════════════════════════════*/
function renderKpiCard(tile) {
const { label, color, unit, value, target, series, dates: gdates } = tile;
const display = (value === null || value === undefined) ? “–” : value;

```
/* target bar width */
const targetNum = parseFloat(String(target).replace("%", ""));
const valueNum  = typeof display === "number" ? display : parseFloat(String(display).replace("%",""));
const barPct    = (!isNaN(targetNum) && !isNaN(valueNum) && targetNum > 0)
                  ? Math.min((valueNum / targetNum) * 100, 100)
                  : 0;

/* graph */
const cleanSeries = series.map((pt) => ({
  value: pt.value !== null && !isNaN(Number(pt.value)) ? Number(pt.value) : null,
  color: pt.color || color,
}));
const validNums = cleanSeries.filter((pt) => pt.value !== null).map((pt) => pt.value);
const hasGraph  = validNums.length > 0;
const maxVal    = hasGraph ? Math.max(...validNums) : 0;
const scaleMax  = maxVal > 0 ? Math.ceil(maxVal / 10) * 10 : 10;
const GRAPH_H   = 60;

return (
  <div className="kpi-card" key={label}>

    {/* TITLE */}
    <div className="kpi-title" title={label}>{label}</div>

    {/* VALUE */}
    <div className="kpi-value" style={{ color }}>
      {display}{display !== "--" && unit ? ` ${unit}` : ""}
    </div>

    {/* TARGET BAR */}
    <div className="kpi-target-bar-bg">
      <div style={{ width:`${barPct}%`, background:color, height:"100%" }} />
    </div>

    {/* TARGET TEXT — tight spacing */}
    <div className="kpi-target-text">Target: {target}</div>

    {/* GRAPH — immediately after target, no extra gap */}
    <div style={{ flex:1, display:"flex", flexDirection:"column", justifyContent:"flex-end" }}>
      {hasGraph ? (
        <>
          <div style={{ display:"flex", alignItems:"flex-end", gap:3 }}>
            {/* Y AXIS */}
            <div style={{
              display:"flex", flexDirection:"column",
              justifyContent:"space-between",
              height:GRAPH_H, flexShrink:0, marginRight:3,
            }}>
              <span style={{ fontSize:10, color:"#999", lineHeight:1 }}>{scaleMax}</span>
              <span style={{ fontSize:10, color:"#999", lineHeight:1 }}>{Math.round(scaleMax / 2)}</span>
              <span style={{ fontSize:10, color:"#999", lineHeight:1 }}>0</span>
            </div>

            {/* BARS — pinned to bottom */}
            <div style={{
              flex:1, height:GRAPH_H,
              display:"flex", alignItems:"flex-end",
              gap:2, overflow:"hidden",
            }}>
              {cleanSeries.map((pt, i) => {
                const barH = pt.value !== null
                  ? Math.max((pt.value / scaleMax) * GRAPH_H, 2)
                  : 0;
                return (
                  <div
                    key={i}
                    title={pt.value !== null ? `${pt.value}${unit}` : "No data"}
                    style={{
                      flex:1, height:barH,
                      background: pt.value !== null ? pt.color : "transparent",
                      borderRadius:"2px 2px 0 0",
                      transition:"height 0.3s ease",
                      minWidth:2,
                    }}
                  />
                );
              })}
            </div>
          </div>

          {/* X AXIS */}
          <div style={{ display:"flex", paddingLeft:22, marginTop:3 }}>
            {gdates.map((d, i) => {
              let xLabel = "";
              if (viewBy === "day") {
                if (i === Math.floor(gdates.length / 2))
                  xLabel = new Date(d).toLocaleDateString("en", { month:"short" });
              } else if (viewBy === "week") {
                // extract week number from "week2 (04 Jan - 10 Jan)" or "W2"
                const m = String(d).match(/(?:week|W)(\d{1,2})/i);
                xLabel = m ? `W${m[1]}` : d;
              } else {
                xLabel = typeof d === "string"
                  ? d.substring(0, 3)
                  : new Date(d).toLocaleDateString("en-IN", { month:"short" });
              }
              return (
                <span key={d} style={{
                  flex:1, textAlign:"center",
                  fontSize:10, color:"#999",
                  whiteSpace:"nowrap", overflow:"hidden",
                }}>
                  {xLabel}
                </span>
              );
            })}
          </div>
        </>
      ) : (
        <div style={{
          height: GRAPH_H + 16,
          display:"flex", alignItems:"center", justifyContent:"center",
          fontSize:11, color:"#ccc",
        }}>
          No Data
        </div>
      )}
    </div>
  </div>
);
```

}
}
