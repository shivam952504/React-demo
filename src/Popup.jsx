const HoverInfoPopup = ({ title, items, link }) => {
  return (
    <div style={popupStyle}>
      {title && (
        <div style={styles.title}>
          {title}
        </div>
      )}

      <div style={styles.body}>
        {items.map((item, idx) => (
          <div key={idx} style={styles.row}>
            <span style={styles.label}>{item.label}</span>
            <span style={styles.value}>{item.value}</span>
          </div>
        ))}
      </div>

      {link && (
        <a
          href={link}
          target="_blank"
          rel="noreferrer"
          style={styles.link}
        >
          View details →
        </a>
      )}
    </div>
  );
};

const popupStyle = {
  position: "absolute",
  top: "50%",
  left: "105%",
  transform: "translateY(-50%)",
  background: "#fff",
  padding: "14px",
  borderRadius: "10px",
  minWidth: "240px",
  boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
  zIndex: 1000,
  pointerEvents: "none"
};

const styles = {
  title: {
    fontWeight: 600,
    fontSize: 14,
    marginBottom: 10
  },
  body: {
    fontSize: 13
  },
  row: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: 6
  },
  label: {
    color: "#555"
  },
  value: {
    fontWeight: 500
  },
  link: {
    marginTop: 8,
    display: "inline-block",
    fontSize: 13
  }
};

export default HoverInfoPopup;

const tileHoverMap = {};

(result.hover_data?.tiles_hover || []).forEach(t => {
  tileHoverMap[t.id] = {
    title: t.details.title,
    items: [
      { label: "Value", value: t.details.metrics.value },
      { label: "Status", value: t.details.metrics.status }
    ],
    link: t.details.metrics.link
  };
});

setTileHoverMap(tileHoverMap);

const clientHoverMap = {};

(result.hover_data?.client_hover || []).forEach(c => {
  clientHoverMap[c.id] = {
    title: c.details.name,
    items: [
      { label: "Headcount", value: c.details.head_count },
      { label: "KPI", value: c.details.KPI },
      { label: "Bonus", value: c.details.Bonus }
    ],
    link: c.details.link
  };
});

setClientHoverMap(clientHoverMap);

const [hoverKey, setHoverKey] = useState(null);

<div
  style={{ position: "relative" }}
  onMouseEnter={() => setHoverKey(tile.id)}
  onMouseLeave={() => setHoverKey(null)}
>
  <MetricTile {...tileProps} />

  {hoverKey === tile.id && tileHoverMap[tile.id] && (
    <HoverInfoPopup {...tileHoverMap[tile.id]} />
  )}
</div>

<td>
  <div
    style={{ position: "relative", display: "inline-block" }}
    onMouseEnter={() => setHoverKey(row.client_name)}
    onMouseLeave={() => setHoverKey(null)}
  >
    <span className="client-name">
      {row.client_name}
    </span>

    {hoverKey === row.client_name &&
      clientHoverMap[row.client_name] && (
        <HoverInfoPopup
          {...clientHoverMap[row.client_name]}
        />
      )}
  </div>
</td>

