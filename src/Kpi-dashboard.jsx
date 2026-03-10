import { useEffect, useState } from "react";
import { Row, Col, Card, Select, Table, Segmented } from "antd";
import LoaderOverlay from "../../loader/LoaderOverlay";
import { apiclient } from "../../auth/apiClient";

const { Option } = Select;

function KeyMetricsSummary() {

  const [loading, setLoading] = useState(false);

  const [viewBy, setViewBy] = useState("day");

  const [filters, setFilters] = useState({
    year: 0,
    month: "ALL",
    geo: "ALL",
    client_name: "ALL",
    program: "ALL",
    lob: "ALL",
    supervisor: "ALL"
  });

  const [filterOptions, setFilterOptions] = useState({
    month: [],
    year: [],
    geo: [],
    client_name: [],
    program: [],
    lob: [],
    supervisor: []
  });

  const [columns, setColumns] = useState([]);
  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState({});

  useEffect(() => {

    loadPage();

  }, []);

  useEffect(() => {

    fetchMetrics();

  }, [viewBy]);

  const loadPage = async () => {

    setLoading(true);

    try {

      await fetchFilters();
      await fetchMetrics();

    } catch (e) {

      console.error(e);

    }

    setLoading(false);

  };

  const fetchFilters = async () => {

    try {

      const res = await apiclient("/api/get_concora_daily_filters/", {
        method: "POST",
        body: JSON.stringify(filters)
      });

      const json = await res.json();

      setFilterOptions(json);

    } catch (e) {

      console.error("filter api error", e);

    }

  };

  const fetchMetrics = async () => {

    let api = "/api/Concora_csat_daily/";

    if (viewBy === "week") api = "/api/Concora_csat_weekly/";
    if (viewBy === "month") api = "/api/Concora_csat_monthly/";

    try {

      const res = await apiclient(api, {
        method: "POST",
        body: JSON.stringify(filters)
      });

      const json = await res.json();

      transformData(json);

    } catch (e) {

      console.error("metrics api error", e);

    }

  };

  const updateFilter = async (key, value) => {

    const updated = { ...filters, [key]: value };

    setFilters(updated);

    setLoading(true);

    try {

      const res = await apiclient("/api/get_concora_daily_filters/", {
        method: "POST",
        body: JSON.stringify(updated)
      });

      const json = await res.json();

      setFilterOptions(json);

      await fetchMetrics();

    } catch (e) {

      console.error(e);

    }

    setLoading(false);

  };

  const getColor = (value) => {

    if (value === "-" || value === null) return "";

    if (value >= 95) return "#d9f7be";

    if (value >= 85) return "#fff7e6";

    return "#ffd6d6";

  };

  const transformData = (data) => {

    const dates = Object.keys(data);

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

    const tableColumns = [
      {
        title: "Metric",
        dataIndex: "metric",
        fixed: "left",
        width: 220
      },
      {
        title: "Target",
        dataIndex: "target",
        align: "center",
        width: 120
      }
    ];

    dates.forEach((date) => {

      tableColumns.push({
        title: date,
        dataIndex: date,
        align: "center",
        width: 90,
        render: (value) => {

          const bg = getColor(value);

          return (
            <div
              style={{
                background: bg,
                padding: 6,
                borderRadius: 4
              }}
            >
              {value}
            </div>
          );

        }
      });

    });

    const tableRows = metrics.map(metric => {

      const row = {
        metric,
        target: "-"
      };

      dates.forEach(date => {

        const val = data[date][metric];

        if (typeof val === "object") {

          row[date] = val?.overall ?? "-";

        } else {

          row[date] = val ?? "-";

        }

      });

      return row;

    });

    setColumns(tableColumns);
    setRows(tableRows);

    const latest = dates[dates.length - 1];

    setSummary({
      aht: tableRows.find(r => r.metric === "AHT")?.[latest],
      csat: tableRows.find(r => r.metric === "CSAT")?.[latest],
      quality: tableRows.find(r => r.metric === "CallQuality")?.[latest],
      adherence: tableRows.find(r => r.metric === "Adherence")?.[latest]
    });

  };

  return (

    <div style={{ padding: 20 }}>

      <LoaderOverlay show={loading} />

      {/* FILTER BAR /}

      <Card style={{ marginBottom: 20 }}>

        <Row gutter={12} wrap>

          {viewBy === "day" && (
            <>
              <Col>

                <Select
                  style={{ width: 140 }}
                  value={filters.year}
                  onChange={(v) => updateFilter("year", v)}
                >
                  {filterOptions.year.map((y) => (
                    <Option key={y}>{y}</Option>
                  ))}
                </Select>

              </Col>

              <Col>

                <Select
                  style={{ width: 150 }}
                  value={filters.month}
                  onChange={(v) => updateFilter("month", v)}
                >
                  {filterOptions.month.map((m) => (
                    <Option key={m}>{m}</Option>
                  ))}
                </Select>

              </Col>
            </>
          )}

          <Col>

            <Select
              style={{ width: 160 }}
              value={filters.geo}
              onChange={(v) => updateFilter("geo", v)}
            >
              {filterOptions.geo.map((g) => (
                <Option key={g}>{g}</Option>
              ))}
            </Select>

          </Col>

          <Col>

            <Select
              style={{ width: 160 }}
              value={filters.client_name}
              onChange={(v) => updateFilter("client_name", v)}
            >
              {filterOptions.client_name.map((c) => (
                <Option key={c}>{c}</Option>
              ))}
            </Select>

          </Col>

          <Col>

            <Select
              style={{ width: 180 }}
              value={filters.program}
              onChange={(v) => updateFilter("program", v)}
            >
              {filterOptions.program.map((p) => (
                <Option key={p}>{p}</Option>
              ))}
            </Select>

          </Col>

          <Col>

            <Select
              style={{ width: 160 }}
              value={filters.lob}
              onChange={(v) => updateFilter("lob", v)}
            >
              {filterOptions.lob.map((l) => (
                <Option key={l}>{l}</Option>
              ))}
            </Select>

          </Col>

          <Col>

            <Segmented
              value={viewBy}
              onChange={setViewBy}
              options={[
                { label: "Day", value: "day" },
                { label: "Week", value: "week" },
                { label: "Month", value: "month" }
              ]}
            />

          </Col>

        </Row>

      </Card>

      {/ KPI CARDS /}

      <Row gutter={16} style={{ marginBottom: 20 }}>

        <Col span={6}>
          <Card>
            <div>AHT (CS)</div>
            <h2>{summary.aht ?? "-"}</h2>
          </Card>
        </Col>

        <Col span={6}>
          <Card>
            <div>CSAT</div>
            <h2>{summary.csat ?? "-"}</h2>
          </Card>
        </Col>

        <Col span={6}>
          <Card>
            <div>Overall Quality</div>
            <h2>{summary.quality ?? "-"}</h2>
          </Card>
        </Col>

        <Col span={6}>
          <Card>
            <div>Adherence</div>
            <h2>{summary.adherence ?? "-"}</h2>
          </Card>
        </Col>

      </Row>

      {/ HEATMAP TABLE */}

      <Table
        columns={columns}
        dataSource={rows}
        rowKey="metric"
        bordered
        pagination={false}
        scroll={{ x: "max-content" }}
      />

    </div>
  );
}

export default KeyMetricsSummary;
