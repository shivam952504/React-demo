const safeSeries = (series || []).filter(v => typeof v === "number" && !isNaN(v));

const maxValue = safeSeries.length ? Math.max(...safeSeries) : 0;

const scaleMax = maxValue > 0 ? Math.ceil(maxValue / 50) * 50 : 50;

<div style={{ flex: 1 }}>
  <div
    style={{
      display: "flex",
      alignItems: "flex-end",
      height: "50px",
      width: "100%",
      gap: 4,
      overflow: "hidden"
    }}
  >
    {safeSeries.length === 0 ? (
      <div style={{ fontSize: 12, color: "#999" }}>No Data</div>
    ) : (
      safeSeries.map((v, i) => {
        const percent = Math.min((v / scaleMax) * 100, 100);
        const h = Math.max(percent, 3);

        return (
          <div
            key={i}
            style={{
              height: `${h}%`,
              width: 6,
              background: "#52c41a", // temporary fixed color
              borderRadius: 2
            }}
          />
        );
      })
    )}
  </div>
</div>



console.log("series:", series);
console.log("safeSeries:", safeSeries);
console.log("scaleMax:", scaleMax);


