import React, { useEffect, useState } from "react";
import axios from "axios";
import { Select, Card, Radio, Spin } from "antd";
import "./concoraAnalytics.css";

const API = "http://localhost:9009/api";

export default function ConcoraAnalytics() {

  const [viewBy, setViewBy] = useState("day");
  const [filters, setFilters] = useState({});
  const [filterOptions, setFilterOptions] = useState({});
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(false);

  const metrics = [
    "AHT",
    "CSAT",
    "CallQuality",
    "Adherence",
    "ProductionHours",
    "Absenteeism",
    "Shrinkage",
    "Attrition"
  ];

  useEffect(() => {
    fetchFilters();
    fetchData();
  }, [viewBy]);

  const fetchFilters = async () => {

    let endpoint = "";

    if (viewBy === "day")
      endpoint = "/get_concora_daily_filters/";
    if (viewBy === "week")
      endpoint = "/get_concora_weekly_filters/";
    if (viewBy === "month")
      endpoint = "/get_concora_monthly_filters/";

    const res = await axios.post(API + endpoint, {
      geo: "ALL",
      supervisor: "ALL",
      program: "ALL",
      lob: "ALL",
      client_name: "ALL"
    });

    setFilterOptions(res.data);
  };

  const fetchData = async () => {

    setLoading(true);

    let endpoint = "";

    if (viewBy === "day")
      endpoint = "/get_concora_daily_data/";
    if (viewBy === "week")
      endpoint = "/get_concora_weekly_data/";
    if (viewBy === "month")
      endpoint = "/get_concora_monthly_data/";

    const body = {
      geo: filters.geo || "ALL",
      supervisor: filters.supervisor || "ALL",
      program: filters.program || "ALL",
      lob: filters.lob || "ALL",
      client_name: filters.client_name || "ALL",
      year_type: "Calendar Year",
      year: 2026
    };

    const res = await axios.post(API + endpoint, body);

    setData(res.data);
    setLoading(false);
  };

  const getColor = (value) => {

    if (!value || value === 0) return "#f8d7da";
    if (value >= 95) return "#c6efce";
    if (value >= 85) return "#fff3cd";
    return "#f8d7da";
  };

  const columns = Object.keys(data || {});

  const getValue = (metric, col) => {

    if (!data[col]) return "-";

    if (metric === "CSAT") return data[col]?.CSAT?.overall || "-";

    return data[col][metric];
  };

  return (
    <div className="analytics-page">

      {/* FILTER BAR */}

      <div className="filter-box">

        <Select
          placeholder="Geography"
          style={{ minWidth: 180 }}
          options={(filterOptions.geo || []).map(v => ({ value: v, label: v }))}
          onChange={(v) => setFilters({ ...filters, geo: v })}
        />

        <Select
          placeholder="Program"
          style={{ minWidth: 200 }}
          options={(filterOptions.program || []).map(v => ({ value: v, label: v }))}
          onChange={(v) => setFilters({ ...filters, program: v })}
        />

        <Select
          placeholder="LOB"
          style={{ minWidth: 200 }}
          options={(filterOptions.lob || []).map(v => ({ value: v, label: v }))}
          onChange={(v) => setFilters({ ...filters, lob: v })}
        />

        <Select
          placeholder="Supervisor"
          style={{ minWidth: 220 }}
          options={(filterOptions.supervisor || []).map(v => ({ value: v, label: v }))}
          onChange={(v) => setFilters({ ...filters, supervisor: v })}
        />

        <Radio.Group
          value={viewBy}
          onChange={(e) => setViewBy(e.target.value)}
        >
          <Radio.Button value="day">Day</Radio.Button>
          <Radio.Button value="week">Week</Radio.Button>
          <Radio.Button value="month">Month</Radio.Button>
        </Radio.Group>

      </div>


      {/* KPI CARDS */}

      <div className="cards">

        {metrics.slice(0, 5).map(m => (

          <Card key={m} className="metric-card">

            <div className="metric-title">{m}</div>

            <div className="metric-value">
              {getValue(m, columns[0]) || "-"}
            </div>

          </Card>

        ))}

      </div>


      {/* TABLE */}

      <Spin spinning={loading}>

        <div className="table">

          <div className="table-header">

            <div className="metric-col">Metric</div>

            {columns.map(c => (
              <div key={c} className="date-col">
                {c}
              </div>
            ))}

          </div>

          {metrics.map(metric => (

            <div key={metric} className="table-row">

              <div className="metric-col">{metric}</div>

              {columns.map(col => {

                const value = getValue(metric, col);

                return (
                  <div
                    key={col}
                    className="value-cell"
                    style={{ background: getColor(value) }}
                  >
                    {value}
                  </div>
                );
              })}

            </div>

          ))}

        </div>

      </Spin>

    </div>
  );
}

.analytics-page{
padding:20px;
}

.filter-box{
display:flex;
gap:12px;
margin-bottom:20px;
padding:16px;
background:#fff;
box-shadow:0 2px 8px rgba(0,0,0,0.08);
border-radius:8px;
}

.cards{
display:flex;
gap:16px;
margin-bottom:20px;
}

.metric-card{
width:180px;
}

.metric-title{
font-size:13px;
color:#666;
}

.metric-value{
font-size:22px;
font-weight:600;
}

.table{
overflow-x:auto;
}

.table-header{
display:flex;
background:#f2f4f7;
padding:10px;
font-weight:600;
}

.table-row{
display:flex;
padding:8px 0;
}

.metric-col{
width:220px;
font-weight:500;
}

.date-col{
min-width:120px;
text-align:center;
}

.value-cell{
min-width:120px;
padding:8px;
border-radius:6px;
text-align:center;
margin:3px;
}
