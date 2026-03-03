{
  title: "Reasoning",
  key: "reasoning",
  render: (_, record) => {
    if (record.isCategory) return null;

    return (
      <div>
        {/* Explanation */}
        <div>{record.explanation}</div>

        {/* Citation */}
        {record.citation && record.citation.length > 0 && (
          <div style={{ marginTop: 6, fontStyle: "italic", color: "#555" }}>
            {record.citation.map((cite, index) => (
              <div key={index}>
                “{cite}”
              </div>
            ))}
          </div>
        )}
      </div>
    );
  },
}
