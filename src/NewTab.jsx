import { useState } from "react";
import { Row, Col } from "antd";
import MetricTile from "../MetricTile";
import ClientGeoJobTable from "../ClientGeoJobTable";

const KPI_TILES = [
  { id: "headcount", label: "Headcount KPI" },
  { id: "attrition", label: "Attrition KPI" },
  { id: "esat", label: "ESAT KPI" },
  { id: "nps", label: "NPS KPI" },
];

function KPI({ data }) {
  const [activeKpi, setActiveKpi] = useState(null);

  return (
    <>
      <Row gutter={[20, 20]}>
        {KPI_TILES.map((tile) => (
          <Col xs={24} sm={12} md={8} lg={6} key={tile.id}>
            <div
              onClick={() => setActiveKpi(tile.id)}
              style={{ cursor: "pointer" }}
            >
              <MetricTile
                label={tile.label}
                planned={null}
                actual={null}
                value={null}
                isPercent={false}
              />
            </div>
          </Col>
        ))}
      </Row>

      {/* Table shown only after clicking a tile */}
      {activeKpi && (
        <div style={{ marginTop: 24 }}>
          <ClientGeoJobTable
            data={data}
            kpiType={activeKpi}
          />
        </div>
      )}
    </>
  );
}

export default KPI;
<Route path="client/:clientSlug/landing/KPI" element={<KPI />} />


