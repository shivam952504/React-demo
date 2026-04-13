const nums = (series || []).map(pt => {
  if (pt === null || pt === undefined) return { y: null, c: color };
  // check all possible value field names: y, v, pt_v, value
  const yVal = pt.y !== undefined ? pt.y
             : pt.v !== undefined ? pt.v
             : pt.pt_v !== undefined ? pt.pt_v
             : pt.value !== undefined ? pt.value
             : null;
  const yNum = (yVal !== null && yVal !== undefined && !isNaN(Number(yVal))) ? Number(yVal) : null;
  return { y: yNum, c: pt.c || pt.color || color };
});
