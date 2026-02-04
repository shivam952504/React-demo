const [activeTab, setActiveTab] = useState("Overview");
const [activeKpiTile, setActiveKpiTile] = useState(null);

<button onClick={() => setActiveTab("KPI")}>KPI</button>
const kpiTiles = [
  { id: "headcount", label: "Headcount KPI" },
  { id: "attrition", label: "Attrition KPI" },
  { id: "nps", label: "NPS KPI" },
  { id: "esat", label: "ESAT KPI" },
  { id: "kpi_attainment", label: "KPI Attainment" },
];

function MetricTile({
  label,
  planned,
  actual,
  value,
  isPercent,
  clickable = false,
  onClick,
}) {
  return (
    <Card
      className="metric-tile"
      onClick={clickable ? onClick : undefined}
      style={{
        cursor: clickable ? "pointer" : "default",
      }}
    >
      <Text>{label}</Text>

      {/* Existing rendering stays SAME */}
      {actual != null && (
        <Title level={3}>
          {isPercent ? `${actual}%` : actual}
        </Title>
      )}

      {planned != null && (
        <Text>Planned: {planned}</Text>
      )}
    </Card>
  );
}


{activeTab === "KPI" && (
  <>
    <Row gutter={[20, 20]}>
      {kpiTiles.map(tile => (
        <Col xs={24} sm={12} md={8} lg={6} key={tile.id}>
          <MetricTile
            label={tile.label}
            clickable
            onClick={() => setActiveKpiTile(tile.id)}
          />
        </Col>
      ))}
    </Row>

    {/* TABLE SECTION */}
    {activeKpiTile && (
      <div style={{ marginTop: 24 }}>
        <KpiTable type={activeKpiTile} />
      </div>
    )}
  </>
)}

function KpiTable({ type }) {
  switch (type) {
    case "headcount":
      return <HeadcountTable />;
    case "attrition":
      return <AttritionTable />;
    case "nps":
      return <NpsTable />;
    case "esat":
      return <EsatTable />;
    default:
      return null;
  }
}

.metric-tile.active {
  border: 1px solid #1677ff;
}

className={activeKpiTile === tile.id ? "active" : ""}

  
