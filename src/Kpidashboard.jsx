import React, { useEffect, useState } from "react";
import axios from "axios";
import { Select, Table, Segmented, Card, Row, Col, Spin } from "antd";

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

  // 👉 UI filters
  const [filters, setFilters] = useState({
    year_type: "Calendar Year",
    year: "",
    month: "",
    geo: "",
    client_name: "",
    program: "",
    lob: "",
    supervisor: "",
    tenure_unit: "days",
    tenure_lower: 0,
    tenure_upper: 0
  });

  // 👉 API payload (SEPARATE)
  const [apiPayload, setApiPayload] = useState({
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
    tenure_upper: 0
  });

  const defaultFilterPayload = { ...apiPayload };

  // =============================
  // 🔹 HELPERS (MAIN CLEANUP)
  // =============================

  const getValue = (entry, key) => {
    if (!entry) return 0;

    if (key === "CSAT") {
      return entry?.CSAT?.overall
        ? parseFloat(entry.CSAT.overall.replace("%", ""))
        : 0;
    }

    if (key === "CallQuality") {
      return entry?.CallQuality?.case_quality?.overall_percentage
        ? parseFloat(
            entry.CallQuality.case_quality.overall_percentage.replace("%", "")
          )
        : entry?.CallQuality?.case_quality?.overall_score || 0;
    }

    if (typeof entry[key] === "string") {
      return parseFloat(entry[key].replace("%", "")) || 0;
    }

    return entry[key] || 0;
  };

  const getKpiValue = (entry, key) => {
    if (!entry) return "--";

    if (key === "CSAT") return entry?.CSAT?.overall ?? "--";

    if (key === "CallQuality") {
      return (
        entry?.CallQuality?.case_quality?.overall_percentage ??
        entry?.CallQuality?.case_quality?.overall_score ??
        "--"
      );
    }

    return entry[key] ?? "--";
  };

  // =============================
  // 🔹 API ENDPOINTS
  // =============================

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

  // =============================
  // 🔹 LOAD FILTERS
  // =============================

  useEffect(() => {
    axios
      .post(API_BASE + getFilterEndpoint(), defaultFilterPayload)
      .then((res) => {
        const data = res.data || {};

        setFilterOptions(data);

        // UI ONLY (NOT payload)
        setFilters((prev) => ({
          ...prev,
          year_type: data?.year_type?.[0] || "Calendar Year",
          year: data?.year?.[0] || "",
          month: data?.month?.[0] || "",
          geo: data?.geo?.[0] || "",
          client_name: data?.client_name?.[0] || "",
          program: data?.program?.[0] || "",
          lob: data?.lob?.[0] || "",
          supervisor: data?.supervisor?.[0] || ""
        }));
      });
  }, [viewBy]);

  // =============================
  // 🔹 LOAD DATA
  // =============================

  useEffect(() => {
    setLoading(true);

    axios
      .post(API_BASE + getDataEndpoint(), apiPayload)
      .then((res) => {
        buildDynamicTable(res.data);
        setTileData(res.data?.tile || {});
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [apiPayload, viewBy]);

  // =============================
  // 🔹 TABLE BUILDER
  // =============================

  const buildDynamicTable = (response) => {
    if (!response) return;

    let dates = [];
    let dataMap = {};

    const firstKey = Object.keys(response)[0];
    const firstVal = response[firstKey];

    if (firstVal && firstVal.CSAT) {
      dates = Object.keys(response).filter((k) => k !== "tile");
      dates.forEach((d) => (dataMap[d] = response[d]));
    } else {
      Object.values(response).forEach((group) => {
        Object.keys(group).forEach((d) => {
          dates.push(d);
          dataMap[d] = group[d];
        });
      });
    }

    dates = [...new Set(dates)];

    setChartDataMap(dataMap);
    setChartDates(dates);

    // ===== COLUMNS =====
    const cols = [
      { title: "Metric", dataIndex: "metric", fixed: "left", width: 200 },
      { title: "Target", dataIndex: "target", width: 90, align: "center" }
    ];

    dates.forEach((date) => {
      cols.push({
        title: date,
        dataIndex: date,
        render: (val) => <div className="heat-cell">{val}</div>
      });
    });

    setColumns(cols);

    // ===== ROWS =====
    const metricList = [
      { label: "AHT (s)", key: "AHT" },
      { label: "CSAT (%)", key: "CSAT" },
      { label: "OVERALL QUALITY", key: "CallQuality" },
      { label: "Adherence", key: "Adherence" },
      { label: "Production Hours", key: "ProductionHours" }
    ];

    const rows = [];

    metricList.forEach((metric) => {
      const row = { metric: metric.label, target: "-" };

      dates.forEach((date) => {
        const entry = dataMap[date];
        row[date] = getValue(entry, metric.key);
      });

      rows.push(row);
    });

    setTableData(rows);

    // ===== KPI =====
    const first = dataMap[dates[0]];

    setMetrics({
      aht: getKpiValue(first, "AHT"),
      csat: getKpiValue(first, "CSAT"),
      quality: getKpiValue(first, "CallQuality"),
      adherence: getKpiValue(first, "Adherence"),
      production: getKpiValue(first, "ProductionHours")
    });
  };

  // =============================
  // 🔹 FILTER CHANGE
  // =============================

  const updateFilter = (key, val) => {
    setFilters((prev) => ({ ...prev, [key]: val }));

    setApiPayload((prev) => ({
      ...prev,
      [key]: val || "ALL"
    }));
  };

  // =============================
  // 🔹 UI (UNCHANGED)
  // =============================

  return (
    <div style={{ padding: 4 }}>
      <Segmented
        options={[
          { label: "Day", value: "day" },
          { label: "Week", value: "week" },
          { label: "Month", value: "month" }
        ]}
        value={viewBy}
        onChange={(val) => setViewBy(val)}
      />

      <Row gutter={[16, 16]} style={{ marginTop: 20 }}>
        {Object.keys(metrics).map((key) => (
          <Col key={key} span={4}>
            <Card>
              <div>{key.toUpperCase()}</div>
              <div>{metrics[key]}</div>
            </Card>
          </Col>
        ))}
      </Row>

      <div style={{ marginTop: 20 }}>
        {loading ? (
          <Spin />
        ) : (
          <Table
            columns={columns}
            dataSource={tableData}
            pagination={false}
            size="small"
            scroll={{ y: 280 }}
          />
        )}
      </div>
    </div>
  );
}
