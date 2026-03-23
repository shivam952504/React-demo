const series = finalGraphDates
  .map(d => {
    const row = dataMap[d];

    if (!row) return null;

    if (title === "AHT (CS)") return row?.AHT ?? null;

    if (title === "CSAT (CS)") {
      const v = row?.CSAT?.csat_score;
      return v ? parseFloat(v.replace("%", "")) : null;
    }

    if (title === "CASE QUALITY") {
      const v = row?.case_quality?.overall_percentage;
      return v ? parseFloat(v.replace("%", "")) : null;
    }

    if (title === "ADHERENCE") return row?.Adherence ?? null;

    if (title === "PRODUCTION HOURS") return row?.ProductionHours ?? null;

    return null;
  })
  .filter(v => v !== null && !isNaN(v)); // ✅ FIX

const maxValue = series.length ? Math.max(...series) : 0;


let scaleMax = maxValue > 0 ? Math.ceil(maxValue / 50) * 50 : 50;

<span>{isNaN(scaleMax) ? 0 : scaleMax}</span>
<span>{isNaN(scaleMax) ? 0 : Math.round(scaleMax / 2)}</span>
<span>0</span>

  



