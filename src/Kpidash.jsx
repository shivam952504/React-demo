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

const PALETTE = [
“#d4380d”,”#389e0d”,”#2f54eb”,”#fa8c16”,”#722ed1”,
“#eb2f96”,”#fa541c”,”#13c2c2”,”#52c41a”,”#1890ff”,
“#f5222d”,”#faad14”,”#a0d911”,”#08979c”,”#531dab”,
“#c41d7f”,”#7cb305”,”#006d75”,”#9254de”,”#ff7a45”,
];

const TILES_PER_PAGE = 5;

/* ─── helpers ───────────────────────────────────────────────────── */
function getOverallDisplay(raw) {
if (raw === undefined || raw === null) return null;
if (typeof raw === “object” && !Array.isArray(raw)) {
const v =
raw[“Overall”]            !== undefined ? raw[“Overall”] :
raw[“overall”]            !== undefined ? raw[“overall”] :
raw[“overall_percentage”] !== undefined ? raw[“overall_percentage”] :
null;
return v === null ? null : getOverallDisplay(v);
}
if (typeof raw === “boolean”) return null;
const s = String(raw).trim();
if (s === “” || s === “-” || s === “–” || s.toLowerCase() === “nan”) return null;
const n = parseFloat(s.replace(”%”, “”));
return isNaN(n) ? s : n;
}

function getCellDisplay(raw) {
const v = getOverallDisplay(raw);
return v !== null ? v : “-”;
}

function isNested(raw) {
return (
raw !== null && typeof raw === “object” && !Array.isArray(raw) &&
(“Overall” in raw || “overall” in raw || “overall_percentage” in raw)
);
}

function getBoolFlag(raw, flag) {
if (!raw || typeof raw !== “object”) return null;
return flag in raw ? raw[flag] === true : null;
}

function parseDateEntries(response) {
const nonTileKeys = Object.keys(response).filter((k) => k !== “tile”);
const firstEntry  = response[nonTileKeys[0]];
let dates = [], dataMap = {};

const looksLikeEntry = (v) =>
v && typeof v === “object” && !Array.isArray(v) &&
Object.values(v).some(
(x) =>
typeof x === “string” || typeof x === “number” || typeof x === “boolean” ||
(typeof x === “object” && x !== null &&
(“Overall” in x || “overall” in x || “overall_percentage” in x))
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
dates = […new Set(dates)].sort();
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
return dates.some((d) => getOverallDisplay(dataMap[d]?.[key]) !== null);
}

/* ─────────────────────────────────────────────────────────────────
metricPassesToggle
contractualOn, bonusOn, bonusQualifierOn: independent booleans
All OFF  → show everything
Some ON  → nested metric must have ALL active flags = true
Flat fields always pass
──────────────────────────────────────────────────────────────────*/
function metricPassesToggle(key, dates, dataMap, contractualOn, bonusOn, bonusQualifierOn) {
if (!contractualOn && !bonusOn && !bonusQualifierOn) return true;

const isFlat = !dates.some((d) => isNested(dataMap[d]?.[key]));
if (isFlat) return true;

const hasC  = dates.some((d) => getBoolFlag(dataMap[d]?.[key], “Contractual”) === true);
const hasB  = dates.some((d) => getBoolFlag(dataMap[d]?.[key], “Bonus and Penalty”) === true);
const hasBQ = dates.some((d) => getBoolFlag(dataMap[d]?.[key], “Bonus Qualifier”) === true);

if (contractualOn  && !hasC)  return false;
if (bonusOn        && !hasB)  return false;
if (bonusQualifierOn && !hasBQ) return false;
return true;
}

/* ─── ToggleSwitch ───────────────────────────────────────────────*/
function ToggleSwitch({ label, value, onChange }) {
return (
<div
onClick={() => onChange(!value)}
style={{
display: “flex”,
flexDirection: “column”,
alignItems: “center”,
gap: 3,
cursor: “pointer”,
userSelect: “none”,
flexShrink: 0,
}}
>
<span style={{
fontSize: 9.5,
fontWeight: 600,
color: value ? “#153a6f” : “#888”,
textAlign: “center”,
lineHeight: 1.25,
whiteSpace: “nowrap”,
}}>
{label}
</span>
{/* pill */}
<div style={{
width: 32, height: 17,
borderRadius: 9,
background: value ? “#153a6f” : “#d9d9d9”,
position: “relative”,
transition: “background 0.2s”,
}}>
<div style={{
position: “absolute”,
top: 2.5,
left: value ? 15 : 2.5,
width: 12, height: 12,
borderRadius: “50%”,
background: “#fff”,
transition: “left 0.2s”,
boxShadow: “0 1px 3px rgba(0,0,0,0.25)”,
}} />
</div>
</div>
);
}

/* =============================================================
COMPONENT
============================================================= */
export default function KPIDashboard() {
const [loading,           setLoading]           = useState(false);
const [viewBy,            setViewBy]            = useState(“day”);
const [contractualOn,     setContractualOn]     = useState(false);
const [bonusOn,           setBonusOn]           = useState(false);
const [bonusQualifierOn,  setBonusQualifierOn]  = useState(false);
const [columns,           setColumns]           = useState([]);
const [filterOptions,     setFilterOptions]     = useState({});
const [allTileData,       setAllTileData]       = useState([]);
const [allTableRows,      setAllTableRows]      = useState([]);
const [chartDates,        setChartDates]        = useState([]);
const [chartDataMap,      setChartDataMap]      = useState({});
const [tileIndex,         setTileIndex]         = useState(0);
const [isFilterLoaded,    setIsFilterLoaded]    = useState(false);

const [filters, setFilters] = useState({
year_type:    “Calendar Year”,
year:         CURRENT_YEAR,
month:        CURRENT_MONTH,
geo:          “ALL”,
client_name:  “ALL”,
program:      “ALL”,
lob:          “ALL”,
supervisor:   “ALL”,
tenure_unit:  “days”,
tenure_lower: 0,
tenure_upper: 0,
});

const defaultFilterPayload = {
year_type: “Calendar Year”, year: 0, month: “ALL”,
geo: “ALL”, client_name: “ALL”, program: “ALL”,
lob: “ALL”, supervisor: “ALL”, tenure_unit: “days”,
tenure_lower: 0, tenure_upper: 0,
};

const getDataEndpoint = () => {
if (viewBy === “day”)  return “/get_concora_daily_data/”;
if (viewBy === “week”) return “/get_concora_weekly_data/”;
return “/get_concora_monthly_data/”;
};
const getFilterEndpoint = () => {
if (viewBy === “day”)  return “/get_concora_daily_filters/”;
if (viewBy === “week”) return “/get_concora_weekly_filters/”;
return “/get_concora_monthly_filters/”;
};

const payload = useMemo(() => ({
year: filters.year, year_type: filters.year_type, month: filters.month,
geo: filters.geo, client_name: filters.client_name, program: filters.program,
lob: filters.lob, supervisor: filters.supervisor,
tenure_unit: filters.tenure_unit,
tenure_lower: filters.tenure_lower, tenure_upper: filters.tenure_upper,
}), [filters]);

/* ── load filters ─────────────────────────────────────────── */
useEffect(() => {
setLoading(true);
axios.post(API_BASE + getFilterEndpoint(), defaultFilterPayload)
.then((res) => {
const data = res.data || {};
setFilterOptions(data);
setFilters((prev) => ({
…prev,
year_type:   data.year_type?.includes(“Calendar Year”)
? “Calendar Year” : (data.year_type?.[0] ?? “Calendar Year”),
year:        CURRENT_YEAR,
month:       CURRENT_MONTH,
program:     data.program?.[0]     ?? “ALL”,
supervisor:  data.supervisor?.[0]  ?? “ALL”,
tenure_unit: data.tenure_unit?.[0] ?? “days”,
}));
setIsFilterLoaded(true);
})
.finally(() => setLoading(false));
}, [viewBy]);

/* ── load data ────────────────────────────────────────────── */
useEffect(() => {
if (!isFilterLoaded) return;
setLoading(true);
axios.post(API_BASE + getDataEndpoint(), payload)
.then((res) => buildDynamicTable(res.data))
.finally(() => setLoading(false));
}, [filters, viewBy, isFilterLoaded]);

/* ═══════════════════════════════════════════════════════════
buildDynamicTable
═══════════════════════════════════════════════════════════*/
const buildDynamicTable = (response) => {
if (!response || Object.keys(response).length === 0) {
setColumns([]); setAllTableRows([]); setAllTileData([]); return;
}

```
const tileObj            = response.tile || {};
const { dates, dataMap } = parseDateEntries(response);

if (dates.length === 0) {
  setColumns([]); setAllTableRows([]); setAllTileData([]); return;
}

setChartDates(dates);
setChartDataMap(dataMap);

const metricKeys = discoverMetricKeys(dates, dataMap);
const activeKeys = metricKeys.filter((key) =>
  keyExistsInAnyEntry(key, dates, dataMap)
);

/* COLUMNS */
const cols = [
  {
    title: "Metric", dataIndex: "metric", width: 260, fixed: "left",
    render: (text) => <span style={{ fontWeight: 500, fontSize: 13 }}>{text}</span>,
  },
  { title: "Target", dataIndex: "target", width: 80, align: "center" },
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

/* ALL ROWS */
const rows = activeKeys.map((key) => {
  const row = { key, metric: key, target: "-" };
  dates.forEach((date) => { row[date] = getCellDisplay(dataMap[date]?.[key]); });
  return row;
});
setAllTableRows(rows);

/* ALL TILES */
const graphDates = viewBy === "day" ? dates : dates.slice(-12);
const tiles = activeKeys
  .filter((key) => hasRealValue(key, dates, dataMap))
  .map((key, idx) => {
    let tileValue = getOverallDisplay(tileObj?.[key]);
    if (tileValue === null) {
      for (let i = dates.length - 1; i >= 0; i--) {
        const v = getOverallDisplay(dataMap[dates[i]]?.[key]);
        if (v !== null) { tileValue = v; break; }
      }
    }
    const series = graphDates.map((d) => {
      const v = getOverallDisplay(dataMap[d]?.[key]);
      return v !== null && !isNaN(Number(v)) ? Number(v) : null;
    });
    const sampleDate = dates.find((d) => dataMap[d]?.[key] !== undefined);
    const rawSample  = dataMap[sampleDate]?.[key];
    const rawStr = String(
      isNested(rawSample)
        ? (rawSample?.Overall ?? rawSample?.overall ?? rawSample?.overall_percentage ?? "")
        : (rawSample ?? "")
    );
    const unit           = rawStr.includes("%") ? "%" : "";
    const contractual    = dates.some((d) => getBoolFlag(dataMap[d]?.[key], "Contractual") === true);
    const bonus          = dates.some((d) => getBoolFlag(dataMap[d]?.[key], "Bonus and Penalty") === true);
    const bonusQualifier = dates.some((d) => getBoolFlag(dataMap[d]?.[key], "Bonus Qualifier") === true);
    const flat           = !dates.some((d) => isNested(dataMap[d]?.[key]));

    return {
      key, label: key, color: PALETTE[idx % PALETTE.length],
      unit, value: tileValue, series, dates: graphDates,
      contractual, bonus, bonusQualifier, flat,
    };
  });

setAllTileData(tiles);
setTileIndex(0);
```

};

/* ── filtered data via useMemo ────────────────────────────── */
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
if (contractualOn  && !tile.contractual)    return false;
if (bonusOn        && !tile.bonus)           return false;
if (bonusQualifierOn && !tile.bonusQualifier) return false;
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
<div style={{ padding: 4, opacity: loading ? 0.5 : 1 }}>
<style>{`/* each filter column shrinks equally */ .filter-col { display: flex; flex-direction: column; min-width: 0; flex: 1; } .filter-col label { font-size: 9.5px; font-weight: 600; text-align: center; color: #555; margin-bottom: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; } /* make antd select text smaller so it fits */ .kpi-filter-row .ant-select-selector { font-size: 11px !important; padding: 0 6px !important; height: 26px !important; } .kpi-filter-row .ant-select-selection-item { line-height: 24px !important; font-size: 11px !important; } .kpi-filter-row .ant-select-arrow { font-size: 10px !important; } .heat-cell { background: #d7f5e9; padding: 4px 6px; border-radius: 4px; text-align: center; font-size: 12px; } .ant-table-thead > tr > th { background: #153a6f !important; color: white !important; font-weight: 600; font-size: 12px; } .kpi-card { background: #fff; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.08); padding: 14px 14px 10px 14px; height: 210px; box-sizing: border-box; display: flex; flex-direction: column; min-width: 0; flex: 1; } .kpi-title { font-size: 11px; font-weight: 600; color: #555; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-bottom: 4px; } .kpi-value { font-size: 24px; font-weight: 700; line-height: 1.15; margin-bottom: 5px; } .kpi-target-bar-bg { height: 4px; background: #f0f0f0; border-radius: 4px; margin-bottom: 3px; overflow: hidden; } .kpi-target-text { font-size: 10px; color: #aaa; margin-bottom: 6px; } .nav-btn { width: 30px; height: 30px; border-radius: 50%; border: 1px solid #e0e0e0; background: #fff; display: flex; align-items: center; justify-content: center; cursor: pointer; box-shadow: 0 1px 4px rgba(0,0,0,0.08); transition: all 0.2s; flex-shrink: 0; padding: 0; } .nav-btn:hover:not(:disabled) { background: #f5f5f5; border-color: #aaa; } .nav-btn:disabled { opacity: 0.3; cursor: not-allowed; }`}</style>

```
    {/* ═══ TOP BAR ══════════════════════════════════════════ */}
    <div style={{ display: "flex", gap: 10, alignItems: "stretch" }}>

      {/* ── FILTER PANEL ────────────────────────────────── */}
      <div
        className="kpi-filter-row"
        style={{
          background: "#fff",
          padding: "10px 12px",
          borderRadius: 10,
          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
          flex: 1,
          minWidth: 0,
          display: "flex",
          flexDirection: "row",
          alignItems: "flex-end",
          gap: 8,
          flexWrap: "nowrap",
        }}
      >
        {/* ── dropdown filters ── */}
        {viewBy !== "week" && viewBy !== "day" && renderFilterCol("YEAR TYPE", "year_type")}
        {viewBy !== "week"                     && renderFilterCol("YEAR",           "year")}
        {viewBy !== "month" && viewBy !== "week" && renderFilterCol("MONTH",        "month")}
        {renderFilterCol("GEOGRAPHY",        "geo")}
        {renderFilterCol("CLIENT",           "client_name")}
        {renderFilterCol("JOB CODE",         "program")}
        {renderFilterCol("LINE OF BUSINESS", "lob")}
        {renderFilterCol("TENURE",           "tenure_unit")}
        {renderFilterCol("SUPERVISOR",       "supervisor")}

        {/* ── vertical divider ── */}
        <div style={{
          width: 1, alignSelf: "stretch",
          background: "#ebebeb", flexShrink: 0, margin: "0 2px",
        }} />

        {/* ── 3 toggle switches ── */}
        <ToggleSwitch
          label={<>Contractual</>}
          value={contractualOn}
          onChange={setContractualOn}
        />
        <ToggleSwitch
          label={<>Bonus &<br />Penalty</>}
          value={bonusOn}
          onChange={setBonusOn}
        />
        <ToggleSwitch
          label={<>Bonus<br />Qualifier</>}
          value={bonusQualifierOn}
          onChange={setBonusQualifierOn}
        />
      </div>

      {/* ── VIEW BY ─────────────────────────────────────── */}
      <div style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        gap: 5,
        background: "#fff",
        padding: "10px 14px",
        borderRadius: 10,
        boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
        flexShrink: 0,
      }}>
        <span style={{
          fontSize: 10, fontWeight: 600, color: "#555", textAlign: "center",
        }}>
          View By
        </span>
        <Segmented
          options={[
            { label: "Day",   value: "day"   },
            { label: "Week",  value: "week"  },
            { label: "Month", value: "month" },
          ]}
          value={viewBy}
          onChange={(val) => {
            setIsFilterLoaded(false);
            setViewBy(val);
          }}
        />
      </div>
    </div>

    {/* ═══ KPI TILE CAROUSEL ════════════════════════════════ */}
    {filteredTiles.length > 0 && (
      <>
        <div style={{
          display: "flex", alignItems: "center",
          gap: 8, margin: "16px 0 6px",
        }}>
          <button
            className="nav-btn"
            disabled={tileIndex === 0}
            onClick={() => setTileIndex((p) => Math.max(0, p - 1))}
          >
            <LeftOutlined style={{ fontSize: 12, color: "#555" }} />
          </button>

          <div style={{ flex: 1, display: "flex", gap: 12 }}>
            {pagedTiles.map((tile) => renderKpiCard(tile))}
            {Array.from({ length: TILES_PER_PAGE - pagedTiles.length }).map((_, i) => (
              <div key={`spacer-${i}`} style={{ flex: 1 }} />
            ))}
          </div>

          <button
            className="nav-btn"
            disabled={tileIndex >= totalPages - 1}
            onClick={() => setTileIndex((p) => Math.min(totalPages - 1, p + 1))}
          >
            <RightOutlined style={{ fontSize: 12, color: "#555" }} />
          </button>
        </div>

        {totalPages > 1 && (
          <div style={{
            display: "flex", justifyContent: "center",
            gap: 6, marginBottom: 10,
          }}>
            {Array.from({ length: totalPages }).map((_, i) => (
              <div
                key={i}
                onClick={() => setTileIndex(i)}
                style={{
                  width: i === tileIndex ? 20 : 8, height: 8,
                  borderRadius: 4,
                  background: i === tileIndex ? "#153a6f" : "#d9d9d9",
                  cursor: "pointer", transition: "all 0.3s",
                }}
              />
            ))}
          </div>
        )}
      </>
    )}

    {/* ═══ TABLE ════════════════════════════════════════════ */}
    <div style={{ marginTop: 8 }}>
      {loading ? (
        <div style={{ textAlign: "center", padding: 40 }}><Spin /></div>
      ) : (
        <Table
          columns={columns}
          dataSource={tableData}
          pagination={false}
          bordered
          size="small"
          scroll={{ x: "max-content", y: 320 }}
          rowKey="key"
        />
      )}
    </div>
  </div>
</>
```

);

/* ═══════════════════════════════════════════════════════════
renderFilterCol
═══════════════════════════════════════════════════════════*/
function renderFilterCol(label, key) {
const options = filterOptions[key] || [];
return (
<div className="filter-col" key={key}>
<label>{label}</label>
<Select
value={filters[key]}
style={{ width: “100%” }}
size=“small”
popupMatchSelectWidth={false}
styles={{ popup: { minWidth: 160 } }}
onChange={(v) => updateFilter(key, v)}
>
{options.map((v) => (
<Option key={v} value={v}>{v}</Option>
))}
</Select>
</div>
);
}

/* ═══════════════════════════════════════════════════════════
renderKpiCard
═══════════════════════════════════════════════════════════*/
function renderKpiCard(tile) {
const { label, color, unit, value, series, dates: gdates } = tile;
const display = (value === null || value === undefined) ? “–” : value;

```
const numericSeries = series.map((v) =>
  v !== null && !isNaN(Number(v)) ? Number(v) : null
);
const validNums = numericSeries.filter((v) => v !== null);
const hasGraph  = validNums.length > 0;
const maxVal    = hasGraph ? Math.max(...validNums) : 0;
const scaleMax  = maxVal > 0 ? Math.ceil(maxVal / 10) * 10 : 10;
const GRAPH_H   = 58;

return (
  <div className="kpi-card" key={label}>
    <div className="kpi-title" title={label}>{label}</div>

    <div className="kpi-value" style={{ color }}>
      {display}{display !== "--" && unit ? ` ${unit}` : ""}
    </div>

    <div className="kpi-target-bar-bg">
      <div style={{ width: "0%", background: color, height: "100%" }} />
    </div>
    <div className="kpi-target-text">Target: —</div>

    <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
      {hasGraph ? (
        <>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 3 }}>
            {/* Y axis */}
            <div style={{
              display: "flex", flexDirection: "column",
              justifyContent: "space-between",
              height: GRAPH_H, flexShrink: 0, marginRight: 2,
            }}>
              <span style={{ fontSize: 8, color: "#bbb", lineHeight: 1 }}>{scaleMax}</span>
              <span style={{ fontSize: 8, color: "#bbb", lineHeight: 1 }}>
                {Math.round(scaleMax / 2)}
              </span>
              <span style={{ fontSize: 8, color: "#bbb", lineHeight: 1 }}>0</span>
            </div>
            {/* bars pinned to bottom */}
            <div style={{
              flex: 1, height: GRAPH_H,
              display: "flex", alignItems: "flex-end",
              gap: 2, overflow: "hidden",
            }}>
              {numericSeries.map((v, i) => {
                const barH = v !== null ? Math.max((v / scaleMax) * GRAPH_H, 2) : 0;
                return (
                  <div
                    key={i}
                    title={v !== null ? `${v}${unit}` : "No data"}
                    style={{
                      flex: 1, height: barH,
                      background: v !== null ? color : "transparent",
                      borderRadius: "2px 2px 0 0",
                      transition: "height 0.3s ease",
                      minWidth: 2,
                    }}
                  />
                );
              })}
            </div>
          </div>
          {/* X axis */}
          <div style={{ display: "flex", paddingLeft: 20, marginTop: 2 }}>
            {gdates.map((d, i) => {
              let xLabel = "";
              if (viewBy === "day") {
                if (i === Math.floor(gdates.length / 2))
                  xLabel = new Date(d).toLocaleDateString("en", { month: "short" });
              } else if (viewBy === "week") {
                xLabel = `W${i + 1}`;
              } else {
                xLabel = typeof d === "string"
                  ? d.substring(0, 3)
                  : new Date(d).toLocaleDateString("en-IN", { month: "short" });
              }
              return (
                <span key={d} style={{
                  flex: 1, textAlign: "center",
                  fontSize: 8, color: "#bbb",
                  whiteSpace: "nowrap", overflow: "hidden",
                }}>
                  {xLabel}
                </span>
              );
            })}
          </div>
        </>
      ) : (
        <div style={{
          height: GRAPH_H + 14,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 11, color: "#ccc",
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
