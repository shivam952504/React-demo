const scrollRef = React.useRef(null);

const [scrollState, setScrollState] = React.useState({
  left: false,
  right: true,
});

const handleScroll = () => {
  const el = scrollRef.current;
  if (!el) return;

  setScrollState({
    left: el.scrollLeft > 5,
    right: el.scrollLeft + el.clientWidth < el.scrollWidth - 5,
  });
};

<div style={{ position: "relative", margin: "24px 0" }}>

  {/* LEFT FADE */}
  {scrollState.left && <div style={fadeLeft} />}

  {/* RIGHT FADE */}
  {scrollState.right && <div style={fadeRight} />}

  {/* LEFT BUTTON */}
  {scrollState.left && (
    <button
      onClick={() => scrollRef.current.scrollBy({ left: -320, behavior: "smooth" })}
      style={arrowStyle("left")}
    >
      ‹
    </button>
  )}

  {/* RIGHT BUTTON */}
  {scrollState.right && (
    <button
      onClick={() => scrollRef.current.scrollBy({ left: 320, behavior: "smooth" })}
      style={arrowStyle("right")}
    >
      ›
    </button>
  )}

  {/* SCROLL CONTAINER */}
  <div
    ref={scrollRef}
    onScroll={handleScroll}
    style={{
      display: "flex",
      gap: 16,
      overflowX: "auto",
      padding: "8px 48px",
      scrollBehavior: "smooth",
      scrollSnapType: "x mandatory",
    }}
  >

   {tileData?.AHT !== undefined && (
  <div style={tileWrapper}>
    {renderKpi("AHT (CS)", tileData.AHT, "sec", metrics?.ahtTarget)}
  </div>
)}

{tileData?.CSAT && (
  <div style={tileWrapper}>
    {renderKpi("CSAT (CS)", tileData.CSAT.overall, "%", metrics?.csatTarget)}
  </div>
)}

{tileData?.case_quality !== undefined && (
  <div style={tileWrapper}>
    {renderKpi("CASE QUALITY", tileData.case_quality?.overall_percentage, "%", metrics?.qualityTarget)}
  </div>
)}

{tileData?.Adherence !== undefined && (
  <div style={tileWrapper}>
    {renderKpi("ADHERENCE", tileData.Adherence, "%", metrics?.adherenceTarget)}
  </div>
)}

{tileData?.ProductionHours !== undefined && (
  <div style={tileWrapper}>
    {renderKpi("PRODUCTION HOURS", tileData.ProductionHours, "", metrics?.productionTarget)}
  </div>
)}
  </div>
</div>
const tileWrapper = {
  minWidth: 280,
  flex: "0 0 auto",
  scrollSnapAlign: "start",
};
const arrowStyle = (side) => ({
  position: "absolute",
  top: "50%",
  [side]: 8,
  transform: "translateY(-50%)",
  zIndex: 10,
  background: "#fff",
  border: "none",
  borderRadius: "50%",
  width: 36,
  height: 36,
  fontSize: 20,
  cursor: "pointer",
  boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
});

const arrowStyle = (side) => ({
  position: "absolute",
  top: "50%",
  [side]: 8,
  transform: "translateY(-50%)",
  zIndex: 10,
  background: "#fff",
  border: "none",
  borderRadius: "50%",
  width: 36,
  height: 36,
  fontSize: 20,
  cursor: "pointer",
  boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
});



    
