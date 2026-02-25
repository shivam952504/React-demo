import { Card, Tag } from "antd";

const ConfidenceLegend = () => {
  return (
    <div className="floating-legend">
      <Card size="small">
        <strong>Confidence Legend</strong>

        <div className="legend-item">
          <Tag style={{ backgroundColor: "#006400", color: "white" }}>
            90–100
          </Tag>
          High Confidence
        </div>

        <div className="legend-item">
          <Tag style={{ backgroundColor: "#52c41a", color: "white" }}>
            80–90
          </Tag>
          Medium Confidence
        </div>

        <div className="legend-item">
          <Tag style={{ backgroundColor: "#faad14", color: "white" }}>
            70–80
          </Tag>
          Low Confidence
        </div>

        <div className="legend-item">
          <Tag style={{ backgroundColor: "#f5222d", color: "white" }}>
            Below 70
          </Tag>
          Negative
        </div>
      </Card>
    </div>
  );
};

export default ConfidenceLegend;

import at results page
.floating-legend {
  position: fixed;
  bottom: 20px;
  right: 20px;
  width: 260px;
  z-index: 1000;
}

.floating-legend .ant-card {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  border-radius: 10px;
}

.legend-item {
  margin-top: 8px;
  font-size: 13px;
}
