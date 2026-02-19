import { Card, Modal } from "antd";
import { ToolOutlined } from "@ant-design/icons";
import { useState } from "react";

function ServiceCard({
  iconBg,
  title,
  description,
  image,
  comingSoon,
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Card
        className="service-card"
        hoverable
        onMouseEnter={() => image && setIsOpen(true)}
      >
        <div
          className="service-icon"
          style={{ background: iconBg }}
        >
          <ToolOutlined />
        </div>

        <h3>{title}</h3>

        <p className="service-description">
          {description}
        </p>

        {!comingSoon && (
          <div className="learn-more">
            Learn more →
          </div>
        )}
      </Card>

      {/* Popup Modal */}
      <Modal
        open={isOpen}
        footer={null}
        onCancel={() => setIsOpen(false)}
        centered
        width={600}
      >
        {image && (
          <img
            src={image}
            alt="Preview"
            style={{
              width: "100%",
              borderRadius: 12,
            }}
          />
        )}
      </Modal>
    </>
  );
}

export default ServiceCard;
