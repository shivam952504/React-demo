import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "antd/dist/reset.css";
import "./styles/global.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

app.jsx
import { useState } from "react";
import Home from "./pages/Home";
import Result from "./pages/Result";

function App() {
  const [resultData, setResultData] = useState(null);

  return (
    <>
      {!resultData ? (
        <Home onSuccess={setResultData} />
      ) : (
        <Result data={resultData} />
      )}
    </>
  );
}

export default App;

api/client.jsx
import axios from "axios";

const client = axios.create({
  baseURL: "http://localhost:5000/api", // change when backend ready
  timeout: 10000,
});

export default client;

callService.jsx

import client from "./client";

// 🔹 Fake API simulation
export const processCallDocument = async (file) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        transcript_summary:
          "Customer Maggie Lee is starting a biological consulting business and requires commercial general liability and workers compensation insurance.",
        customer_details: {
          name: "Maggie Lee",
          email: "MaggieLeePH@gmail.com",
          zip: "94595",
        },
        overall_sentiment: "Interested",
        customer_feedback:
          "Customer actively engaged in discussion and requested quote via email.",
      });
    }, 5000);
  });
};

/*
🔹 WHEN BACKEND READY:
Replace above function with:

export const processCallDocument = async (file) => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await client.post("/process-call", formData);
  return response.data;
};
*/

export const sentimentColorMap = {
  interested: "green",
  positive: "green",
  neutral: "gold",
  amber: "gold",
  negative: "red",
  not_interested: "red",
};

loaderoverlay.jsx
import { Steps, Spin } from "antd";
import { useEffect, useState } from "react";

const LoaderOverlay = () => {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrent((prev) => (prev < 2 ? prev + 1 : prev));
    }, 1500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="overlay">
      <div className="overlay-box">
        <Spin size="large" />
        <Steps
          direction="vertical"
          current={current}
          items={[
            { title: "Reading Call" },
            { title: "Analysing Call" },
            { title: "Extracting & Generating Summary" },
          ]}
        />
      </div>
    </div>
  );
};

export default LoaderOverlay;

sentimentTag.jsx

import { Tag } from "antd";
import { sentimentColorMap } from "../constants/sentimentColors";

const SentimentTag = ({ sentiment }) => {
  const normalized = sentiment?.toLowerCase();
  const color = sentimentColorMap[normalized] || "default";

  return (
    <Tag color={color} style={{ fontSize: 15, padding: "6px 14px" }}>
      {sentiment}
    </Tag>
  );
};

export default SentimentTag;

resultCard.jsx
import { Card, Row, Col } from "antd";

const ResultCard = ({ title, children }) => {
  return (
    <Card className="result-card" bordered>
      <Row>
        <Col span={8} className="left-label">
          {title}
        </Col>
        <Col span={16} className="right-content">
          {children}
        </Col>
      </Row>
    </Card>
  );
};

export default ResultCard;

pages/home.jsx
import { useState } from "react";
import { Typography, Upload, Button } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import LoaderOverlay from "../components/LoaderOverlay";
import { processCallDocument } from "../api/callService";

const { Title, Paragraph } = Typography;

const Home = ({ onSuccess }) => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!file) return;

    setLoading(true);
    const response = await processCallDocument(file);
    setLoading(false);
    onSuccess(response);
  };

  return (
    <div className="home-container">
      {loading && <LoaderOverlay />}

      <Title>CallIntel AI</Title>
      <Paragraph className="subtitle">
        Agentic AI engine that converts conversations into actionable risk,
        CX, and operational insights.
      </Paragraph>

      <Upload
        beforeUpload={(file) => {
          setFile(file);
          return false;
        }}
        accept=".txt,.doc,.docx"
      >
        <Button icon={<UploadOutlined />}>Upload Document</Button>
      </Upload>

      <Button
        type="primary"
        size="large"
        style={{ marginTop: 20 }}
        onClick={handleSubmit}
      >
        Submit
      </Button>
    </div>
  );
};

export default Home;

pages/result.jsx

import { Typography } from "antd";
import ResultCard from "../components/ResultCard";
import SentimentTag from "../components/SentimentTag";

const { Title } = Typography;

const Result = ({ data }) => {
  return (
    <div className="result-container">
      <Title level={2}>Result</Title>

      <ResultCard title="Transcript Summary">
        {data.transcript_summary}
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
    </div>
  );
};

export default Result;


styleglobal.css
body {
  margin: 0;
  font-family: Arial, sans-serif;
}

.home-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background: linear-gradient(to right, #f5f7fa, #e4ecf5);
  text-align: center;
}

.subtitle {
  max-width: 600px;
  opacity: 0.7;
  margin-bottom: 30px;
}

.result-container {
  padding: 40px;
  background: #f4f6f9;
  min-height: 100vh;
}

.result-card {
  margin-bottom: 20px;
  border-radius: 10px;
}

.left-label {
  font-weight: 600;
  background: #fafafa;
  padding: 16px;
  border-right: 1px solid #f0f0f0;
}

.right-content {
  padding: 16px;
}

.overlay {
  position: fixed;
  inset: 0;
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(6px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.overlay-box {
  background: white;
  padding: 30px;
  border-radius: 12px;
  width: 350px;
}




