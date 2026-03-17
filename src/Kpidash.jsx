import React, { useEffect, useState } from "react";
import axios from "axios";
import { Select, Table, Segmented, Card, Row, Col } from "antd";
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
  const [chartDates, setChartDates] = useState([]);
  const [chartDataMap, setChartDataMap] = useState({});

  // UI filters
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

  // API payload
  const [apiPayload, setApiPayload] = useState({
    year_type: "Calendar Year",
    year: "0", // FIXED
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

  // =============================
  // HELPERS
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
        ? parseFloat(entry.CallQuality.case_quality.overall_percentage.replace("%", ""))
        : entry?.CallQuality?.case_quality?.overall_score || 0;
    }

    if (typeof entry?.[key] === "string") {
      return parseFloat(entry[key].replace("%", "")) || 0;
    }

    return entry?.[key] || 0;
  };

  const getKpiValue = (entry, key) => {
    if (!entry) return "--";

    if (key === "CSAT") return entry?.CSAT?.overall ?? "--";

    if (key === "CallQuality") {
      return entry?.CallQuality?.case_quality?.overall_percentage ??
             entry?.CallQuality?.case_quality?.overall_score ??
             "--";
    }

    return entry?.[key] ?? "--";
  };

  // =============================
  // ENDPOINTS
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
  // LOAD FILTERS
  // =============================

  useEffect(() => {
    axios.post(API_BASE + getFilterEndpoint(), apiPayload)
      .then(res => {
        const data = res.data || {};
        setFilterOptions(data);
      });
  }, [viewBy]);

  // =============================
  // LOAD DATA
  // =============================

  useEffect(() => {
    setLoading(true);

    axios.post(API_BASE + getDataEndpoint(), apiPayload)
      .then(res => {
        buildDynamicTable(res.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));

  }, [apiPayload, viewBy]);

  // =============================
  // TABLE + GRAPH BUILDER
  // =============================

  const buildDynamicTable = (response) => {
    if (!response) return;

    let dates = [];
    let dataMap = {};

    Object.keys(response).forEach(key => {
      if (key !== "tile") {
        dates.push(key);
        dataMap[key] = response[key];
      }
    });

    dates = [...new Set(dates)].sort();

    setChartDataMap(dataMap);
    setChartDates(dates);

    // ========= GRAPH RANGE =========
    let limit = 7;
    if (viewBy === "week") limit = 12;
    if (viewBy === "month") limit = 12;

    const graphDates = dates.slice(-limit);

    // ========= COLUMNS =========
    const cols = [
      { title: "Metric", dataIndex: "metric", width: 200, fixed: "left" },
      { title: "Target", dataIndex: "target", width: 90 }
    ];

    dates.forEach(date => {
      cols.push({
        title: date,
        dataIndex: date,
        render: (val) => <div className="heat-cell">{val}</div>
      });
    });

    setColumns(cols);

    // ========= METRICS =========
    const metricList = [
      { label: "AHT (CS)", key: "AHT" },
      { label: "CSAT (CS)", key: "CSAT" },
      { label: "Overall Call Quality", key: "CallQuality" },
      { label: "Overall Adherence", key: "Adherence" },
      { label: "Production Hours", key: "ProductionHours" }
    ];

    const rows = [];

    metricList.forEach(metric => {
      const row = { metric: metric.label, target: "-" };

      dates.forEach(date => {
        row[date] = getValue(dataMap[date], metric.key);
      });

      rows.push(row);
    });

    setTableData(rows);

    // ========= KPI =========
    const first = dataMap[dates[dates.length - 1]];

    setMetrics({
      aht: getKpiValue(first, "AHT"),
      csat: getKpiValue(first, "CSAT"),
      quality: getKpiValue(first, "CallQuality"),
      adherence: getKpiValue(first, "Adherence"),
      production: getKpiValue(first, "ProductionHours")
    });
  };

  // =============================
  // FILTER CHANGE
  // =============================

  const updateFilter = (key, val) => {
    setFilters(prev => ({ ...prev, [key]: val }));

    setApiPayload(prev => ({
      ...prev,
      [key]: key === "year"
        ? String(val || "0")
        : val || "ALL"
    }));
  };

  // =============================
  // UI (UNCHANGED)
  // =============================

  return (
    <div style={{ padding: 4 }}>

      {loading && <LoaderOverlay />}

      <Segmented
        options={[
          { label: "Day", value: "day" },
          { label: "Week", value: "week" },
          { label: "Month", value: "month" }
        ]}
        value={viewBy}
        onChange={setViewBy}
      />

      <Row gutter={[16, 16]} style={{ marginTop: 20 }}>
        {Object.keys(metrics).map(key => (
          <Col key={key} span={4}>
            <Card>
              <div>{key.toUpperCase()}</div>
              <div>{metrics[key]}</div>
            </Card>
          </Col>
        ))}
      </Row>

      <div style={{ marginTop: 20 }}>
        <Table
          columns={columns}
          dataSource={tableData}
          pagination={false}
          size="small"
          scroll={{ y: 280 }}
        />
      </div>

    </div>
  );
}
