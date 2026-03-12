import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Select,
  Row,
  Col,
  Card,
  Segmented,
  Table,
  Progress,
  InputNumber,
  Spin
} from "antd";

const { Option } = Select;

const API_BASE = "http://localhost:9009/api";

export default function ConcoraAnalytics() {

  const [viewBy, setViewBy] = useState("Day");
  const [loading, setLoading] = useState(false);

  const [filters, setFilters] = useState({
    year: 2026,
    year_type: "Calendar Year",
    month: "March",
    geo: "ALL",
    client_name: "ALL",
    program: "ALL",
    lob: "ALL",
    supervisor: "ALL",
    job_code: "ALL",
    tenure_unit: "days",
    tenure_lower: 0,
    tenure_upper: 0
  });

  const [filterOptions, setFilterOptions] = useState({});
  const [metrics, setMetrics] = useState({});
  const [tableData, setTableData] = useState([]);
  const [tableColumns, setTableColumns] = useState([]);

  /* ---------------- API SWITCH ---------------- */

  const getDataEndpoint = () => {
    if (viewBy === "Day") return "/get_concora_daily_data/";
    if (viewBy === "Week") return "/get_concora_weekly_data/";
    return "/get_concora_monthly_data/";
  };

  const getFilterEndpoint = () => {
    if (viewBy === "Day") return "/get_concora_daily_filters/";
    if (viewBy === "Week") return "/get_concora_weekly_filters/";
    return "/get_concora_monthly_filters/";
  };

  /* ---------------- PAYLOAD ---------------- */

  const buildPayload = () => ({
    year: filters.year,
    year_type: filters.year_type,
    month: filters.month,
    geo: filters.geo,
    client_name: filters.client_name,
    program: filters.program,
    lob: filters.lob,
    supervisor: filters.supervisor,
    tenure_unit: filters.tenure_unit,
    tenure_lower: Number(filters.tenure_lower),
    tenure_upper: Number(filters.tenure_upper)
  });

  /* ---------------- LOAD FILTERS ---------------- */

  useEffect(() => {

    axios
      .post(API_BASE + getFilterEndpoint(), {
        geo: "ALL",
        supervisor: "ALL",
        program: "ALL",
        lob: "ALL",
        client_name: "ALL"
      })
      .then(res => {
        setFilterOptions(res.data);
      });

  }, [viewBy]);

  /* ---------------- LOAD DATA ---------------- */

  useEffect(() => {

    setLoading(true);

    axios
      .post(API_BASE + getDataEndpoint(), buildPayload())
      .then(res => {

        const response = res.data;
        parseResponse(response);

        setLoading(false);

      })
      .catch(() => setLoading(false));

  }, [filters, viewBy]);

  /* ---------------- PARSE RESPONSE ---------------- */

  const parseResponse = response => {

    const firstKey = Object.keys(response)[0];
    if (!firstKey) return;

    const data = response[firstKey];

    setMetrics({
      aht: data.AHT,
      csat: data.CSAT?.overall,
      quality: data.CallQuality,
      adherence: data.Adherence,
      attrition: data.Attrition
    });

    buildHeatmap(response);
  };

  /* ---------------- BUILD HEATMAP TABLE ---------------- */

  const buildHeatmap = response => {

    const weeks = Object.keys(response);
    if (!weeks.length) return;

    const first = response[weeks[0]];
    const dates = Object.keys(first.CSAT.entry_dates);

    const cols = [
      { title: "Metric", dataIndex: "metric", fixed: "left" },
      { title: "Target", dataIndex: "target" }
    ];

    dates.forEach(d => {
      cols.push({
        title: d,
        dataIndex: d,
        render: val => (
          <div style={{ background: getColor(val), padding: 4 }}>
            {val}
          </div>
        )
      });
    });

    setTableColumns(cols);

    const rows = [
      buildMetricRow("AHT", response, "AHT", 657),
      buildMetricRow("CSAT", response, "csat_score", 90),
      buildMetricRow("Overall Quality", response, "CallQuality", 95),
      buildMetricRow("Adherence", response, "Adherence", 88),
      buildMetricRow("Attrition", response, "Attrition", 8)
    ];

    setTableData(rows);
  };

  const buildMetricRow = (label, data, key, target) => {

    const row = { metric: label, target };

    Object.values(data).forEach(week => {
      Object.keys(week.CSAT.entry_dates).forEach(date => {
        row[date] = week[key] || 0;
      });
    });

    return row;
  };

  /* ---------------- COLOR LOGIC ---------------- */

  const getColor = value => {
    if (value >= 95) return "#d7f5e9";
    if (value >= 85) return "#fff5d6";
    return "#fde2e1";
  };

  /* ---------------- UI ---------------- */

  return (

    <div style={{ padding: 24 }}>

      <h2>Concora Credit Inc</h2>

      <FilterBar
        filters={filters}
        setFilters={setFilters}
        filterOptions={filterOptions}
        viewBy={viewBy}
        setViewBy={setViewBy}
      />

      <Row gutter={16} style={{ marginTop: 20 }}>

        <KpiCard title="AHT (CS)" value={metrics.aht} target={657} unit="sec" />
        <KpiCard title="CSAT (CS)" value={metrics.csat} target={90} unit="%" />
        <KpiCard title="OVERALL QUALITY" value={metrics.quality} target={95} unit="%" />
        <KpiCard title="ADHERENCE" value={metrics.adherence} target={88} unit="%" />
        <KpiCard title="ATTRITION %" value={metrics.attrition} target={8} unit="%" />

      </Row>

      <div style={{ marginTop: 24 }}>

        {loading ? (
          <Spin />
        ) : (
          <Table
            columns={tableColumns}
            dataSource={tableData}
            pagination={false}
            scroll={{ x: true }}
          />
        )}

      </div>

    </div>
  );
}

/* ---------------- FILTER BAR ---------------- */

function FilterBar({ filters, setFilters, filterOptions, viewBy, setViewBy }) {

  return (
    <div
      style={{
        background: "#fff",
        padding: 16,
        borderRadius: 10,
        boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
        display: "flex",
        flexWrap: "wrap",
        gap: 10
      }}
    >

      <Select value={filters.year_type} onChange={v => setFilters({ ...filters, year_type: v })}>
        <Option value="Calendar Year">Calendar Year</Option>
        <Option value="Fiscal Year">Fiscal Year</Option>
      </Select>

      <Select value={filters.year} onChange={v => setFilters({ ...filters, year: v })}>
        <Option value={2025}>2025</Option>
        <Option value={2026}>2026</Option>
      </Select>

      <Select value={filters.month} onChange={v => setFilters({ ...filters, month: v })}>
        <Option value="January">January</Option>
        <Option value="February">February</Option>
        <Option value="March">March</Option>
      </Select>

      <Select value={filters.geo} onChange={v => setFilters({ ...filters, geo: v })}>
        {(filterOptions.geo || []).map(x => <Option key={x}>{x}</Option>)}
      </Select>

      <Select value={filters.client_name} onChange={v => setFilters({ ...filters, client_name: v })}>
        {(filterOptions.client || []).map(x => <Option key={x}>{x}</Option>)}
      </Select>

      <Select value={filters.program} onChange={v => setFilters({ ...filters, program: v })}>
        {(filterOptions.program || []).map(x => <Option key={x}>{x}</Option>)}
      </Select>

      <Select value={filters.lob} onChange={v => setFilters({ ...filters, lob: v })}>
        {(filterOptions.lob || []).map(x => <Option key={x}>{x}</Option>)}
      </Select>

      <Select value={filters.supervisor} onChange={v => setFilters({ ...filters, supervisor: v })}>
        {(filterOptions.supervisor || []).map(x => <Option key={x}>{x}</Option>)}
      </Select>

      <InputNumber
        value={filters.tenure_lower}
        onChange={v => setFilters({ ...filters, tenure_lower: v })}
        placeholder="Tenure Min"
      />

      <InputNumber
        value={filters.tenure_upper}
        onChange={v => setFilters({ ...filters, tenure_upper: v })}
        placeholder="Tenure Max"
      />

      <div style={{ marginLeft: "auto" }}>
        <Segmented
          options={["Day", "Week", "Month"]}
          value={viewBy}
          onChange={setViewBy}
        />
      </div>

    </div>
  );
}

/* ---------------- KPI CARD ---------------- */

function KpiCard({ title, value, target, unit }) {

  const percent = value ? (value / target) * 100 : 0;

  return (
    <Col span={4}>
      <Card>

        <div style={{ fontWeight: 600 }}>{title}</div>

        <div style={{ fontSize: 26, marginTop: 6 }}>
          {value} {unit}
        </div>

        <div style={{ marginTop: 10 }}>
          <Progress percent={percent} showInfo={false} />
          <div style={{ fontSize: 12 }}>Target: {target}</div>
        </div>

      </Card>
    </Col>
  );
}
