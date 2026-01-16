import "./DashboardTicker.css";

const DashboardTicker = () => {
  const items = [
    "KPI improved by 3.2% across all geos",
    "Attrition reduced by 0.8% WoW",
    "Bonus payout increased in Q1",
    "SLA stable across all banking clients",
    "Headcount utilization above plan"
  ];

  return (
    <div className="ticker-container">
      <span className="ticker-label">Highlights</span>

      <div className="ticker-wrapper">
        <div className="ticker-move">
          {items.map((text, i) => (
            <span key={i} className="ticker-item">
              {text}
            </span>
          ))}

          {/* duplicate for seamless loop */}
          {items.map((text, i) => (
            <span key={`dup-${i}`} className="ticker-item">
              {text}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DashboardTicker;

.ticker-container {
  display: flex;
  align-items: center;
  background: #f7f9fc;
  border-radius: 10px;
  padding: 10px 14px;
  margin: 16px 0 24px;
  overflow: hidden;
}

.ticker-label {
  font-weight: 600;
  font-size: 13px;
  color: #1d4ed8;
  margin-right: 12px;
  white-space: nowrap;
}

.ticker-wrapper {
  overflow: hidden;
  flex: 1;
}

.ticker-move {
  display: inline-flex;
  align-items: center;
  animation: tickerScroll 28s linear infinite;
}

.ticker-item {
  font-size: 13px;
  color: #374151;
  margin-right: 40px;
  white-space: nowrap;
}

@keyframes tickerScroll {
  0% {
    transform: translateX(0);
  }
  100% {
    transform: translateX(-50%);
  }
}

<h1>Digital Cockpit</h1>
<p className="sub-title">
  Executive view across all banking clients
</p>

<DashboardTicker />

<Row gutter={[20, 20]}>
  {tiles.map(tile => (
    <Col key={tile.id} xs={24} sm={12} md={6}>
      <MetricTile {...tile} />
    </Col>
  ))}
</Row>
