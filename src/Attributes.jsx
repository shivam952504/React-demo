import { Table, Tag, Collapse, Card, Row, Col } from “antd”;
import { CaretRightOutlined } from “@ant-design/icons”;
import checklistData from “../data/result.json”;

const { Panel } = Collapse;

const getConfidenceColor = (score) => {
if (score >= 0.9 && score <= 1) return “#006400”;
if (score >= 0.8) return “#52c41a”;
if (score >= 0.7) return “#faad14”;
return “#f5222d”;
};

const isPositive = (value) => String(value).toLowerCase() === “yes”;

const getCategorySummary = () => {
const summary = {};
let totalPositive = 0;
let totalAll = 0;

Object.entries(checklistData).forEach(([category, questions]) => {
const items = Object.values(questions);
const total = items.length;
const positive = items.filter((item) => isPositive(item.value)).length;
summary[category] = { positive, total };
totalPositive += positive;
totalAll += total;
});

return { summary, totalPositive, totalAll };
};

const getColumns = () => [
{
title: “Attributes”,
dataIndex: “question”,
key: “question”,
render: (*, record) => record.question,
},
{
title: “Answer”,
dataIndex: “answer”,
key: “answer”,
width: 120,
render: (text, record) => {
const color = getConfidenceColor(record.confidence);
return (
<Tag
style={{
backgroundColor: color,
color: “white”,
fontWeight: 600,
width: 70,
textAlign: “center”,
border: “none”,
}}
>
{text?.toUpperCase()}
</Tag>
);
},
},
{
title: “Reasoning”,
key: “reasoning”,
render: (*, record) => (
<div>
<div>{record.reasoning}</div>
{record.citation && record.citation.length > 0 && (
<div style={{ marginTop: 6, fontStyle: “italic”, color: “#555” }}>
{record.citation.map((cite, index) => (
<div key={index}>{`"${cite}"`}</div>
))}
</div>
)}
</div>
),
},
];

// ── Exported: render this in Result.jsx top-right area ───────────────────────
export const AgentSummaryBoxes = ({ agentName = “Venus”, agentId = “xxx458” }) => {
const { summary, totalPositive, totalAll } = getCategorySummary();

return (
<div style={{ display: “flex”, gap: 12, alignItems: “flex-start” }}>
{/* Agent Info */}
<Card
size=“small”
style={{
borderRadius: 10,
background: “linear-gradient(135deg, #f0f4ff 0%, #e6f7ff 100%)”,
border: “1px solid #d0e4ff”,
minWidth: 200,
}}
bodyStyle={{ padding: “10px 16px” }}
>
<div style={{ display: “flex”, gap: 24, alignItems: “center” }}>
<div>
<div style={{ fontSize: 11, color: “#8c8c8c”, fontWeight: 600, marginBottom: 2 }}>
Agent Name
</div>
<div style={{ fontSize: 15, color: “#1d39c4”, fontWeight: 700 }}>
{agentName}
</div>
</div>
<div style={{ width: 1, height: 36, background: “#b0c4f0” }} />
<div>
<div style={{ fontSize: 11, color: “#8c8c8c”, fontWeight: 600, marginBottom: 2 }}>
Agent ID
</div>
<div style={{ fontSize: 15, color: “#531dab”, fontWeight: 700 }}>
{agentId}
</div>
</div>
</div>
</Card>

```
  {/* Attributes Summary */}
  <Card
    size="small"
    title={
      <span style={{ fontWeight: 700, fontSize: 13 }}>
        Attributes Summary{" "}
        <Tag color="green" style={{ fontWeight: 700, fontSize: 12, marginLeft: 4 }}>
          {totalPositive}/{totalAll} Positive
        </Tag>
      </span>
    }
    style={{
      borderRadius: 10,
      border: "1px solid #b7eb8f",
      background: "#f6ffed",
      minWidth: 280,
    }}
    bodyStyle={{ padding: "8px 12px" }}
  >
    {Object.entries(summary).map(([category, { positive, total }]) => {
      const tagColor =
        positive === total ? "success" : positive === 0 ? "error" : "warning";
      return (
        <Row key={category} justify="space-between" align="middle" style={{ marginBottom: 4 }}>
          <Col>
            <span style={{ fontSize: 12, color: "#434343" }}>{category}</span>
          </Col>
          <Col>
            <Tag color={tagColor} style={{ margin: 0, fontSize: 11 }}>
              {positive}/{total} positive
            </Tag>
          </Col>
        </Row>
      );
    })}
  </Card>
</div>
```

);
};

// ── Default export: checklist only (no boxes here) ────────────────────────────
const AttributesChecklist = () => {
const { summary } = getCategorySummary();
const columns = getColumns();

return (
<div>
<Collapse
accordion={false}
expandIcon={({ isActive }) => (
<CaretRightOutlined rotate={isActive ? 90 : 0} />
)}
style={{ background: “transparent”, border: “none” }}
defaultActiveKey={[]}
>
{Object.entries(checklistData).map(([category, questions]) => {
const rows = Object.entries(questions).map(([id, item]) => ({
key: `${category}-${id}`,
category,
question: item.Question,
answer: item.value,
confidence: item.confidence_score,
reasoning: item.explanation,
citation: item.citation,
}));

```
      const catSummary = summary[category];
      const tagColor =
        catSummary.positive === catSummary.total
          ? "success"
          : catSummary.positive === 0
          ? "error"
          : "warning";

      return (
        <Panel
          key={category}
          header={
            <Row justify="space-between" align="middle" style={{ width: "100%" }}>
              <Col>
                <strong style={{ fontSize: 14 }}>{category}</strong>
              </Col>
              <Col>
                <Tag color={tagColor} style={{ marginRight: 24 }}>
                  {catSummary.positive}/{catSummary.total} positive
                </Tag>
              </Col>
            </Row>
          }
          style={{
            marginBottom: 8,
            borderRadius: 8,
            border: "1px solid #d9d9d9",
            background: "#fff",
            overflow: "hidden",
          }}
        >
          <Table
            columns={columns}
            dataSource={rows}
            pagination={false}
            bordered
            size="small"
          />
        </Panel>
      );
    })}
  </Collapse>
</div>
```

);
};

export default AttributesChecklist;


import { Typography, Button, Tabs } from “antd”;
import { ArrowLeftOutlined } from “@ant-design/icons”;
import ResultCard from “../components/ResultCard”;
import SentimentTag from “../components/SentimentTag”;
import AttributesChecklist, { AgentSummaryBoxes } from “../components/AttributesChecklist”;
import ConfidenceLegend from “../components/ConfidenceLegend”;
import { useState } from “react”;

const { Title } = Typography;

const Result = ({ data, onBack }) => {
const [activeTab, setActiveTab] = useState(“1”);

const items = [
{
key: “1”,
label: “Summary”,
children: (
<>
<ResultCard title="Customer Details">
<p><b>Name:</b> {data.customer_details.name}</p>
<p><b>Email:</b> {data.customer_details.email}</p>
<p><b>Zip:</b> {data.customer_details.zip}</p>
</ResultCard>

```
      <ResultCard title="Transcript Summary">
        <div className="scrollable-summary">
          {data.transcript_summary}
        </div>
      </ResultCard>

      <ResultCard title="Overall Sentiment">
        {/* keep whatever you had here */}
      </ResultCard>

      <ResultCard title="Customer Feedback">
        {data.customer_feedback}
      </ResultCard>
    </>
  ),
},
{
  key: "2",
  label: "Attributes Checklist",
  children: <AttributesChecklist />,
},
```

];

return (
<div className="result-container">
{/* ── Back button ── */}
<Button
icon={<ArrowLeftOutlined />}
onClick={onBack}
style={{ marginBottom: 20 }}
>
Back
</Button>

```
  {/* ── Top row: "Result" title on left, boxes on right ── */}
  <div
    style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: 16,
      gap: 16,
    }}
  >
    <Title level={2} style={{ margin: 0 }}>Result</Title>

    {/* Always visible top-right, regardless of which tab is active */}
    <AgentSummaryBoxes
      agentName={data?.agent_name || "Venus"}
      agentId={data?.agent_id || "xxx458"}
    />
  </div>

  {/* ── Tabs ── */}
  <Tabs
    defaultActiveKey="1"
    items={items}
    onChange={(key) => setActiveTab(key)}
  />

  {/* Confidence legend shown only on checklist tab */}
  {activeTab === "2" && <ConfidenceLegend />}
</div>
```

);
};

export default Result;

  import AttributesChecklist, { AgentSummaryBoxes } from "../components/AttributesChecklist";


  
  
