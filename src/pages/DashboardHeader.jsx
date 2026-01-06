import { Select } from "antd";

const { Option } = Select;

function DashboardHeader({
  selectedGeo = "ALL",
  geoOptions = ["ALL"],
  updatedAt,
  onGeoChange,
}) {
  return (
    <div className="dashboard-header-wrapper">
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
            <span className="geo-label">Geo</span>
            <Select
              size="small"
              value={selectedGeo}
              onChange={onGeoChange}
              className="geo-select"
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
    </div>
  );
}

export default DashboardHeader;

/* WRAPPER gives breathing space */
.dashboard-header-wrapper {
  padding: 16px 0 18px;
  margin-bottom: 18px;
  border-bottom: 1px solid #eef2f7;
}

/* MAIN HEADER ROW */
.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

/* LEFT */
.dashboard-header-left {
  display: flex;
  flex-direction: column;
}

.dashboard-title {
  font-size: 22px;
  font-weight: 700;
  color: #111827;
  line-height: 1.2;
}

.dashboard-subtitle {
  margin-top: 4px;
  font-size: 14px;
  color: #6b7280;
}

/* RIGHT */
.dashboard-header-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 6px;
}

/* GEO FILTER */
.geo-filter {
  display: flex;
  align-items: center;
  gap: 8px;
}

.geo-label {
  font-size: 13px;
  color: #374151;
  font-weight: 500;
}

.geo-select {
  min-width: 120px;
}

/* UPDATED */
.updated-text {
  font-size: 12px;
  color: #6b7280;
}
