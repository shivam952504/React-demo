const metricConfig = {
  AHT: (entry) => entry?.AHT || 0,

  CSAT: (entry) => {
    const v = entry?.CSAT?.csat_score;
    return v ? parseFloat(v.replace("%", "")) : 0;
  },

  CallQuality: (entry) => {
    const v = entry?.case_quality?.overall_percentage;
    return v ? parseFloat(v.replace("%", "")) : 0;
  },

  Adherence: (entry) => entry?.Adherence || 0,
  ProductionHours: (entry) => entry?.ProductionHours || 0,
};

const getter = metricConfig[metric.key];
value = getter ? getter(entry) : 0;
