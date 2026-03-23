const cleanSeries = (series || [])
  .map(v => Number(v))
  .filter(v => !isNaN(v) && v !== null);

const maxValue = cleanSeries.length ? Math.max(...cleanSeries) : 0;

// always safe scale
const scaleMax = maxValue > 0 ? Math.ceil(maxValue / 10) * 10 : 10;

{/* BARS */}
<div style={{ flex: 1 }}>
  <div
    style={{
      display: "flex",
      alignItems: "flex-end",
      height: "60px",
      width: "100%",
      gap: 4,
      overflow: "hidden"
    }}
  >
    {cleanSeries.length === 0 ? (
      <div style={{ fontSize: 12, color: "#999" }}>No Data</div>
    ) : (
      cleanSeries.map((v, i) => {
        const percent = (v / scaleMax) * 100;
        const height = Math.max(percent, 3); // minimum visible

        return (
          <div
            key={i}
            style={{
              width: viewBy === "day" ? 3 : viewBy === "month" ? 5 : 8,
              height: `${height}%`,
              background: color,
              borderRadius: 2
            }}
          />
        );
      })
    )}
  </div>
</div>

