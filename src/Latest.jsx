{
  title: "Sentiment",
  dataIndex: "sentiment_value",
  key: "sentiment",
  align: "center",
  render: (value) => {
    if (value === undefined || value === null) return "-";

    const sentimentMap = {
      0: { label: "0", color: "#d9d9d9" }, // white / neutral
      1: { label: "1", color: "#52c41a" }, // green
      2: { label: "2", color: "#faad14" }, // amber
      3: { label: "3", color: "#ff4d4f" }, // red
    };

    const sentiment = sentimentMap[value];

    return (
      <span
        style={{
          backgroundColor: sentiment.color,
          color: "#fff",
          padding: "4px 10px",
          borderRadius: "12px",
          fontWeight: 600,
          fontSize: "12px",
          display: "inline-block",
          minWidth: "24px",
        }}
      >
        {sentiment.label}
      </span>
    );
  },
},
