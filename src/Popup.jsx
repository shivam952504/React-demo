import "./hoverPopup.css";

const HoverPopup = ({ data }) => {
  if (!data) return null;

  return (
    <div className="hover-popup">
      <div className="hover-title">
        {data.title || data.name}
      </div>

      <div className="hover-body">
        {Object.entries(data)
          .filter(([key]) => !["title", "name", "link"].includes(key))
          .map(([key, value]) => (
            <div className="hover-row" key={key}>
              <span className="hover-label">{key}</span>
              <span className="hover-value">{value}</span>
            </div>
          ))}
      </div>

      {data.link && (
        <a
          href={data.link}
          target="_blank"
          rel="noreferrer"
          className="hover-link"
        >
          View details →
        </a>
      )}
    </div>
  );
};

export default HoverPopup;

.hover-popup {
  position: absolute;
  z-index: 1000;
  min-width: 220px;
  background: #ffffff;
  border-radius: 8px;
  padding: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  font-size: 13px;
}

.hover-title {
  font-weight: 600;
  margin-bottom: 8px;
  text-transform: capitalize;
}

.hover-body {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.hover-row {
  display: flex;
  justify-content: space-between;
}

.hover-label {
  color: #666;
  text-transform: capitalize;
}

.hover-value {
  font-weight: 600;
}

.hover-link {
  margin-top: 10px;
  display: inline-block;
  font-size: 12px;
  color: #1677ff;
  text-decoration: none;
}

 // Mapping hover data once
const tileHoverMap = Object.fromEntries(
  hover_data.tiles_hover.map(item => [
    item.id,
    item.details.metrics
  ])
);

const [hovered, setHovered] = useState(null);

<div
  onMouseEnter={() => setHovered("headcount")}
  onMouseLeave={() => setHovered(null)}
  style={{ position: "relative" }}
>
  <MetricTile title="Headcount" value={470} />

  {hovered === "headcount" && (
    <HoverPopup data={tileHoverMap["headcount"]} />
  )}
</div>

const clientHoverMap = Object.fromEntries(
  hover_data.client_hover.map(item => [
    item.id,
    item.details
  ])
);

// usage on client name

const [hoveredClient, setHoveredClient] = useState(null);

<span
  onMouseEnter={() => setHoveredClient(client.name)}
  onMouseLeave={() => setHoveredClient(null)}
  style={{ position: "relative", cursor: "pointer" }}
>
  {client.name}

  {hoveredClient === client.name && (
    <HoverPopup data={clientHoverMap[client.name]} />
  )}
</span>
