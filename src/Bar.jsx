import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { Select, Table, Segmented, Card, Row, Col, Spin } from "antd";
import LoaderOverlay from "../loader/LoaderOverlay";

const { Option } = Select;
const API_BASE = "http://localhost:9009/api";

export default function KPIDashboard() {
  const [loading, setLoading] = useState(false);
  const [viewBy, setViewBy] = useState("day");
  const [columns, setColumns] = useState([]);
  const [tableData, setTableData] = useState([]);
  const [metrics, setMetrics] = useState({});
  const [filterOptions, setFilterOptions] = useState({});
  const [tileData, setTileData] = useState({});
  const [graphData, setGraphData] = useState({});
  const [chartDates, setChartDates] = useState([]);
  const [chartDataMap, setChartDataMap] = useState({});
  const [isFilterLoaded, setIsFilterLoaded] = useState(false);
  const [filters, setFilters] = useState({
    year_type: "Calendar Year",
    year: 2026,
    month: "January",
    geo: "ALL",
    client_name: "ALL",
    program: "ALL",
    lob: "ALL",
    supervisor: "ALL",
    tenure_unit: "days",
    tenure_lower: 0,
    tenure_upper: 0,
  });

  const defaultFilterPayload = {
    year_type: "Calendar Year",
    year: 0,
    month: "ALL",
    geo: "ALL",
    client_name: "ALL",
    program: "ALL",
    lob: "ALL",
    supervisor: "ALL",
    tenure_unit: "days",
    tenure_lower: 0,
    tenure_upper: 0,
  };

  /* ---------- API ENDPOINTS ---------- */

  const getDataEndpoint = () => {
    if (viewBy === "day") return "/get_concora_daily_data/";
    if (viewBy === "week") return "/get_concora_weekly_data/";
    return "/get_concora_monthly_data/";
  };

  const getFilterEndpoint = () => {
    if (viewBy === "day") return "/get_concora_daily_filters/";
    if (viewBy === "week") return "/get_concora_weekly_filters/";
    return "/get_concora_monthly_filters/";
  };

  /* ---------- PAYLOAD ---------- */

  const payload = useMemo(
    () => ({
      year: filters.year,
      year_type: filters.year_type,
      month: filters.month,
      geo: filters.geo,
      client_name: filters.client_name,
      program: filters.program,
      lob: filters.lob,
      supervisor: filters.supervisor,
      tenure_unit: filters.tenure_unit,
      tenure_lower: filters.tenure_lower,
      tenure_upper: filters.tenure_upper,
    }),
    [filters]
  );

  /* ---------- LOAD FILTERS ---------- */

  useEffect(() => {
    setLoading(true);
    axios
      .post(API_BASE + getFilterEndpoint(), defaultFilterPayload)
      .then((res) => {
        const data = res.data || {};
        setFilterOptions(data);
        setFilters({
          year_type:
            data.year_type && data.year_type.length
              ? data.year_type[0]
              : "Calendar Year",
          year: data.year ? 2026 : data.year[0],
          month: data.month ? "February" : data.month[0],
          geo: "ALL",
          client_name: "ALL",
          lob: "ALL",
          program: data.program?.[0],
          supervisor: data.supervisor?.[0],
          tenure_unit: data.tenure_unit?.[0],
          tenure_lower: 0,
          tenure_upper: 0,
        });
        setIsFilterLoaded(true);
      })
      .finally(() => setLoading(false));
  }, [viewBy]);

  /* ---------- LOAD DATA ---------- */

  useEffect(() => {
    if (!isFilterLoaded) return; // BLOCK FIRST RENDER
    setLoading(true);
    axios
      .post(API_BASE + getDataEndpoint(), payload)
      .then((res) => {
        buildDynamicTable(res.data);
        setTileData(res.data.tile || {});
      })
      .finally(() => setLoading(false));
  }, [filters, viewBy, isFilterLoaded]);

  /* ---------- METRIC CONFIG ----------
     Returns null for any missing / invalid value.
     The table builder will show "-" for null. */

  const metricConfig = {
    AHT: (entry) => {
      const v = entry?.AHT;
      if (v === undefined || v === null || v === "-" || v === "--") return null;
      return v;
    },
    CSAT: (entry) => {
      const v = entry?.CSAT?.csat_score;
      if (v === "-" || v === "NaN" || v === undefined || v === null) return null;
      const num = parseFloat(v.toString().replace("%", ""));
      return isNaN(num) ? null : num;
    },
    case_quality: (entry) => {
      const v = entry?.case_quality?.overall_percentage;
      if (!v || v === "-" || v === "--") return null;
      const num = parseFloat(v.toString().replace("%", ""));
      return isNaN(num) ? null : num;
    },
    Adherence: (entry) => {
      const v = entry?.Adherence;
      if (v === undefined || v === null || v === "-" || v === "--") return null;
      return v;
    },
    ProductionHours: (entry) => {
      const v = entry?.ProductionHours;
      if (v === undefined || v === null || v === "-" || v === "--") return null;
      return v;
    },
    Absenteeism: (entry) => {
      const v = entry?.Absenteeism;
      if (v === undefined || v === null || v === "-" || v === "--") return null;
      return v;
    },
    Shrinkage: (entry) => {
      const v = entry?.Shrinkage;
      if (v === undefined || v === null || v === "-" || v === "--") return null;
      return v;
    },
    Attrition: (entry) => {
      const v = entry?.Attrition;
      if (v === undefined || v === null || v === "-" || v === "--") return null;
      return v;
    },
  };

  /* ---------- ALL POSSIBLE METRICS (master list) ---------- */

  const metricKeyMap = [
    { label: "AHT (CS)", key: "AHT" },
    { label: "CSAT (CS)", key: "CSAT", csat: true },
    { label: "Case Quality", key: "case_quality" },
    { label: "Overall Adherence", key: "Adherence" },
    { label: "Production Hours", key: "ProductionHours" },
    { label: "Absenteeism %", key: "Absenteeism" },
    { label: "Shrinkage %", key: "Shrinkage" },
    { label: "Attrition %", key: "Attrition" },
  ];

  /* ---------- BUILD DYNAMIC TABLE ---------- */

  const buildDynamicTable = (response) => {
    if (!response || Object.keys(response).length === 0) {
      setColumns([]);
      setTableData([]);
      return;
    }

    let dates = [];
    let dataMap = {};

    const firstValue = response[Object.keys(response)[0]];

    if (firstValue && firstValue.CSAT) {
      // daily/weekly shape: { "2026-02-01": { AHT, CSAT, ... }, ... }
      dates = Object.keys(response).filter((k) => k !== "tile");
      dates.forEach((d) => {
        dataMap[d] = response[d];
      });
    } else {
      // monthly shape: grouped objects
      Object.values(response).forEach((group) => {
        Object.keys(group).forEach((date) => {
          dates.push(date);
          dataMap[date] = group[date];
        });
      });
    }

    dates = [...new Set(dates)];
    setChartDataMap(dataMap);
    setChartDates(dates);

    const lastPoints = dates.slice(-7);
    const graphObj = {};
    lastPoints.forEach((d) => {
      graphObj[d] = dataMap[d];
    });
    setGraphData(graphObj);

    /* COLUMNS */
    const cols = [
      {
        title: "Metric",
        dataIndex: "metric",
        width: 200,
        fixed: "left",
      },
      {
        title: "Target",
        dataIndex: "target",
        width: 90,
        align: "center",
      },
    ];

    dates.forEach((date) => {
      cols.push({
        title: date,
        dataIndex: date,
        render: (val) => (
          <div className="heat-cell">
            {val === null || val === undefined || val === "NaN" || val === ""
              ? "-"
              : val}
          </div>
        ),
      });
    });

    setColumns(cols);

    /* ---------- DYNAMIC metricList ----------
       Only include a metric if at least one date entry has a real value. */
    const metricList = metricKeyMap.filter((metric) => {
      return dates.some((date) => {
        const entry = dataMap[date];
        if (!entry) return false;
        const getter = metricConfig[metric.key];
        if (!getter) return false;
        const result = getter(entry);
        return result !== null && result !== undefined;
      });
    });

    /* ROWS */
    const rows = [];

    metricList.forEach((metric) => {
      const row = {
        metric: metric.label,
        target: metric.target,
      };

      dates.forEach((date) => {
        const entry = dataMap[date];
        let value = "-"; // default

        const getter = metricConfig[metric.key];
        if (getter && entry) {
          const result = getter(entry);
          value =
            result === null || result === undefined ? "-" : result;
        }

        row[date] = value;
      });

      rows.push(row);
    });

    setTableData(rows);

    /* KPI TILES — use first date entry */
    const first = dataMap[dates[0]];
    setMetrics({
      aht: first?.AHT ?? "--",
      csat: first?.CSAT?.csat_score ?? "--",
      quality: first?.case_quality?.overall_percentage ?? "--",
      adherence: first?.Adherence ?? "--",
      attrition: first?.Attrition ?? "--",
    });
  };

  const updateFilter = (key, val) => {
    setFilters((prev) => ({ ...prev, [key]: val }));
  };

  return (
    <>
      {loading && <LoaderOverlay show={loading} />}

      <div style={{ padding: 4, opacity: loading ? 0.5 : 1 }}>
        <style>{`
          .filter-wrapper {
            display: grid;
            grid-template-columns: repeat(9, 1fr);
            gap: 14px;
          }
          .filter-box {
            display: flex;
            flex-direction: column;
            width: 100%;
          }
          .viewbox {
            margin-left: auto;
          }
          .heat-cell {
            background: #d7f5e9;
            padding: 4px;
            border-radius: 4px;
            text-align: center;
          }
          .ant-table-thead > tr > th {
            background: #153a6f !important;
            color: white !important;
            font-weight: 600;
          }
        `}</style>

        <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
          {/* FILTER PANEL */}
          <div
            style={{
              background: "#fff",
              padding: 16,
              borderRadius: 10,
              boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
              flex: 1,
            }}
          >
            <div className="filter-wrapper">
              {viewBy !== "week" &&
                viewBy !== "day" &&
                renderFilter("YEAR TYPE", "year_type")}
              {viewBy !== "week" && renderFilter("YEAR", "year")}
              {viewBy !== "month" &&
                viewBy !== "week" &&
                renderFilter("MONTH", "month")}
              {renderFilter("GEOGRAPHY", "geo")}
              {renderFilter("CLIENT", "client_name")}
              {renderFilter("JOB CODE", "program")}
              {renderFilter("LINE OF BUSINESS", "lob")}
              {renderFilter("TENURE", "tenure_unit")}
              {renderFilter("SUPERVISOR", "supervisor")}
            </div>
          </div>

          {/* VIEW BY */}
          <div
            className="viewbox"
            style={{
              display: "flex",
              background: "#fff",
              padding: 25,
              borderRadius: 10,
              boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
            }}
          >
            <div
              style={{
                fontWeight: 600,
                marginBottom: 8,
                paddingRight: 6,
              }}
            >
              View By :
            </div>
            <Segmented
              options={[
                { label: "Day", value: "day" },
                { label: "Week", value: "week" },
                { label: "Month", value: "month" },
              ]}
              value={viewBy}
              onChange={(val) => setViewBy(val)}
            />
          </div>
        </div>

        {/* KPI TILES */}
        <Row gutter={[16, 16]} style={{ margin: "24px 0" }}>
          {tileData?.AHT !== undefined &&
            renderKpi("AHT (CS)", tileData.AHT, "sec", metrics?.ahtTarget)}
          {tileData?.CSAT &&
            renderKpi(
              "CSAT (CS)",
              tileData.CSAT.overall,
              "%",
              metrics?.csatTarget
            )}
          {tileData?.case_quality !== undefined &&
            renderKpi(
              "CASE QUALITY",
              tileData.case_quality?.overall_percentage,
              "%",
              metrics?.qualityTarget
            )}
          {tileData?.Adherence !== undefined &&
            renderKpi("ADHERENCE", tileData.Adherence, "%", metrics?.adherenceTarget)}
          {tileData?.ProductionHours !== undefined &&
            renderKpi(
              "PRODUCTION HOURS",
              tileData.ProductionHours,
              "",
              metrics?.productionTarget
            )}
        </Row>

        {/* DATA TABLE */}
        <div style={{ marginTop: 20 }}>
          {loading ? (
            <Spin />
          ) : (
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

  /* ---------- FILTER ---------- */

  function renderFilter(label, key) {
    const allowAll = ["geo", "client_name", "lob"];
    let options = filterOptions[key] || [];
    if (allowAll.includes(key)) {
      options = ["ALL", ...options];
    }

    return (
      <div className="filter-box" style={{ maxWidth: "135px" }}>
        <label
          style={{ fontSize: 12, fontWeight: 600, textAlign: "center" }}
        >
          {label}
        </label>
        <Select
          value={filters[key]}
          style={{ width: "100%" }}
          popupMatchSelectWidth={false}
          styles={{ popup: { minWidth: 200 } }}
          onChange={(v) => updateFilter(key, v)}
        >
          {/* {<Option value="ALL">All</Option>} */}
          {filterOptions[key]?.map((v) => (
            <Option key={v}>{v}</Option>
          ))}
        </Select>
      </div>
    );
  }

  /* ---------- KPI CARD ---------- */

  function renderKpi(title, value, unit, target) {
    let display = value;

    if (typeof display === "string") {
      display = parseFloat(display.replace("%", ""));
    }

    if (display === undefined || display === null) {
      display = "--";
    }

    /* COLORS (same as figma) */
    let color = "#3f7df5";

    if (title.includes("AHT")) color = "#d4380d";
    if (title.includes("CSAT")) color = "#389e0d";
    if (title.includes("CASE QUALITY")) color = "#2f54eb";
    if (title.includes("ADHERENCE")) color = "#fa8c16";
    if (title.includes("PRODUCTION")) color = "#2f54eb";

    /* GRAPH DATA FROM TABLE */
    let limit = 7;
    if (viewBy === "week") limit = 12;
    if (viewBy === "month") limit = 12;

    const graphDates = chartDates.filter((d) => {
      const row = chartDataMap[d];
      if (!row) return false;
      return (
        row.AHT !== undefined ||
        row.Adherence !== undefined ||
        row.ProductionHours !== undefined ||
        row?.CSAT?.csat_score !== undefined ||
        row?.case_quality !== undefined
      );
    });

    // apply limit only for week/month
    const finalGraphDates =
      viewBy === "day" ? graphDates : graphDates.slice(-limit);

    const series = finalGraphDates.map((d) => {
      const row = chartDataMap[d];
      if (!row) return null;

      if (title === "AHT (CS)") return row?.AHT ?? null;

      if (title === "CSAT (CS)") {
        const v = row?.CSAT?.csat_score;
        if (!v) return null;
        return parseFloat(v.replace("%", ""));
      }

      if (title === "CASE QUALITY") {
        const v = row?.case_quality?.overall_percentage;
        return v ? parseFloat(v.replace("%", "")) : null;
      }

      if (title === "ADHERENCE") return row?.Adherence ?? null;
      if (title === "PRODUCTION HOURS") return row?.ProductionHours ?? null;

      return null;
    });

    const hasGraph = series.length > 0;

    const cleanSeries = (series || [])
      .map((v) => Number(v))
      .filter((v) => !isNaN(v) && v !== null);

    const maxValue = cleanSeries.length ? Math.max(...cleanSeries) : 0;

    // always safe scale
    const scaleMax = maxValue > 0 ? Math.ceil(maxValue / 10) * 10 : 10;

    return (
      <Col flex={1} key={title}>
        <Card
          styles={{
            body: {
              paddingTop: 12,
              paddingLeft: 12,
              paddingRight: 16,
              paddingBottom: 16,
            },
          }}
          style={{
            borderRadius: 10,
            boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
            height: 230,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          {/* TITLE */}
          <div style={{ fontSize: 13, fontWeight: 600, color: "#666" }}>
            {title}
          </div>

          {/* VALUE */}
          <div
            style={{
              fontSize: 28,
              fontWeight: 700,
              marginTop: 4,
            }}
          >
            {display} {unit}
          </div>

          {/* TARGET BAR */}
          <div
            style={{
              height: 4,
              background: "#eee",
              borderRadius: 4,
              marginTop: 8,
              marginBottom: 10,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${target ? (display / target) * 100 : 0}%`,
                background: color,
                height: "100%",
              }}
            />
          </div>

          {/* TARGET TEXT */}
          <div
            style={{ fontSize: 12, color: "#777", marginBottom: 6 }}
          >
            Target: {target}
          </div>

          {/* GRAPH */}
          {hasGraph && (
            <div style={{ display: "flex", gap: 6 }}>
              {/* Y AXIS */}
              <div
                style={{
                  fontSize: 10,
                  color: "#888",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  height: 60,
                  marginRight: 5,
                }}
              >
                <span>{scaleMax}</span>
                <span>{Math.round(scaleMax / 2)}</span>
                <span>0</span>
              </div>

              {/* BARS */}
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-end",
                    height: 60,
                    width: "100%",
                    gap: 4,
                    overflow: "hidden",
                  }}
                >
                  {cleanSeries.length === 0 ? (
                    <div style={{ fontSize: 12, color: "#999" }}>
                      No Data
                    </div>
                  ) : (
                    cleanSeries.map((v, i) => {
                      const percent = scaleMax ? v / scaleMax : 0;
                      const height = Math.max(percent * 60, 2); // minimum visible

                      return (
                        <div
                          key={i}
                          style={{
                            flex: 1,
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "flex-end",
                            height: "100%",
                          }}
                        >
                          <div
                            style={{
                              width: 6,
                              height: height,
                              background: color,
                              borderRadius: 2,
                            }}
                          />
                        </div>
                      );
                    })
                  )}
                </div>

                {/* X AXIS */}
                <div
                  style={{
                    display: "flex",
                    width: "100%",
                    fontSize: 8,
                    color: "#888",
                    marginTop: 4,
                  }}
                >
                  {finalGraphDates.map((d, i) => (
                    <span
                      key={d}
                      style={{
                        flex: 1,
                        textAlign: "center",
                        fontSize: 9,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {viewBy === "day" &&
                        i === Math.floor(finalGraphDates.length / 2) &&
                        new Date(d).toLocaleDateString("en", {
                          month: "short",
                        })}
                      {viewBy === "week" && `W${i + 1}`}
                      {viewBy === "month" &&
                        (typeof d === "string"
                          ? d.substring(0, 3)
                          : new Date(d).toLocaleDateString("en-IN", {
                              month: "short",
                            }))}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </Card>
      </Col>
    );
  }
