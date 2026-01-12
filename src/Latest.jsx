import { useEffect, useRef, useState } from "react";
import { useNavigate, Link, useParams, Outlet } from "react-router-dom";
import { Breadcrumb, Select, Skeleton, Tabs } from "antd";

const { Option } = Select;

function ClientLanding() {
  const navigate = useNavigate();
  const { clientSlug, tab = "overview" } = useParams();

  const cacheRef = useRef({});
  const [jobCode, setJobCode] = useState("ALL");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  /* ---------------- FETCH CLIENT DATA ---------------- */
  useEffect(() => {
    const cacheKey = `${clientSlug}_${jobCode}`;

    if (cacheRef.current[cacheKey]) {
      setData(cacheRef.current[cacheKey]);
      return;
    }

    const fetchClientData = async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `http://localhost:9009/api/client/${clientSlug}/landing`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ geo: "ALL", job: jobCode }),
          }
        );

        const json = await res.json();
        cacheRef.current[cacheKey] = json.result;
        setData(json.result);
      } finally {
        setLoading(false);
      }
    };

    fetchClientData();
  }, [clientSlug, jobCode]);

  if (!data && loading) {
    return <Skeleton active paragraph={{ rows: 6 }} />;
  }

  return (
    <div className="dashboard-page">
      {/* -------- BREADCRUMB -------- */}
      <Breadcrumb
        items={[
          { title: <Link to="/">Dashboard</Link> },
          { title: data?.client_name },
        ]}
      />

      {/* -------- HEADER -------- */}
      <div className="client-header">
        <div>
          <h2>{data?.client_name}</h2>
          <div className="updated-text">
            Last updated {data?.last_updated}
          </div>
        </div>

        <Select
          value={jobCode}
          onChange={setJobCode}
          style={{ width: 180 }}
        >
          <Option value="ALL">All Job Codes</Option>
          {data?.job_codes?.map((code) => (
            <Option key={code} value={code}>
              {code}
            </Option>
          ))}
        </Select>
      </div>

      {/* -------- TABS (ROUTER-DRIVEN) -------- */}
      <Tabs
        activeKey={tab}
        onChange={(key) =>
          navigate(`/client/${clientSlug}/landing/${key}`, {
            replace: true,
          })
        }
        items={[
          { key: "overview", label: "Overview" },
          { key: "key-metrics", label: "Key Metrics Summary" },
          { key: "people", label: "People Summary" },
        ]}
      />

      {/* -------- TAB CONTENT RENDERED HERE -------- */}
      <Outlet context={{ data, loading }} />
    </div>
  );
}

export default ClientLanding;

import { Skeleton } from "antd";
import MetricTile from "../MetricTile";
import ClientGeoJobTable from "../ClientGeoJobTable";
import { useOutletContext } from "react-router-dom";

function Overview() {
  const { data, loading } = useOutletContext();

  if (!data && loading) {
    return <Skeleton active paragraph={{ rows: 4 }} />;
  }

  return (
    <>
      {/* KPI TILES */}
      <div className="client-tiles-grid">
        {data?.tiles?.map((metric) => (
          <MetricTile
            key={metric.id}
            label={metric.label}
            planned={metric.planned}
            actual={metric.actual}
            value={metric.actual}
            isPercent={metric.is_percent}
          />
        ))}
      </div>

      {/* TABLE */}
      <div className={`fade-wrapper ${loading ? "fade-loading" : "fade-in"}`}>
        <ClientGeoJobTable rows={data?.table_rows} />
      </div>
    </>
  );
}

export default Overview;
