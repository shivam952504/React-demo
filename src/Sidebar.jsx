<div className="dashboard-page" style={{ maxHeight: "100vh" }}>
  <DashboardHeader
    selectedGeo={geo}
    geoOptions={geoOptions}
    updatedAt="05 Jan 2026, 10:52"
    onGeoChange={(value) => {
      setGeo(value);
    }}
  />

  {/* 👇 NEW FLEX WRAPPER */}
  <div
    className="dashboard-body"
    style={{
      display: "flex",
      width: "100%",
      minHeight: "calc(100vh - 64px)", // header height safe
    }}
  >
    {/* LEFT SIDEBAR */}
    <LeftSidebar />

    {/* RIGHT CONTENT */}
    <div
      className="dashboard-content"
      style={{
        flex: 1,
        padding: "16px",
        overflowX: "hidden",
      }}
    >
      <DashboardTicker />

      <Row gutter={[20, 20]}>
        {/* highlights cards */}
      </Row>

      <ClientKpiTable
        tableRows={clientTableData}
        data={clientHoverMap}
        geo={geo}
      />
    </div>
  </div>
</div>

.sidebar {
  transition: width 0.25s ease;
}
