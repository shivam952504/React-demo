import { Select } from "antd";

const { Option } = Select;

function DashboardHeader({
  selectedGeo = "ALL",
  geoOptions = ["ALL"],
  updatedAt,
  onGeoChange,
}) {
  return (
    <div className="dashboard-header">
      {/* LEFT */}
      <div className="dashboard-header-left">
        <div className="dashboard-title">Digital Cockpit</div>
        <div className="dashboard-subtitle">
          Executive view across all banking clients
        </div>
      </div>

      {/* RIGHT */}
      <div className="dashboard-header-right">
        <div className="geo-filter">
          <span className="geo-label">Geo:</span>

          <Select
            size="small"
            value={selectedGeo}
            onChange={onGeoChange}
            style={{ width: 120 }}
          >
            {geoOptions.map((geo) => (
              <Option key={geo} value={geo}>
                {geo === "ALL" ? "All geos" : geo}
              </Option>
            ))}
          </Select>
        </div>

        <div className="updated-text">
          Updated: {updatedAt}
        </div>
      </div>
    </div>
  );
}

export default DashboardHeader;

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 22px;
}

.dashboard-header-left {
  display: flex;
  flex-direction: column;
}

.dashboard-title {
  font-size: 22px;
  font-weight: 700;
  color: #111827;
}

.dashboard-subtitle {
  font-size: 14px;
  color: #6b7280;
  margin-top: 2px;
}

.dashboard-header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.geo-filter {
  display: flex;
  align-items: center;
  gap: 6px;
}

.geo-label {
  font-size: 13px;
  color: #374151;
}

.updated-text {
  font-size: 12px;
  color: #6b7280;
}

import DashboardHeader from "../components/DashboardHeader";

<DashboardHeader
  selectedGeo="ALL"
  geoOptions={["ALL", "US", "India"]}
  updatedAt="05 Jan 2026, 10:52"
  onGeoChange={(value) => {
    console.log("Geo changed:", value);
    // call API again here
  }}
/>
