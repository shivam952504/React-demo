const LOWER_IS_BETTER = ["aht","average handle time","formal substantiated","complaints","shrinkage","attrition","absenteeism"];
const isLowerBetter = LOWER_IS_BETTER.some(k => tile.label.toLowerCase().includes(k));

const meeting = isLowerBetter ? v <= targetN : v >= targetN;

