<Route path="/client/:clientSlug" element={<ClientPage />}>
  <Route index element={<OverviewTab />} />
  <Route path="key-metrics-summary" element={<KeyMetricsTab />} />
  <Route path="people-summary" element={<PeopleSummaryTab />} />
</Route>


import { NavLink, Outlet, useParams } from "react-router-dom";
import { Breadcrumb } from "antd";

function ClientPage() {
  const { clientSlug } = useParams();

  return (
    <div style={{ maxWidth: 1350, margin: "0 auto", padding: 20 }}>
      {/* Breadcrumb – NO reload */}
      <Breadcrumb
        items={[
          {
            title: <NavLink to="/dashboard">Dashboard</NavLink>,
          },
          {
            title: clientSlug.replace(/-/g, " "),
          },
        ]}
      />

      <h1 style={{ marginTop: 12 }}>{clientSlug.replace(/-/g, " ")}</h1>

      {/* Tabs */}
      <div style={{ marginTop: 16, display: "flex", gap: 24 }}>
        <NavLink end to="" className="tab">
          Overview
        </NavLink>
        <NavLink to="key-metrics-summary" className="tab">
          Key Metrics Summary
        </NavLink>
        <NavLink to="people-summary" className="tab">
          People Summary
        </NavLink>
      </div>

      <div style={{ marginTop: 24 }}>
        <Outlet />
      </div>
    </div>
  );
}

export default ClientPage;


import { useEffect, useRef, useState } from "react";
import { Skeleton } from "antd";
import { useParams } from "react-router-dom";

const cache = {};

export default function OverviewTab() {
  const { clientSlug } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (cache[clientSlug]) {
      setData(cache[clientSlug]);
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      const res = await fetch(
        `http://localhost:8000/client/${clientSlug}/landing`,
        { method: "POST" }
      );
      const json = await res.json();
      cache[clientSlug] = json.result;
      setData(json.result);
      setLoading(false);
    };

    fetchData();
  }, [clientSlug]);

  if (loading) return <Skeleton active />;

  return (
    <>
      {/* reuse your existing tiles + table */}
      {/* NO CHANGE in your existing logic */}
    </>
  );
}

import { useEffect, useState } from "react";
import { Row, Col, Skeleton } from "antd";
import { useParams } from "react-router-dom";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { clientCache } from "../utils/clientCache";

const COLORS = ["#1677ff", "#d9d9d9"];

function LineMetricCard({ title, data, target }) {
  return (
    <div className="metric-card">
      <h4>{title}</h4>
      <ResponsiveContainer width="100%" height={180}>
        <LineChart data={data}>
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip />
          {target && (
            <ReferenceLine
              y={target}
              stroke="#ff4d4f"
              strokeDasharray="4 4"
              label={`Target ${target}%`}
            />
          )}
          <Line
            type="monotone"
            dataKey="value"
            stroke="#1677ff"
            strokeWidth={2}
            dot
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function DonutCard({ title, value }) {
  const data = [
    { name: "value", value },
    { name: "remaining", value: 100 - value },
  ];

  return (
    <div className="metric-card">
      <h4>{title}</h4>
      <ResponsiveContainer width="100%" height={180}>
        <PieChart>
          <Pie
            data={data}
            innerRadius={55}
            outerRadius={75}
            dataKey="value"
          >
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i]} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <h2 style={{ textAlign: "center" }}>{value}%</h2>
    </div>
  );
}

export default function PeopleSummary() {
  const { clientSlug } = useParams();
  const [data, setData] = useState(null);

  useEffect(() => {
    const cacheKey = `${clientSlug}_people`;

    if (clientCache[cacheKey]) {
      setData(clientCache[cacheKey]);
      return;
    }

    const fetchPeople = async () => {
      const res = await fetch(
        `http://localhost:8000/client/${clientSlug}/people-summary`
      );
      const json = await res.json();
      clientCache[cacheKey] = json.result;
      setData(json.result);
    };

    fetchPeople();
  }, [clientSlug]);

  if (!data) return <Skeleton active />;

  const metric = (name) =>
    data.metrics.find((m) => m.name === name);

  return (
    <Row gutter={[16, 16]}>
      <Col md={8}>
        <LineMetricCard
          title="Absenteeism"
          data={metric("Absenteeism")?.values || []}
          target={metric("Absenteeism")?.target}
        />
      </Col>

      <Col md={8}>
        <LineMetricCard
          title="Shrinkage"
          data={metric("Shrinkage")?.values || []}
          target={metric("Shrinkage")?.target}
        />
      </Col>

      <Col md={8}>
        <LineMetricCard
          title="Attrition"
          data={metric("Attrition")?.values || []}
          target={metric("Attrition")?.target}
        />
      </Col>

      <Col md={8}>
        <DonutCard title="Consultant Summary" value={85} />
      </Col>

      <Col md={8}>
        <DonutCard title="Support Summary" value={100} />
      </Col>

      <Col md={8}>
        <div className="metric-card">
          <h4>Internal Promotion</h4>
          <h2 style={{ textAlign: "center" }}>85%</h2>
        </div>
      </Col>
    </Row>
  );
}

import { useEffect, useState } from "react";
import { Row, Col, Skeleton, Table } from "antd";
import { useParams } from "react-router-dom";
import { clientCache } from "../utils/clientCache";
import { normalizePercent } from "../utils/formatters";

function MetricTile({ label, planned, actual, isPercent }) {
  return (
    <div className="metric-card">
      <h4>{label}</h4>
      <p>Planned: {planned ?? "—"}</p>
      <h2>{isPercent ? normalizePercent(actual) : actual ?? "—"}</h2>
    </div>
  );
}

export default function KeyMetricsSummary() {
  const { clientSlug } = useParams();
  const [data, setData] = useState(null);

  useEffect(() => {
    const cacheKey = `${clientSlug}_metrics`;

    if (clientCache[cacheKey]) {
      setData(clientCache[cacheKey]);
      return;
    }

    const fetchMetrics = async () => {
      const res = await fetch(
        `http://localhost:8000/client/${clientSlug}/key-metrics`
      );
      const json = await res.json();
      clientCache[cacheKey] = json.result;
      setData(json.result);
    };

    fetchMetrics();
  }, [clientSlug]);

  if (!data) return <Skeleton active />;

  return (
    <>
      <Row gutter={[16, 16]}>
        {data.tiles.map((tile) => (
          <Col md={6} key={tile.id}>
            <MetricTile
              label={tile.label}
              planned={tile.planned}
              actual={tile.actual}
              isPercent={tile.is_percent}
            />
          </Col>
        ))}
      </Row>

      {data.tables.map((tbl) => (
        <div key={tbl.title} style={{ marginTop: 32 }}>
          <h3>{tbl.title}</h3>
          <Table
            bordered
            pagination={false}
            columns={tbl.columns.map((c) => ({
              title: c,
              dataIndex: c,
              key: c,
            }))}
            dataSource={tbl.rows.map((r, i) => ({
              key: i,
              ...r.values,
            }))}
          />
        </div>
      ))}
    </>
  );
}

import { Tabs } from "antd";
import { useNavigate, useParams } from "react-router-dom";
import PeopleSummary from "./PeopleSummary";
import KeyMetricsSummary from "./KeyMetricsSummary";

export default function ClientLanding() {
  const navigate = useNavigate();
  const { clientSlug, tab = "overview" } = useParams();

  return (
    <>
      <button
        onClick={() => navigate("/dashboard", { replace: true })}
        style={{ marginBottom: 16 }}
      >
        ← Back to Dashboard
      </button>

      <h1>{clientSlug.replace("-", " ")}</h1>

      <Tabs
        activeKey={tab}
        onChange={(key) =>
          navigate(`/client/${clientSlug}/${key}`, { replace: true })
        }
        items={[
          { key: "overview", label: "Overview" },
          { key: "key-metrics", label: "Key Metrics Summary", children: <KeyMetricsSummary /> },
          { key: "people", label: "People Summary", children: <PeopleSummary /> },
        ]}
      />
    </>
  );
}
