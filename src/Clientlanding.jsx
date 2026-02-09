import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useParams, Outlet, Link } from "react-router-dom";
import { Breadcrumb, Tabs, Select } from "antd";
import apiClient from "../auth/apiClient";

const { Option } = Select;

function ClientLanding() {
  const navigate = useNavigate();
  const location = useLocation();
  const { clientSlug } = useParams();

  // 🔹 In-memory cache (SAFE)
  const cacheRef = useRef({});

  // 🔹 State
  const [jobCodes, setJobCodes] = useState(["ALL"]);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // 🔹 Active tab (unchanged logic)
  const activeTab = location.pathname.includes("KPI")
    ? "KPI"
    : location.pathname.includes("key-metrics")
    ? "key-metrics"
    : location.pathname.includes("people")
    ? "people"
    : "overview";

  // 🔹 Normalize job selection for API
  const normalizeJobCodes = (values) => {
    if (!values || values.length === 0) return ["ALL"];
    if (values.includes("ALL")) return ["ALL"];
    return values;
  };

  // 🔹 Fetch client landing data
  useEffect(() => {
    const cacheKey = `${clientSlug}_${jobCodes.sort().join(",")}`;

    // ✅ 1. Use cache if present
    if (cacheRef.current[cacheKey]) {
      setData(cacheRef.current[cacheKey]);
      setLoading(false);
      return;
    }

    const fetchClientData = async () => {
      setLoading(true);
      try {
        const res = await apiClient(
          `http://localhost:9009/api/client/${clientSlug}/landing`,
          {
            method: "POST",
            body: JSON.stringify({
              geo: ["ALL"],
              job: normalizeJobCodes(jobCodes),
              user_id: "",
            }),
          }
        );

        const json = await res.json();
        const result = json?.result;

        if (!result) {
          throw new Error("Invalid API response");
        }

        // ✅ Save in cache
        cacheRef.current[cacheKey] = result;

        setData(result);
      } catch (err) {
        console.error("Client landing API error", err);
      } finally {
        setLoading(false);
      }
    };

    fetchClientData();
  }, [clientSlug, jobCodes]);

  // 🔹 Tabs (unchanged)
  const tabItems =
    clientSlug === "concora"
      ? [
          { key: "overview", label: "Overview" },
          { key: "KPI", label: "KPI" },
          { key: "key-metrics", label: "Key Metrics Summary" },
          { key: "people", label: "People Summary" },
        ]
      : [{ key: "overview", label: "Overview" }];

  // 🔹 Client title formatting
  const formatClientName = (name) => {
    if (!name) return "";
    return name
      .toLowerCase()
      .split("_")
      .filter(Boolean)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
  };

  const clientTitle = data?.client_name
    ? formatClientName(data.client_name)
    : formatClientName(clientSlug);

  return (
    <div className="dashboard-page">
      <Breadcrumb
        items={[
          { title: <Link to="/">Dashboard</Link> },
          { title: clientTitle },
        ]}
      />

      {/* Header */}
      <div className="client-header">
        <div>
          <h2>{clientTitle}</h2>
          <div className="updated-text">
            Last updated {data?.last_updated}
          </div>
        </div>

        {/* 🔹 Job Code Multi-Select */}
        <Select
          mode="multiple"
          allowClear
          style={{ width: 220 }}
          value={jobCodes}
          onChange={(values) => setJobCodes(normalizeJobCodes(values))}
          placeholder="Select Job Codes"
        >
          <Option value="ALL">All Job Codes</Option>
          {data?.job_codes?.map((code) => (
            <Option key={code} value={code}>
              {code}
            </Option>
          ))}
        </Select>
      </div>

      {/* Tabs */}
      <Tabs
        activeKey={activeTab}
        items={tabItems}
        onChange={(key) =>
          navigate(`/client/${clientSlug}/landing/${key}`, {
            replace: true,
          })
        }
      />

      {/* Child routes */}
      <Outlet context={{ data, loading }} />
    </div>
  );
}

export default ClientLanding;
