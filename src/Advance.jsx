import React, { useState } from "react";
import { Card, Tag, Modal, Button } from "antd";
import { ToolOutlined, InfoCircleOutlined } from "@ant-design/icons";
import HoverPopup from "./HoverPopup";

function ServiceCard({
  iconBg,
  title,
  description,
  comingSoon,
  image,
  link,               // Tile main link
  learnMoreLink,      // Learn more page link
  infoImage,          // Modal image
  infoText,           // Modal text
}) {
  const [showPreview, setShowPreview] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openModal = (e) => {
    e.stopPropagation();
    e.preventDefault();
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  return (
    <>
      {/* CARD CLICK LINK */}
      <a
        href={link}
        target="_blank"
        rel="noopener noreferrer"
        style={{ textDecoration: "none" }}
      >
        <Card
          className="service-card"
          hoverable
          onMouseEnter={() => setShowPreview(true)}
          onMouseLeave={() => setShowPreview(false)}
          style={{ position: "relative" }}
        >
          {/* INFO ICON TOP RIGHT */}
          <InfoCircleOutlined
            onClick={openModal}
            style={{
              position: "absolute",
              top: 16,
              right: 16,
              fontSize: 18,
              cursor: "pointer",
              color: "#555",
            }}
          />

          <div
            className="service-icon"
            style={{
              background: iconBg,
              width: 48,
              height: 48,
              borderRadius: 8,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 16,
            }}
          >
            <ToolOutlined style={{ color: "#fff", fontSize: 20 }} />
          </div>

          <div className="service-title-row">
            <h3 style={{ marginBottom: 0 }}>{title}</h3>
            {comingSoon && <Tag color="gold">Coming Soon</Tag>}
          </div>

          <p style={{ marginTop: 12 }}>{description}</p>

          {/* LEARN MORE BUTTON ON TILE */}
          {learnMoreLink && (
            <Button
              type="link"
              style={{ padding: 0 }}
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                window.open(learnMoreLink, "_blank");
              }}
            >
              Learn More →
            </Button>
          )}
        </Card>
      </a>

      {/* MODAL */}
      <Modal
        open={isModalOpen}
        onCancel={closeModal}
        footer={null}
        centered
        width="70%"
        styles={{
          body: {
            padding: 24,
            textAlign: "center",
          },
        }}
        style={{ backdropFilter: "blur(6px)" }}
      >
        {/* MODAL IMAGE */}
        {infoImage && (
          <img
            src={infoImage}
            alt="info"
            style={{
              width: "100%",
              maxHeight: "400px",
              objectFit: "contain",
              borderRadius: 8,
            }}
          />
        )}

        {/* MODAL TEXT */}
        {infoText && (
          <p style={{ marginTop: 20, fontSize: 16 }}>
            {infoText}
          </p>
        )}
      </Modal>
    </>
  );
}

export default ServiceCard;

<ServiceCard
  iconBg="#f97316"
  title="Bill to Pay"
  description="Manage and process bill payments efficiently"
  link="https://app.powerbi.com"
  learnMoreLink="/bill-details"
  infoImage={bill_to_pay}
  infoText="Detailed explanation about Bill to Pay service."
/>
