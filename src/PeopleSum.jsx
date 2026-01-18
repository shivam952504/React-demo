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

/* -------------------- LINE CARD -------------------- */
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

/* -------------------- DONUT CARD -------------------- */
function DonutCard({ title, value }) {
  const chartData = [
    { name: "value", value },
    { name: "remaining", value: 100 - value },
  ];

  return (
    <div className="metric-card">
      <h4>{title}</h4>

      <ResponsiveContainer width="100%" height={180}>
        <PieChart>
          <Pie
            data={chartData}
            innerRadius={55}
            outerRadius={75}
            dataKey="value"
          >
            {chartData.map((_, i) => (
              <Cell key={i} fill={COLORS[i]} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>

      <h2 className="center-value">{value}%</h2>
    </div>
  );
}

/* -------------------- MAIN COMPONENT -------------------- */
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

    const fetchPeople = async () => {
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

    fetchPeople();
  }, [clientSlug]);

  if (!data) return <Skeleton active />;

  const metric = (name) =>
    data.metrics?.find((m) => m.name === name);

  return (
    <>
      <LoaderOverlay show={loading} />

      <Row gutter={[16, 16]}>
        {/* --------- LINE CHARTS --------- */}
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

        {/* --------- DONUTS --------- */}
        <Col md={8}>
          <DonutCard
            title="Consultant Summary"
            value={
              data.summaries?.find((s) => s.name === "Consultant Summary")
                ?.tenure_distribution?.tenure || 0
            }
          />
        </Col>

        <Col md={8}>
          <DonutCard
            title="Support Summary"
            value={
              data.summaries?.find((s) => s.name === "Support Summary")
                ?.tenure_distribution?.tenure || 0
            }
          />
        </Col>

        {/* --------- INTERNAL PROMOTION --------- */}
        <Col md={8}>
          <div className="metric-card center-card">
            <h4>Internal Promotion</h4>
            <h2 className="center-value">
              {data.summaries?.find(
                (s) => s.name === "Internal Promotion"
              )?.promotion_rate || 0}
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
    </>
  );
}

.metric-card {
  background: #ffffff;
  border-radius: 16px;
  padding: 16px 18px;
  height: 300px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.metric-card h4 {
  margin-bottom: 8px;
  font-weight: 600;
}

.center-value {
  text-align: center;
  margin-top: -10px;
  font-size: 28px;
  font-weight: 600;
}

.center-card {
  align-items: center;
  justify-content: center;
  text-align: center;
}

.note {
  font-size: 12px;
  color: #888;
  margin-top: 8px;
}
