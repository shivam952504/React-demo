import React, { useEffect, useState, useMemo, useRef } from “react”;
import axios from “axios”;
import { Select, Table, Segmented, Card, Row, Col, Spin } from “antd”;
import { LeftOutlined, RightOutlined } from “@ant-design/icons”;
import LoaderOverlay from “../loader/LoaderOverlay”;

const { Option } = Select;
const API_BASE = “http://localhost:9009/api”;

/* ── helper: get current month name ── */
const MONTH_NAMES = [
“January”,“February”,“March”,“April”,“May”,“June”,
“July”,“August”,“September”,“October”,“November”,“December”,
];
const CURRENT_YEAR  = new Date().getFullYear();          // e.g. 2026
const CURRENT_MONTH = MONTH_NAMES[new Date().getMonth()]; // e.g. “March”

export default function KPIDashboard() {
const [loading,          setLoading]          = useState(false);
const [viewBy,           setViewBy]           = useState(“day”);
const [columns,          setColumns]          = useState([]);
const [tableData,        setTableData]        = useState([]);
const [filterOptions,    setFilterOptions]    = useState({});
const [tileData,         setTileData]         = useState([]);   // array of { title, value, unit, series, dates }
const [tileIndex,        setTileIndex]        = useState(0);    // current page for tile carousel
const [chartDates,       setChartDates]       = useState([]);
const [chartDataMap,     setChartDataMap]     = useState({});
const [isFilterLoaded,   setIsFilterLoaded]   = useState(false);

const TILES_PER_PAGE = 5;

/* ── default filters: current year + current month ── */
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
year_type:    “Calendar Year”,
year:         0,
month:        “ALL”,
geo:          “ALL”,
client_name:  “ALL”,
program:      “ALL”,
lob:          “ALL”,
supervisor:   “ALL”,
tenure_unit:  “days”,
tenure_lower: 0,
tenure_upper: 0,
};

/* ––––– ENDPOINTS ––––– */
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

/* ––––– PAYLOAD ––––– */
const payload = useMemo(() => ({
year:         filters.year,
year_type:    filters.year_type,
month:        filters.month,
geo:          filters.geo,
client_name:  filters.client_name,
program:      filters.program,
lob:          filters.lob,
supervisor:   filters.supervisor,
tenure_unit:  filters.tenure_unit,
tenure_lower: filters.tenure_lower,
tenure_upper: filters.tenure_upper,
}), [filters]);

/* ––––– LOAD FILTERS ––––– */
useEffect(() => {
setLoading(true);
axios.post(API_BASE + getFilterEndpoint(), defaultFilterPayload)
.then((res) => {
const data = res.data || {};
setFilterOptions(data);
/* keep year = current year, month = current month as defaults */
setFilters((prev) => ({
…prev,
year_type:   data.year_type?.includes(“Calendar Year”) ? “Calendar Year” : (data.year_type?.[0] ?? “Calendar Year”),
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

/* ––––– LOAD DATA ––––– */
useEffect(() => {
if (!isFilterLoaded) return;
setLoading(true);
axios.post(API_BASE + getDataEndpoint(), payload)
.then((res) => {
buildDynamicTable(res.data);
})
.finally(() => setLoading(false));
}, [filters, viewBy, isFilterLoaded]);

/* ============================================================
safeVal — null for empty/dash, number or raw string otherwise
============================================================ */
const safeVal = (v) => {
if (v === undefined || v === null) return null;
const s = String(v).trim();
if (s === “” || s === “-” || s === “–” || s.toLowerCase() === “nan”) return null;
const n = parseFloat(s.replace(”%”, “”));
return isNaN(n) ? s : n;
};

/* ============================================================
MASTER METRIC MAP
extract(entry) → raw value from response (undefined = key absent)
============================================================ */
const METRIC_MAP = [
{ label: “AHT (CS)”,                    key: “AHT”,                      color: “#d4380d”, unit: “sec”, extract: (e) => e?.AHT },
{ label: “CSAT (CS)”,                   key: “CSAT”,                     color: “#389e0d”, unit: “%”,   extract: (e) => e?.CSAT?.csat_score },
{ label: “Case Quality”,                key: “case_quality”,             color: “#2f54eb”, unit: “%”,   extract: (e) => e?.case_quality?.overall_percentage },
{ label: “Overall Adherence”,           key: “Adherence”,                color: “#fa8c16”, unit: “%”,   extract: (e) => e?.Adherence },
{ label: “Production Hours”,            key: “ProductionHours”,          color: “#2f54eb”, unit: “”,    extract: (e) => e?.ProductionHours },
{ label: “Absenteeism %”,               key: “Absenteeism”,              color: “#722ed1”, unit: “%”,   extract: (e) => e?.Absenteeism },
{ label: “Shrinkage %”,                 key: “Shrinkage”,                color: “#eb2f96”, unit: “%”,   extract: (e) => e?.Shrinkage },
{ label: “Attrition %”,                 key: “Attrition”,                color: “#fa541c”, unit: “%”,   extract: (e) => e?.Attrition },
{ label: “Overall Call Quality”,        key: “OverallCallQuality”,       color: “#13c2c2”, unit: “%”,   extract: (e) => e?.[“Overall Call Quality”] },
{ label: “Call Quality Compliance”,     key: “CallQualityCompliance”,    color: “#52c41a”, unit: “%”,   extract: (e) => e?.[“Call Quality Compliance”] },
{ label: “Call Quality Service”,        key: “CallQualityService”,       color: “#1890ff”, unit: “%”,   extract: (e) => e?.[“Call Quality Service”] },
{ label: “Formal Substained Complaints”,key: “FormalSubstainedComplaints”,color:”#f5222d”, unit: “”,   extract: (e) => e?.[“Formal Substained Complaints”] },
{ label: “Call Quality Overall %”,      key: “CallQualityOverall”,       color: “#faad14”, unit: “%”,   extract: (e) => e?.CallQuality?.case_quality?.overall_percentage },
];

/* ============================================================
isFieldPresent — key exists in ANY date entry
============================================================ */
const isFieldPresent = (metric, dates, dataMap) =>
dates.some((d) => {
const entry = dataMap[d];
if (!entry) return false;
return metric.extract(entry) !== undefined;
});

/* ============================================================
hasRealValue — at least one date has a non-dash real value
Used to decide if a TILE should show
============================================================ */
const hasRealValue = (metric, dates, dataMap) =>
dates.some((d) => {
const entry = dataMap[d];
if (!entry) return false;
return safeVal(metric.extract(entry)) !== null;
});

/* ============================================================
BUILD DYNAMIC TABLE
============================================================ */
const buildDynamicTable = (response) => {
if (!response || Object.keys(response).length === 0) {
setColumns([]); setTableData([]); setTileData([]); return;
}

let dates   = [];
let dataMap = {};

const nonTileKeys = Object.keys(response).filter((k) => k !== "tile");
const firstEntry  = response[nonTileKeys[0]];

if (firstEntry && typeof firstEntry === "object" && firstEntry.CSAT) {
  dates = nonTileKeys;
  nonTileKeys.forEach((d) => { dataMap[d] = response[d]; });
} else {
  Object.values(response).forEach((group) => {
    if (group && typeof group === "object" && !Array.isArray(group)) {
      Object.keys(group).forEach((date) => {
        if (date !== "tile") { dates.push(date); dataMap[date] = group[date]; }
      });
    }
  });
}

dates = [...new Set(dates)].sort();
setChartDataMap(dataMap);
setChartDates(dates);

/* ── COLUMNS ── */
const cols = [
  { title: "Metric", dataIndex: "metric", width: 240, fixed: "left" },
  { title: "Target", dataIndex: "target", width: 90, align: "center" },
];
dates.forEach((date) => {
  cols.push({
    title: date,
    dataIndex: date,
    align: "center",
    render: (val) => (
      <div className="heat-cell">
        {val === null || val === undefined || val === "" ? "-" : val}
      </div>
    ),
  });
});
setColumns(cols);

/* ── ACTIVE METRICS (key present in at least one entry) ── */
const activeMetrics = METRIC_MAP.filter((m) => isFieldPresent(m, dates, dataMap));

/* ── ROWS ── */
const rows = activeMetrics.map((metric) => {
  const row = { key: metric.key, metric: metric.label, target: "-" };
  dates.forEach((date) => {
    const entry   = dataMap[date];
    const raw     = entry ? metric.extract(entry) : undefined;
    const display = safeVal(raw);
    row[date] = display !== null ? display : "-";
  });
  return row;
});
setTableData(rows);

/* ── TILES — only metrics with at least one real non-dash value ── */
const limit = viewBy === "day" ? dates.length : 12;
const graphDates = viewBy === "day" ? dates : dates.slice(-limit);

const tiles = activeMetrics
  .filter((m) => hasRealValue(m, dates, dataMap))
  .map((metric) => {
    const series = graphDates.map((d) => {
      const entry = dataMap[d];
      if (!entry) return null;
      return safeVal(metric.extract(entry));
    });
    const numericSeries = series
      .map((v) => (v !== null && !isNaN(Number(v)) ? Number(v) : null));

    /* use tile object if available */
    const tileObj = response.tile || {};
    let tileValue = null;
    if      (metric.key === "AHT")         tileValue = safeVal(tileObj?.AHT);
    else if (metric.key === "CSAT")         tileValue = safeVal(tileObj?.CSAT?.csat_score ?? tileObj?.CSAT?.overall);
    else if (metric.key === "case_quality") tileValue = safeVal(tileObj?.case_quality?.overall_percentage);
    else if (metric.key === "Adherence")    tileValue = safeVal(tileObj?.Adherence);
    else if (metric.key === "ProductionHours") tileValue = safeVal(tileObj?.ProductionHours);
    else {
      /* fallback to most recent real value in data */
      for (let i = dates.length - 1; i >= 0; i--) {
        const v = safeVal(metric.extract(dataMap[dates[i]]));
        if (v !== null) { tileValue = v; break; }
      }
    }

    return {
      label:   metric.label,
      key:     metric.key,
      color:   metric.color,
      unit:    metric.unit,
      value:   tileValue,
      series:  numericSeries,
      dates:   graphDates,
    };
  });

setTileData(tiles);
setTileIndex(0);

};

const updateFilter = (key, val) =>
setFilters((prev) => ({ …prev, [key]: val }));

/* ── tile carousel navigation ── */
const totalPages  = Math.ceil(tileData.length / TILES_PER_PAGE);
const visibleTiles = tileData.slice(
tileIndex * TILES_PER_PAGE,
tileIndex * TILES_PER_PAGE + TILES_PER_PAGE
);

/* ============================================================
RENDER
============================================================ */
return (
<>
{loading && <LoaderOverlay show={loading} />}
<div style={{ padding: 4, opacity: loading ? 0.5 : 1 }}>
<style>{`.filter-wrapper { display: grid; grid-template-columns: repeat(9, 1fr); gap: 14px; } .filter-box { display: flex; flex-direction: column; width: 100%; } .heat-cell { background: #d7f5e9; padding: 4px; border-radius: 4px; text-align: center; } .ant-table-thead > tr > th { background: #153a6f !important; color: white !important; font-weight: 600; } .kpi-card { border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.08); background: #fff; padding: 14px 16px 12px 14px; height: 210px; box-sizing: border-box; display: flex; flex-direction: column; justify-content: flex-start; gap: 0; } .kpi-title { font-size: 12px; font-weight: 600; color: #666; margin-bottom: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; } .kpi-value { font-size: 26px; font-weight: 700; color: #222; line-height: 1.1; margin-bottom: 6px; } .kpi-target-bar-bg { height: 4px; background: #eee; border-radius: 4px; margin-bottom: 4px; overflow: hidden; } .kpi-target-text { font-size: 11px; color: #999; margin-bottom: 8px; } .kpi-graph-area { flex: 1; display: flex; flex-direction: row; align-items: flex-end; min-height: 0; } .nav-btn { width: 32px; height: 32px; border-radius: 50%; border: 1px solid #d9d9d9; background: #fff; display: flex; align-items: center; justify-content: center; cursor: pointer; box-shadow: 0 1px 4px rgba(0,0,0,0.1); transition: all 0.2s; flex-shrink: 0; } .nav-btn:hover { background: #f0f0f0; border-color: #999; } .nav-btn:disabled { opacity: 0.35; cursor: not-allowed; }`}</style>

    {/* ── FILTERS + VIEW BY ── */}
    <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
      <div style={{
        background: "#fff", padding: 16, borderRadius: 10,
        boxShadow: "0 2px 8px rgba(0,0,0,0.08)", flex: 1,
      }}>
        <div className="filter-wrapper">
          {viewBy !== "week" && viewBy !== "day" && renderFilter("YEAR TYPE", "year_type")}
          {viewBy !== "week"                     && renderFilter("YEAR",           "year")}
          {viewBy !== "month" && viewBy !== "week" && renderFilter("MONTH",        "month")}
          {renderFilter("GEOGRAPHY",        "geo")}
          {renderFilter("CLIENT",           "client_name")}
          {renderFilter("JOB CODE",         "program")}
          {renderFilter("LINE OF BUSINESS", "lob")}
          {renderFilter("TENURE",           "tenure_unit")}
          {renderFilter("SUPERVISOR",       "supervisor")}
        </div>
      </div>

      <div style={{
        display: "flex", alignItems: "center", background: "#fff",
        padding: "16px 20px", borderRadius: 10,
        boxShadow: "0 2px 8px rgba(0,0,0,0.08)", gap: 10,
      }}>
        <span style={{ fontWeight: 600, fontSize: 13 }}>View By :</span>
        <Segmented
          options={[
            { label: "Day",   value: "day"   },
            { label: "Week",  value: "week"  },
            { label: "Month", value: "month" },
          ]}
          value={viewBy}
          onChange={(val) => { setViewBy(val); setIsFilterLoaded(false); }}
        />
      </div>
    </div>

    {/* ── KPI TILES with prev/next navigation ── */}
    {tileData.length > 0 && (
      <div style={{
        display: "flex", alignItems: "center",
        gap: 10, margin: "20px 0",
      }}>
        {/* PREV button */}
        <button
          className="nav-btn"
          disabled={tileIndex === 0}
          onClick={() => setTileIndex((p) => Math.max(0, p - 1))}
        >
          <LeftOutlined style={{ fontSize: 13 }} />
        </button>

        {/* TILES */}
        <div style={{ flex: 1, display: "flex", gap: 12 }}>
          {visibleTiles.map((tile) => renderKpiCard(tile))}
          {/* fill empty slots so cards stay same width */}
          {Array.from({ length: TILES_PER_PAGE - visibleTiles.length }).map((_, i) => (
            <div key={`empty-${i}`} style={{ flex: 1 }} />
          ))}
        </div>

        {/* NEXT button */}
        <button
          className="nav-btn"
          disabled={tileIndex >= totalPages - 1}
          onClick={() => setTileIndex((p) => Math.min(totalPages - 1, p + 1))}
        >
          <RightOutlined style={{ fontSize: 13 }} />
        </button>
      </div>
    )}

    {/* page indicator dots */}
    {totalPages > 1 && (
      <div style={{ display: "flex", justifyContent: "center", gap: 6, marginBottom: 16 }}>
        {Array.from({ length: totalPages }).map((_, i) => (
          <div
            key={i}
            onClick={() => setTileIndex(i)}
            style={{
              width: i === tileIndex ? 18 : 8,
              height: 8,
              borderRadius: 4,
              background: i === tileIndex ? "#153a6f" : "#d9d9d9",
              cursor: "pointer",
              transition: "all 0.3s",
            }}
          />
        ))}
      </div>
    )}

    {/* ── TABLE ── */}
    <div style={{ marginTop: 8 }}>
      {loading ? <Spin /> : (
        <Table
          columns={columns}
          dataSource={tableData}
          pagination={false}
          bordered
          size="small"
          scroll={{ x: "max-content", y: 280 }}
        />
      )}
    </div>
  </div>
</>

);

/* ============================================================
FILTER RENDERER
============================================================ */
function renderFilter(label, key) {
const allowAll = [“geo”, “client_name”, “lob”];
let options = filterOptions[key] || [];
if (allowAll.includes(key)) options = [“ALL”, …options];

```
return (
  <div className="filter-box" style={{ maxWidth: "135px" }}>
    <label style={{ fontSize: 12, fontWeight: 600, textAlign: "center" }}>
      {label}
    </label>
    <Select
      value={filters[key]}
      style={{ width: "100%" }}
      popupMatchSelectWidth={false}
      styles={{ popup: { minWidth: 200 } }}
      onChange={(v) => updateFilter(key, v)}
    >
      {options.map((v) => <Option key={v}>{v}</Option>)}
    </Select>
  </div>
);

}

/* ============================================================
KPI CARD RENDERER
Fixed height card — graph takes remaining space at bottom
============================================================ */
function renderKpiCard(tile) {
const { label, color, unit, value, series, dates: gdates } = tile;

const display = (value === null || value === undefined) ? "--" : value;

/* clean numeric series */
const cleanSeries = series.map((v) =>
  v !== null && !isNaN(Number(v)) ? Number(v) : null
);
const numericOnly = cleanSeries.filter((v) => v !== null);
const hasGraph    = numericOnly.length > 0;
const maxVal      = hasGraph ? Math.max(...numericOnly) : 0;
const scaleMax    = maxVal > 0 ? Math.ceil(maxVal / 10) * 10 : 10;

/* GRAPH HEIGHT fixed at 56px for bars */
const GRAPH_H = 56;

return (
  <div className="kpi-card" key={label} style={{ flex: 1, minWidth: 0 }}>

    {/* TITLE */}
    <div className="kpi-title" title={label}>{label}</div>

    {/* VALUE */}
    <div className="kpi-value" style={{ color }}>
      {display}{display !== "--" && unit ? ` ${unit}` : ""}
    </div>

    {/* TARGET BAR */}
    <div className="kpi-target-bar-bg">
      <div style={{ width: "0%", background: color, height: "100%" }} />
    </div>

    {/* TARGET TEXT */}
    <div className="kpi-target-text">Target: —</div>

    {/* GRAPH — fixed layout so card height never changes */}
    <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-end", minHeight: 0 }}>
      {hasGraph ? (
        <>
          {/* Y labels + bars row */}
          <div style={{ display: "flex", alignItems: "flex-end", gap: 4 }}>
            {/* Y AXIS */}
            <div style={{
              display: "flex", flexDirection: "column",
              justifyContent: "space-between",
              height: GRAPH_H, marginRight: 2, flexShrink: 0,
            }}>
              <span style={{ fontSize: 9, color: "#aaa", lineHeight: 1 }}>{scaleMax}</span>
              <span style={{ fontSize: 9, color: "#aaa", lineHeight: 1 }}>{Math.round(scaleMax / 2)}</span>
              <span style={{ fontSize: 9, color: "#aaa", lineHeight: 1 }}>0</span>
            </div>

            {/* BARS — aligned to bottom baseline */}
            <div style={{
              flex: 1,
              display: "flex",
              alignItems: "flex-end",   /* ← this makes bars grow from bottom */
              height: GRAPH_H,
              gap: 2,
              overflow: "hidden",
            }}>
              {cleanSeries.map((v, i) => {
                const barH = v !== null ? Math.max((v / scaleMax) * GRAPH_H, 2) : 0;
                return (
                  <div
                    key={i}
                    style={{
                      flex: 1,
                      height: GRAPH_H,
                      display: "flex",
                      alignItems: "flex-end",  /* ← bar sits at bottom */
                    }}
                  >
                    <div style={{
                      width: "100%",
                      height: v !== null ? barH : 0,
                      background: v !== null ? color : "transparent",
                      borderRadius: "2px 2px 0 0",
                      transition: "height 0.3s",
                    }} />
                  </div>
                );
              })}
            </div>
          </div>

          {/* X AXIS LABELS */}
          <div style={{
            display: "flex",
            paddingLeft: 22,   /* align under bars (after Y axis) */
            marginTop: 3,
          }}>
            {gdates.map((d, i) => (
              <span key={d} style={{
                flex: 1,
                textAlign: "center",
                fontSize: 8,
                color: "#aaa",
                whiteSpace: "nowrap",
                overflow: "hidden",
              }}>
                {viewBy === "day" &&
                  i === Math.floor(gdates.length / 2)
                  ? new Date(d).toLocaleDateString("en", { month: "short" })
                  : ""}
                {viewBy === "week"  ? `W${i + 1}` : ""}
                {viewBy === "month"
                  ? (typeof d === "string"
                      ? d.substring(0, 3)
                      : new Date(d).toLocaleDateString("en-IN", { month: "short" }))
                  : ""}
              </span>
            ))}
          </div>
        </>
      ) : (
        <div style={{
          height: GRAPH_H + 16,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 11, color: "#ccc",
        }}>
          No Data
        </div>
      )}
    </div>
  </div>
);

}
}
