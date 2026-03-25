import React, { useEffect, useState, useMemo } from “react”;
import axios from “axios”;
import { Select, Table, Segmented, Spin } from “antd”;
import { LeftOutlined, RightOutlined } from “@ant-design/icons”;
import LoaderOverlay from “../loader/LoaderOverlay”;

const { Option } = Select;
const API_BASE = “http://localhost:9009/api”;

/* ─── current date defaults ─────────────────────────────────────── */
const MONTH_NAMES = [
“January”,“February”,“March”,“April”,“May”,“June”,
“July”,“August”,“September”,“October”,“November”,“December”,
];
const CURRENT_YEAR  = new Date().getFullYear();
const CURRENT_MONTH = MONTH_NAMES[new Date().getMonth()];

/* ─── tile colour palette (cycles if more metrics than colours) ─── */
const PALETTE = [
“#d4380d”,”#389e0d”,”#2f54eb”,”#fa8c16”,”#722ed1”,
“#eb2f96”,”#fa541c”,”#13c2c2”,”#52c41a”,”#1890ff”,
“#f5222d”,”#faad14”,”#a0d911”,”#08979c”,”#531dab”,
];

const TILES_PER_PAGE = 5;

/* ─────────────────────────────────────────────────────────────────
extractValue(raw)
Given any value from the response, returns a display-ready
number/string or null.
• primitive “-” / “–” / “” / NaN  → null
• number or numeric string          → number
• object with “Overall” key         → parse Overall %
• boolean                           → null (not displayable)
───────────────────────────────────────────────────────────────────*/
function extractValue(raw) {
if (raw === undefined || raw === null) return null;

// nested object → use “Overall” key
if (typeof raw === “object” && !Array.isArray(raw)) {
if (“Overall” in raw) return extractValue(raw[“Overall”]);
if (“overall” in raw) return extractValue(raw[“overall”]);
if (“overall_percentage” in raw) return extractValue(raw[“overall_percentage”]);
return null; // object with no recognised key
}

if (typeof raw === “boolean”) return null;

const s = String(raw).trim();
if (s === “” || s === “-” || s === “–” || s.toLowerCase() === “nan”) return null;

const n = parseFloat(s.replace(”%”, “”));
return isNaN(n) ? s : n;
}

/* ─────────────────────────────────────────────────────────────────
parseDateEntries(response)
Returns { dates[], dataMap{date→entry} }
Works for both daily/weekly shape and monthly grouped shape.
───────────────────────────────────────────────────────────────────*/
function parseDateEntries(response) {
const nonTileKeys = Object.keys(response).filter((k) => k !== “tile”);
const firstEntry  = response[nonTileKeys[0]];

let dates   = [];
let dataMap = {};

// daily / weekly: values are plain entry objects (have string/number/object values)
// monthly: values are objects whose keys are dates
const looksLikeEntry = (v) =>
v && typeof v === “object” && !Array.isArray(v) &&
Object.values(v).some(
(x) =>
typeof x === “string” ||
typeof x === “number” ||
(typeof x === “object” && x !== null && (“Overall” in x || “overall” in x))
);

if (looksLikeEntry(firstEntry)) {
dates   = nonTileKeys;
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

/* ─────────────────────────────────────────────────────────────────
discoverMetricKeys(dates, dataMap)
Returns ordered array of all metric keys found across all entries.
Preserves first-seen order.
───────────────────────────────────────────────────────────────────*/
function discoverMetricKeys(dates, dataMap) {
const seen    = new Set();
const ordered = [];
dates.forEach((d) => {
const entry = dataMap[d];
if (!entry) return;
Object.keys(entry).forEach((k) => {
if (!seen.has(k)) { seen.add(k); ordered.push(k); }
});
});
return ordered;
}

export default function KPIDashboard() {
const [loading,        setLoading]        = useState(false);
const [viewBy,         setViewBy]         = useState(“day”);
const [columns,        setColumns]        = useState([]);
const [tableData,      setTableData]      = useState([]);
const [filterOptions,  setFilterOptions]  = useState({});
const [tileData,       setTileData]       = useState([]);
const [tileIndex,      setTileIndex]      = useState(0);
const [chartDates,     setChartDates]     = useState([]);
const [chartDataMap,   setChartDataMap]   = useState({});
const [isFilterLoaded, setIsFilterLoaded] = useState(false);

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

/* ── endpoints ─────────────────────────────────────────────────*/
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
lob: filters.lob, supervisor: filters.supervisor, tenure_unit: filters.tenure_unit,
tenure_lower: filters.tenure_lower, tenure_upper: filters.tenure_upper,
}), [filters]);

/* ── load filters ──────────────────────────────────────────────*/
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

/* ── load data ─────────────────────────────────────────────────*/
useEffect(() => {
if (!isFilterLoaded) return;
setLoading(true);
axios.post(API_BASE + getDataEndpoint(), payload)
.then((res) => buildDynamicTable(res.data))
.finally(() => setLoading(false));
}, [filters, viewBy, isFilterLoaded]);

/* ═══════════════════════════════════════════════════════════════
buildDynamicTable — the heart of the component
100% driven by response shape, no hardcoded metric names
═══════════════════════════════════════════════════════════════*/
const buildDynamicTable = (response) => {
if (!response || Object.keys(response).length === 0) {
setColumns([]); setTableData([]); setTileData([]); return;
}

const tileObj             = response.tile || {};
const { dates, dataMap }  = parseDateEntries(response);

if (dates.length === 0) {
  setColumns([]); setTableData([]); setTileData([]); return;
}

setChartDates(dates);
setChartDataMap(dataMap);

/* ── discover ALL metric keys from actual response ── */
const metricKeys = discoverMetricKeys(dates, dataMap);

/* ── filter: only keys that have at least one real value ── */
const activeKeys = metricKeys.filter((key) =>
  dates.some((d) => extractValue(dataMap[d]?.[key]) !== null)
);

/* ── COLUMNS: fixed "Metric" + "Target" then one col per date ── */
const cols = [
  {
    title: "Metric",
    dataIndex: "metric",
    width: 260,
    fixed: "left",
    render: (text) => (
      <span style={{ fontWeight: 500, fontSize: 13 }}>{text}</span>
    ),
  },
  {
    title: "Target",
    dataIndex: "target",
    width: 80,
    align: "center",
  },
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

/* ── ROWS: one row per active metric key ── */
const rows = activeKeys.map((key) => {
  const row = { key, metric: key, target: "-" };
  dates.forEach((date) => {
    const raw     = dataMap[date]?.[key];
    const display = extractValue(raw);
    row[date] = display !== null ? display : "-";
  });
  return row;
});
setTableData(rows);

/* ── TILES: one tile per active metric, built from tile obj + graph series ── */
const graphDates =
  viewBy === "day" ? dates : dates.slice(-12);

const tiles = activeKeys.map((key, idx) => {
  // value: prefer tile object, fallback to most recent real value
  let tileValue = extractValue(tileObj?.[key]);
  if (tileValue === null) {
    for (let i = dates.length - 1; i >= 0; i--) {
      const v = extractValue(dataMap[dates[i]]?.[key]);
      if (v !== null) { tileValue = v; break; }
    }
  }

  // graph series
  const series = graphDates.map((d) => {
    const v = extractValue(dataMap[d]?.[key]);
    return v !== null && !isNaN(Number(v)) ? Number(v) : null;
  });

  return {
    key,
    label:  key,
    color:  PALETTE[idx % PALETTE.length],
    unit:   String(tileObj?.[key] ?? "").includes("%") ||
            String(dataMap[dates[dates.length - 1]]?.[key] ?? "").includes("%")
            ? "%" : "",
    value:  tileValue,
    series,
    dates:  graphDates,
  };
});

setTileData(tiles);
setTileIndex(0);
```

};

const updateFilter = (key, val) =>
setFilters((prev) => ({ …prev, [key]: val }));

const totalPages   = Math.ceil(tileData.length / TILES_PER_PAGE);
const visibleTiles = tileData.slice(
tileIndex * TILES_PER_PAGE,
tileIndex * TILES_PER_PAGE + TILES_PER_PAGE
);

/* ═══════════════════════════════════════════════════════════════
RENDER
═══════════════════════════════════════════════════════════════*/
return (
<>
{loading && <LoaderOverlay show={loading} />}
<div style={{ padding: 4, opacity: loading ? 0.5 : 1 }}>
<style>{`.filter-wrapper { display: grid; grid-template-columns: repeat(9, 1fr); gap: 14px; } .filter-box { display: flex; flex-direction: column; width: 100%; } .heat-cell { background: #d7f5e9; padding: 4px 6px; border-radius: 4px; text-align: center; font-size: 12px; } .ant-table-thead > tr > th { background: #153a6f !important; color: white !important; font-weight: 600; font-size: 12px; } .kpi-card { background: #fff; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.08); padding: 14px 14px 10px 14px; height: 210px; box-sizing: border-box; display: flex; flex-direction: column; min-width: 0; flex: 1; } .kpi-title { font-size: 11px; font-weight: 600; color: #555; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-bottom: 4px; } .kpi-value { font-size: 24px; font-weight: 700; line-height: 1.15; margin-bottom: 5px; } .kpi-target-bar-bg { height: 4px; background: #f0f0f0; border-radius: 4px; margin-bottom: 3px; overflow: hidden; } .kpi-target-text { font-size: 10px; color: #aaa; margin-bottom: 6px; } .nav-btn { width: 30px; height: 30px; border-radius: 50%; border: 1px solid #e0e0e0; background: #fff; display: flex; align-items: center; justify-content: center; cursor: pointer; box-shadow: 0 1px 4px rgba(0,0,0,0.08); transition: all 0.2s; flex-shrink: 0; padding: 0; } .nav-btn:hover:not(:disabled) { background: #f5f5f5; border-color: #aaa; } .nav-btn:disabled { opacity: 0.3; cursor: not-allowed; }`}</style>

    {/* ── FILTERS + VIEW BY ─────────────────────────────────── */}
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
        display: "flex", alignItems: "center", gap: 10,
        background: "#fff", padding: "14px 18px",
        borderRadius: 10, boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
        flexShrink: 0,
      }}>
        <span style={{ fontWeight: 600, fontSize: 13, whiteSpace: "nowrap" }}>
          View By :
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

    {/* ── KPI TILE CAROUSEL ─────────────────────────────────── */}
    {tileData.length > 0 && (
      <>
        <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "18px 0 6px" }}>
          {/* PREV */}
          <button
            className="nav-btn"
            disabled={tileIndex === 0}
            onClick={() => setTileIndex((p) => Math.max(0, p - 1))}
          >
            <LeftOutlined style={{ fontSize: 12, color: "#555" }} />
          </button>

          {/* CARDS */}
          <div style={{ flex: 1, display: "flex", gap: 12 }}>
            {visibleTiles.map((tile) => renderKpiCard(tile))}
            {/* empty spacers so cards stay same width on last page */}
            {Array.from({ length: TILES_PER_PAGE - visibleTiles.length }).map((_, i) => (
              <div key={`spacer-${i}`} style={{ flex: 1 }} />
            ))}
          </div>

          {/* NEXT */}
          <button
            className="nav-btn"
            disabled={tileIndex >= totalPages - 1}
            onClick={() => setTileIndex((p) => Math.min(totalPages - 1, p + 1))}
          >
            <RightOutlined style={{ fontSize: 12, color: "#555" }} />
          </button>
        </div>

        {/* page dots */}
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
                  width: i === tileIndex ? 20 : 8,
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
      </>
    )}

    {/* ── TABLE ─────────────────────────────────────────────── */}
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

);

/* ═══════════════════════════════════════════════════════════════
renderFilter
═══════════════════════════════════════════════════════════════*/
function renderFilter(label, key) {
const allowAll = [“geo”, “client_name”, “lob”];
let options    = filterOptions[key] || [];
if (allowAll.includes(key)) options = [“ALL”, …options];

return (
  <div className="filter-box" style={{ maxWidth: "135px" }} key={key}>
    <label style={{ fontSize: 11, fontWeight: 600, textAlign: "center", marginBottom: 2 }}>
      {label}
    </label>
    <Select
      value={filters[key]}
      style={{ width: "100%" }}
      popupMatchSelectWidth={false}
      styles={{ popup: { minWidth: 200 } }}
      onChange={(v) => updateFilter(key, v)}
    >
      {options.map((v) => <Option key={v} value={v}>{v}</Option>)}
    </Select>
  </div>
);

}

/* ═══════════════════════════════════════════════════════════════
renderKpiCard
Fixed 210px height card. Graph always fills bottom portion.
Bars grow from bottom (aligned to x-axis baseline).
═══════════════════════════════════════════════════════════════*/
function renderKpiCard(tile) {
const { label, color, unit, value, series, dates: gdates } = tile;

const display = (value === null || value === undefined) ? "--" : value;

const numericSeries = series.map((v) =>
  v !== null && !isNaN(Number(v)) ? Number(v) : null
);
const validNums  = numericSeries.filter((v) => v !== null);
const hasGraph   = validNums.length > 0;
const maxVal     = hasGraph ? Math.max(...validNums) : 0;
const scaleMax   = maxVal > 0 ? Math.ceil(maxVal / 10) * 10 : 10;
const GRAPH_H    = 58; // fixed bar area height in px

return (
  <div className="kpi-card" key={label}>

    {/* TITLE — truncated with tooltip via title attr */}
    <div className="kpi-title" title={label}>{label}</div>

    {/* VALUE */}
    <div className="kpi-value" style={{ color }}>
      {display}{display !== "--" && unit ? ` ${unit}` : ""}
    </div>

    {/* TARGET BAR (placeholder — no target data yet) */}
    <div className="kpi-target-bar-bg">
      <div style={{ width: "0%", background: color, height: "100%" }} />
    </div>
    <div className="kpi-target-text">Target: —</div>

    {/* GRAPH — fills remaining space, bars pinned to bottom */}
    <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
      {hasGraph ? (
        <>
          {/* Y labels + bars */}
          <div style={{ display: "flex", alignItems: "flex-end", gap: 3 }}>

            {/* Y AXIS labels */}
            <div style={{
              display: "flex", flexDirection: "column",
              justifyContent: "space-between",
              height: GRAPH_H, flexShrink: 0, marginRight: 2,
            }}>
              <span style={{ fontSize: 8, color: "#bbb", lineHeight: 1 }}>{scaleMax}</span>
              <span style={{ fontSize: 8, color: "#bbb", lineHeight: 1 }}>{Math.round(scaleMax / 2)}</span>
              <span style={{ fontSize: 8, color: "#bbb", lineHeight: 1 }}>0</span>
            </div>

            {/* BARS — container is GRAPH_H tall, bars grow from bottom */}
            <div style={{
              flex: 1,
              height: GRAPH_H,
              display: "flex",
              alignItems: "flex-end",  /* ← aligns bars to bottom baseline */
              gap: 2,
              overflow: "hidden",
            }}>
              {numericSeries.map((v, i) => {
                const barH = v !== null
                  ? Math.max((v / scaleMax) * GRAPH_H, 2)
                  : 0;
                return (
                  <div
                    key={i}
                    title={v !== null ? `${v}${unit}` : "No data"}
                    style={{
                      flex: 1,
                      height: barH,
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

          {/* X AXIS LABELS — aligned under bars */}
          <div style={{
            display: "flex",
            paddingLeft: 20, /* offset = y-axis label width */
            marginTop: 2,
          }}>
            {gdates.map((d, i) => {
              let label = "";
              if (viewBy === "day") {
                // show month name only at the midpoint
                if (i === Math.floor(gdates.length / 2))
                  label = new Date(d).toLocaleDateString("en", { month: "short" });
              } else if (viewBy === "week") {
                label = `W${i + 1}`;
              } else {
                label = typeof d === "string"
                  ? d.substring(0, 3)
                  : new Date(d).toLocaleDateString("en-IN", { month: "short" });
              }
              return (
                <span
                  key={d}
                  style={{
                    flex: 1, textAlign: "center",
                    fontSize: 8, color: "#bbb",
                    whiteSpace: "nowrap", overflow: "hidden",
                  }}
                >
                  {label}
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

}
}
