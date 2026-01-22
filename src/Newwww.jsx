import { useEffect, useRef, useState } from "react";
import {
  useNavigate,
  useParams,
  Outlet,
  useLocation,
  Navigate,
  Link
} from "react-router-dom";
import { Breadcrumb, Select, Tabs } from "antd";
import LoaderOverlay from "../loader/LoaderOverlay";

const { Option } = Select;

function ClientLanding() {
  const navigate = useNavigate();
  const { clientSlug } = useParams();
  const location = useLocation();

  const cacheRef = useRef({});
  const [jobCode, setJobCode] = useState("ALL");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  /* ---------------- ACTIVE TAB ---------------- */
  const activeTab = location.pathname.includes("key-metrics")
    ? "key-metrics"
    : location.pathname.includes("people")
    ? "people"
    : "overview";

  /* ---------------- FETCH CLIENT DATA ---------------- */
  useEffect(() => {
    const cacheKey = `${clientSlug}_${jobCode}`;

    if (cacheRef.current[cacheKey]) {
      setData(cacheRef.current[cacheKey]);
      setLoading(false);
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
            body: JSON.stringify({ geo: "ALL", job: jobCode })
          }
        );

        const json = await res.json();
        cacheRef.current[cacheKey] = json.result;
        setData(json.result);
      } catch (err) {
        console.error("Client landing fetch failed", err);
      } finally {
        setLoading(false);
      }
    };

    fetchClientData();
  }, [clientSlug, jobCode]);

  /* ---------------- FORCE DEFAULT OVERVIEW ROUTE ---------------- */
  if (location.pathname === `/client/${clientSlug}/landing`) {
    return <Navigate to="overview" replace />;
  }

  const tabItems = [
    { key: "overview", label: "Overview" },
    { key: "key-metrics", label: "Key Metrics Summary" },
    { key: "people", label: "People Summary" }
  ];

  return (
    <>
      <LoaderOverlay show={loading} />

      <div className="dashboard-page">
        {/* ---------------- BREADCRUMB ---------------- */}
        <Breadcrumb
          items={[
            { title: <Link to="/">Dashboard</Link> },
            { title: data?.client_name }
          ]}
        />

        {/* ---------------- HEADER ---------------- */}
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
            {data?.job_codes?.map(code => (
              <Option key={code} value={code}>
                {code}
              </Option>
            ))}
          </Select>
        </div>

        {/* ---------------- TABS ---------------- */}
        <Tabs
          activeKey={activeTab}
          items={tabItems}
          onChange={key =>
            navigate(`/client/${clientSlug}/landing/${key}`, {
              replace: true
            })
          }
        />

        {/* ---------------- TAB CONTENT ---------------- */}
        <Outlet context={{ data, loading }} />
      </div>
    </>
  );
}

export default ClientLanding;
