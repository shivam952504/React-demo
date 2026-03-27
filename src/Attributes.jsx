import { Table, Tag, Collapse, Card, Row, Col, Statistic } from “antd”;
import { CaretRightOutlined } from “@ant-design/icons”;
import checklistData from “../data/result.json”;

const { Panel } = Collapse;

const getConfidenceColor = (score) => {
if (score >= 0.9 && score <= 1) return “#006400”; // dark green
if (score >= 0.8) return “#52c41a”; // light green
if (score >= 0.7) return “#faad14”; // amber
return “#f5222d”; // red
};

// Build category summary: { categoryName: { positive, total } }
const getCategorySummary = () => {
const summary = {};
let totalPositive = 0;
let totalAll = 0;

Object.entries(checklistData).forEach(([category, questions]) => {
const items = Object.values(questions);
const total = items.length;
const positive = items.filter(
(item) => String(item.value).toLowerCase() === “yes”
).length;
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

const AttributesChecklist = () => {
const { summary, totalPositive, totalAll } = getCategorySummary();
const columns = getColumns();

// Agent info (static for now — wire to props/data as needed)
const agentName = “Venus”;
const agentId = “xxx458”;

return (
<div>
{/* ── Top bar: Agent info + Attributes Summary ── */}
<Row gutter={16} style={{ marginBottom: 24 }} align=“stretch”>
{/* Agent Info */}
<Col flex="auto">
<Card
size=“small”
style={{
borderRadius: 10,
background: “linear-gradient(135deg, #f0f4ff 0%, #e6f7ff 100%)”,
border: “1px solid #d0e4ff”,
height: “100%”,
}}
>
<Row gutter={32} align=“middle” style={{ padding: “4px 0” }}>
<Col>
<Statistic
title={
<span style={{ color: “#595959”, fontWeight: 600 }}>
Agent Name
</span>
}
value={agentName}
valueStyle={{ fontSize: 18, color: “#1d39c4”, fontWeight: 700 }}
/>
</Col>
<Col>
<div
style={{
width: 1,
height: 48,
background: “#b0c4f0”,
}}
/>
</Col>
<Col>
<Statistic
title={
<span style={{ color: “#595959”, fontWeight: 600 }}>
Agent ID
</span>
}
value={agentId}
valueStyle={{ fontSize: 18, color: “#531dab”, fontWeight: 700 }}
/>
</Col>
</Row>
</Card>
</Col>

```
    {/* Attributes Summary Box */}
    <Col flex="360px">
      <Card
        size="small"
        title={
          <span style={{ fontWeight: 700, fontSize: 14 }}>
            Attributes Summary &nbsp;
            <Tag color="green" style={{ fontWeight: 700, fontSize: 13 }}>
              {totalPositive}/{totalAll} Positive
            </Tag>
          </span>
        }
        style={{
          borderRadius: 10,
          border: "1px solid #b7eb8f",
          background: "#f6ffed",
          height: "100%",
        }}
        bodyStyle={{ padding: "8px 12px" }}
      >
        {Object.entries(summary).map(([category, { positive, total }]) => {
          const allPositive = positive === total;
          const tagColor = allPositive ? "success" : positive === 0 ? "error" : "warning";
          return (
            <Row
              key={category}
              justify="space-between"
              align="middle"
              style={{ marginBottom: 4 }}
            >
              <Col>
                <span style={{ fontSize: 12, color: "#434343" }}>
                  {category}
                </span>
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
    </Col>
  </Row>

  {/* ── Collapsible category sections ── */}
  <Collapse
    accordion={false}
    expandIcon={({ isActive }) => (
      <CaretRightOutlined rotate={isActive ? 90 : 0} />
    )}
    style={{ background: "transparent", border: "none" }}
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
