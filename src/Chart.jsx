const HitRateTooltip = ({ active, payload }) => {
  if (!active || !payload || !payload.length) return null;

  const data = payload[0].payload;

  return (
    <div
      style={{
        background: "#000",
        color: "#fff",
        padding: "8px 12px",
        borderRadius: 6,
        fontSize: 12,
        lineHeight: 1.5,
      }}
    >
      <div style={{ fontWeight: 600, marginBottom: 4 }}>
        {data.lob}
      </div>
      <div>Hit Rate: {data.hit_rate}%</div>
      <div>Met: {data.met}, Missed: {data.miss}</div>
    </div>
  );
};

<Tooltip content={<HitRateTooltip />} cursor={{ fill: "rgba(0,0,0,0.05)" }} />

<ResponsiveContainer width="100%" height={250}>
  <BarChart data={per_lob}>
    <XAxis
      dataKey="lob"
      interval={0}
      angle={-15}
      textAnchor="end"
    />
    <YAxis
      domain={[0, 100]}
      tickFormatter={(v) => `${v}%`}
    />
    <Tooltip
      content={<HitRateTooltip />}
      cursor={{ fill: "rgba(0,0,0,0.05)" }}
    />
    <Bar dataKey="hit_rate" fill="#1677ff" />
  </BarChart>
</ResponsiveContainer>
