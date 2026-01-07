import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Breadcrumb, Select, Skeleton } from "antd";
import DashboardTiles from "../components/DashboardTiles";
import ClientGeoJobTable from "../components/ClientGeoJobTable";

const { Option } = Select;

function ClientLanding() {
  const { clientSlug } = useParams();
  const navigate = useNavigate();

  const cacheRef = useRef({}); // 🔥 CLIENT-LEVEL CACHE

  const [jobCode, setJobCode] = useState("ALL");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const cacheKey = `${clientSlug}_${jobCode}`;

    // ✅ USE CACHE IF EXISTS
    if (cacheRef.current[cacheKey]) {
      setData(cacheRef.current[cacheKey]);
      return;
    }

    const fetchClientData = async () => {
      setLoading(true);

      const res = await fetch(
        `http://localhost:8000/client/${clientSlug}/landing`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ job_code: jobCode }),
        }
      );

      const json = await res.json();

      cacheRef.current[cacheKey] = json.result; // 🔥 STORE IN CACHE
      setData(json.result);

      setLoading(false);
    };

    fetchClientData();
  }, [clientSlug, jobCode]);

  if (!data && loading) {
    return <Skeleton active paragraph={{ rows: 6 }} />;
  }

  return (
    <div className="dashboard-page">
      {/* 🔹 BREADCRUMB */}
      <Breadcrumb className="dashboard-breadcrumb">
        <Breadcrumb.Item onClick={() => navigate("/")}>
          Dashboard
        </Breadcrumb.Item>
        <Breadcrumb.Item>{data.client_name}</Breadcrumb.Item>
      </Breadcrumb>

      {/* 🔹 HEADER */}
      <div className="client-header">
        <div>
          <h2>{data.client_name}</h2>
          <div className="updated-text">
            Last updated {data.last_updated}
          </div>
        </div>

        <Select
          value={jobCode}
          onChange={setJobCode}
          style={{ width: 180 }}
        >
          <Option value="ALL">All Job Codes</Option>
          {data.job_codes.map((code) => (
            <Option key={code} value={code}>
              {code}
            </Option>
          ))}
        </Select>
      </div>

      {/* 🔹 KPI TILES */}
      <DashboardTiles tiles={data.tiles} />

      {/* 🔹 TABLE WITH ANIMATION */}
      <div className={`fade-wrapper ${loading ? "fade-loading" : "fade-in"}`}>
        <ClientGeoJobTable rows={data.table_rows} />
      </div>
    </div>
  );
}

export default ClientLanding;

/* Breadcrumb */
.dashboard-breadcrumb {
  margin-bottom: 12px;
  cursor: pointer;
}

/* Client header */
.client-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 12px 0 20px;
}

.client-header h2 {
  margin: 0;
  font-size: 22px;
  font-weight: 700;
}

.updated-text {
  font-size: 12px;
  color: #6b7280;
}

/* Fade animation */
.fade-wrapper {
  transition: opacity 0.25s ease-in-out;
}

.fade-loading {
  opacity: 0.4;
}

.fade-in {
  opacity: 1;
}

.client-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 12px 0 20px;
}

.client-header h2 {
  margin: 0;
  font-size: 22px;
  font-weight: 700;
}

.updated-text {
  font-size: 12px;
  color: #6b7280;
}

import { BrowserRouter, Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import ClientLanding from "./pages/ClientLanding";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/client/:clientSlug" element={<ClientLanding />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

{
  title: "Client",
  dataIndex: "client",
  fixed: "left",
  width: 220,
  render: (text, record) => (
    <a
      onClick={() => navigate(`/client/${record.url.split("/")[1]}`)}
      style={{ cursor: "pointer" }}
    >
      {text}
    </a>
  ),
}

import { useNavigate } from "react-router-dom";
const navigate = useNavigate();

