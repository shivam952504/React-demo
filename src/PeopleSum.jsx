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
import LoaderOverlay from "../loader/LoaderOverlay";
import { clientCache } from "../../utils/clientCache";
import "./peopleSummary.css";

const COLORS = ["#1677ff", "#d9d9d9"];

/* ---------------- LINE CARD ---------------- */
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

/* ---------------- DONUT CARD ---------------- */
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
      <h2 className="center-value">{value}%</h2>
    </div>
  );
}

/* ---------------- RIGHT KPI CARD ---------------- */
function SideKpiCard({ label, value }) {
  return (
    <div className="side-kpi-card">
      <div className="side-kpi-label">{label}</div>
      <div className="side-kpi-value">{value}</div>
    </div>
  );
}

/* ---------------- MAIN ---------------- */
export default function PeopleSummary() {
  const { clientSlug } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cacheKey = `${clientSlug}_people`;

    if (clientCache[cacheKey]) {
      setData(clientCache[cacheKey]);
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `http://localhost:9009/api/client/${clientSlug}/people-summary`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ geo: "ALL", job: "ALL" }),
          }
        );
        const json = await res.json();
        clientCache[cacheKey] = json.result;
        setData(json.result);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [clientSlug]);

  if (!data) return <Skeleton active />;

  const metric = (name) =>
    data.metrics?.find((m) => m.name === name);

  return (
    <>
      <LoaderOverlay show={loading} />

      <Row gutter={[16, 16]}>
        {/* LEFT CONTENT */}
        <Col md={18}>
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
              <DonutCard
                title="Consultant Summary"
                value={
                  data.summaries?.find(
                    (s) => s.name === "Consultant Summary"
                  )?.tenure_distribution?.tenure || 0
                }
              />
            </Col>

            <Col md={8}>
              <DonutCard
                title="Support Summary"
                value={
                  data.summaries?.find(
                    (s) => s.name === "Support Summary"
                  )?.tenure_distribution?.tenure || 0
                }
              />
            </Col>

            <Col md={8}>
              <div className="metric-card center-card">
                <h4>Internal Promotion</h4>
                <h2 className="center-value">
                  {
                    data.summaries?.find(
                      (s) => s.name === "Internal Promotion"
                    )?.promotion_rate
                  }
                  %
                </h2>
                <p className="note">
                  {
                    data.summaries?.find(
                      (s) => s.name === "Internal Promotion"
                    )?.note
                  }
                </p>
              </div>
            </Col>
          </Row>
        </Col>

        {/* RIGHT SIDE KPI STACK */}
        <Col md={6}>
          <div className="side-kpi-wrapper">
            {data.kpis?.map((kpi, idx) => (
              <SideKpiCard
                key={idx}
                label={kpi.label}
                value={kpi.value}
              />
            ))}
          </div>
        </Col>
      </Row>
    </>
  );
}

.side-kpi-wrapper {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.side-kpi-card {
  background: linear-gradient(180deg, #0a2540, #102a43);
  border-radius: 16px;
  padding: 20px;
  height: 120px;
  color: #fff;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.side-kpi-label {
  font-size: 13px;
  opacity: 0.85;
}

.side-kpi-value {
  font-size: 28px;
  font-weight: 700;
  margin-top: 6px;
}
