import "./hoverPreview.css";

const HoverPreview = ({ image }) => {
  if (!image) return null;

  return (
    <div className="hover-preview">
      <img src={image} alt="Preview" />
    </div>
  );
};

export default HoverPreview;

.hover-preview {
  position: absolute;
  top: 50%;
  left: 105%;
  transform: translateY(-50%);
  width: 260px;
  height: 180px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
  padding: 8px;
  z-index: 1000;
}

.hover-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 8px;
}

import { Card } from "antd";
import { useState } from "react";
import HoverPreview from "./HoverPreview";

function ServiceCard({
  iconBg,
  title,
  description,
  image,
}) {
  const [showPreview, setShowPreview] = useState(false);

  return (
    <div
      className="service-card-container"
      onMouseEnter={() => setShowPreview(true)}
      onMouseLeave={() => setShowPreview(false)}
      style={{ position: "relative" }}
    >
      <Card className="service-card" hoverable>
        <div
          className="service-icon"
          style={{ background: iconBg }}
        >
          🔧
        </div>

        <h3>{title}</h3>

        <p className="service-description">
          {description}
        </p>

        <div className="learn-more">
          Learn more →
        </div>
      </Card>

      {showPreview && <HoverPreview image={image} />}
    </div>
  );
}

export default ServiceCard;

.hover-preview {
  opacity: 0;
  animation: fadeIn 0.2s ease forwards;
}

@keyframes fadeIn {
  to {
    opacity: 1;
  }
}

