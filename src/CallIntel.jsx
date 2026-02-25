import { Table, Tag } from "antd";
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
      title: "Attributes",
      dataIndex: "question",
      key: "question",
      render: (_, record) =>
        record.isCategory ? (
          <strong>{record.category}</strong>
        ) : (
          record.question
        ),
    },
    {
      title: "Answer",
      dataIndex: "answer",
      key: "answer",
      width: 120,
      render: (text, record) => {
        if (record.isCategory) return null;

        const color = getConfidenceColor(record.confidence);

        return (
          <Tag
            style={{
              backgroundColor: color,
              color: "white",
              fontWeight: 600,
              width: 70,
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
    <Table
      columns={columns}
      dataSource={flattenedData}
      pagination={false}
      bordered
    />
  );
};

export default AttributesChecklist;


import { Typography, Button, Tabs } from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import ResultCard from "../components/ResultCard";
import SentimentTag from "../components/SentimentTag";
import AttributesChecklist from "../components/AttributesChecklist";

const { Title } = Typography;

const Result = ({ data, onBack }) => {
  const items = [
    {
      key: "1",
      label: "Summary",
      children: (
        <>
          <ResultCard title="Transcript Summary">
            <div className="scrollable-summary">
              {data.transcript_summary}
            </div>
          </ResultCard>

          <ResultCard title="Customer Details">
            <p><b>Name:</b> {data.customer_details.name}</p>
            <p><b>Email:</b> {data.customer_details.email}</p>
            <p><b>Zip:</b> {data.customer_details.zip}</p>
          </ResultCard>

          <ResultCard title="Overall Sentiment">
            <SentimentTag sentiment={data.overall_sentiment} />
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
  ];

  return (
    <div className="result-container">
      <Button
        icon={<ArrowLeftOutlined />}
        onClick={onBack}
        style={{ marginBottom: 20 }}
      >
        Back
      </Button>

      <Title level={2}>Result</Title>

      <Tabs defaultActiveKey="1" items={items} />
    </div>
  );
};

export default Result;
