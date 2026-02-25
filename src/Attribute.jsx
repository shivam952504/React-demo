import { Table, Tag, Card, Row, Col } from "antd";
import checklistData from "../data/attributesChecklist.json";

const getConfidenceColor = (score) => {
  if (score >= 0.9 && score <= 1) return "#006400"; // dark green
  if (score >= 0.8) return "#52c41a"; // light green
  if (score >= 0.7) return "#faad14"; // amber
  return "#f5222d"; // red
};

const AttributesChecklist = () => {
  const flattenedData = [];

  Object.entries(checklistData).forEach(([category, questions]) => {
    flattenedData.push({
      key: category,
      isCategory: true,
      category,
    });

    Object.entries(questions).forEach(([id, item]) => {
      flattenedData.push({
        key: `${category}-${id}`,
        category,
        question: item.Question,
        answer: item.value,
        confidence: item.confidence_score,
        reasoning: item.explanation,
      });
    });
  });

  const columns = [
    {
      title: "Questions",
      dataIndex: "question",
      key: "question",
      render: (_, record) =>
        record.isCategory ? (
          <strong style={{ fontSize: 15 }}>{record.category}</strong>
        ) : (
          record.question
        ),
    },
    {
      title: "Answer",
      dataIndex: "answer",
      key: "answer",
      width: 140,
      render: (text, record) => {
        if (record.isCategory) return null;

        const color = getConfidenceColor(record.confidence);

        return (
          <Tag
            style={{
              backgroundColor: color,
              color: "white",
              fontWeight: 600,
              width: 80,
              textAlign: "center",
            }}
          >
            {text?.toUpperCase()}
          </Tag>
        );
      },
    },
    {
      title: "Reasoning",
      dataIndex: "reasoning",
      key: "reasoning",
      render: (text, record) =>
        record.isCategory ? null : text,
    },
  ];

  return (
    <>
      {/* 🔹 CONFIDENCE LEGEND */}
      <Card
        style={{
          marginBottom: 20,
          background: "#fafafa",
        }}
      >
        <strong>Confidence Score Legend:</strong>

        <Row gutter={16} style={{ marginTop: 12 }}>
          <Col>
            <Tag style={{ backgroundColor: "#006400", color: "white" }}>
              90–100
            </Tag>{" "}
            High Confidence
          </Col>

          <Col>
            <Tag style={{ backgroundColor: "#52c41a", color: "white" }}>
              80–90
            </Tag>{" "}
            Medium Confidence
          </Col>

          <Col>
            <Tag style={{ backgroundColor: "#faad14", color: "white" }}>
              70–80
            </Tag>{" "}
            Low Confidence
          </Col>

          <Col>
            <Tag style={{ backgroundColor: "#f5222d", color: "white" }}>
              Below 70
            </Tag>{" "}
            Negative / Very Low Confidence
          </Col>
        </Row>
      </Card>

      {/* 🔹 CHECKLIST TABLE */}
      <Table
        columns={columns}
        dataSource={flattenedData}
        pagination={false}
        bordered
      />
    </>
  );
};

export default AttributesChecklist;
