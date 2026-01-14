<tbody>
  {table.rows.map((row, rowIndex) => (
    <tr key={rowIndex}>

      {/* LOB cell */}
      {row.show_lob && (
        <td
          className="lob-cell"
          rowSpan={row.rowspan}
        >
          {row.lob}
        </td>
      )}

      {/* Metric column */}
      <td className="metric-cell">
        {row.values?.Metric ?? "N/A"}
      </td>

      {/* Remaining columns */}
      {table.columns
        .filter(col => col !== "Metric")
        .map((col, i) => {
          const val = row.values?.[col];
          return (
            <td
              key={i}
              className={getCellClass(val)}
            >
              {val ?? "N/A"}
            </td>
          );
        })}
    </tr>
  ))}
</tbody>
