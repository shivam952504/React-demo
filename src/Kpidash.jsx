// more gap, cap bar width so weekly bars aren't huge
const barGap = total <= 6 ? 12 : total <= 15 ? 6 : 3;
const maxBarW = total <= 6 ? 40 : total <= 15 ? 28 : 999;
const barW  = total > 0
  ? Math.min(maxBarW, Math.max(2, (cW - barGap * (total - 1)) / total))
  : 8;
// center the bars in the chart area when total is small
const chartOffsetX = total > 0
  ? Math.max(0, (cW - (barW * total + barGap * (total - 1))) / 2)
  : 0;


