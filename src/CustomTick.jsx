const CustomXAxisTick = ({ x, y, payload }) => {
  const MAX_CHARS_PER_LINE = 14;
  const MAX_LINES = 3;

  const text = payload.value;
  const words = text.split(" ");

  const lines = [];
  let currentLine = "";

  words.forEach(word => {
    if ((currentLine + word).length <= MAX_CHARS_PER_LINE) {
      currentLine += (currentLine ? " " : "") + word;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  });

  if (currentLine) lines.push(currentLine);

  const displayLines = lines.slice(0, MAX_LINES);
  const isTruncated = lines.length > MAX_LINES;

  if (isTruncated) {
    displayLines[MAX_LINES - 1] =
      displayLines[MAX_LINES - 1].slice(0, MAX_CHARS_PER_LINE - 3) + "...";
  }

  return (
    <g transform={`translate(${x},${y})`}>
      <title>{text}</title> {/* native hover tooltip */}
      <text
        textAnchor="middle"
        fill="#4b5563"
        fontSize={11}
      >
        {displayLines.map((line, index) => (
          <tspan
            key={index}
            x={0}
            dy={index === 0 ? "0.9em" : "1.1em"}
          >
            {line}
          </tspan>
        ))}
      </text>
    </g>
  );
};

<XAxis
  dataKey="lob"
  interval={0}
  height={70}
  tick={<CustomXAxisTick />}
/>

