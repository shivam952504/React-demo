import React from "react";

const CustomXAxisTick = ({ x, y, payload }) => {
  if (!payload?.value) return null;

  const value =
    payload.value.length > 14
      ? payload.value.slice(0, 14) + "…"
      : payload.value;

  return (
    <text
      x={x}
      y={y + 12}
      textAnchor="middle"
      fontSize={11}
      fill="#555"
    >
      {value}
    </text>
  );
};

export default CustomXAxisTick;
