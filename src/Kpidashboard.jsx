if(viewBy==="quarterly"){
  const wordQ = k.match(/^Quarter\s*(\d)/i);
  if(wordQ) return `Q${wordQ[1]}`;

  // "Q1 2026" or "Q1-2026" with year
  const qWithYear = k.match(/Q(\d)[^0-9]*(\d{4})/i);
  if(qWithYear) return `Q${qWithYear[1]}(${qWithYear[2]})`;

  // "Quarter-2026-1" API format
  const apiFormat = k.match(/^Quarter-(\d{4})-(\d)$/i);
  if(apiFormat) return `Q${apiFormat[2]}(${apiFormat[1]})`;

  // ISO "2026-01" → Q1(2026)
  const iso = k.match(/^(\d{4})-(\d{2})$/);
  if(iso){
    const mo = parseInt(iso[2]);
    return `Q${Math.ceil(mo/3)}(${iso[1]})`;
  }

  // plain Q1/Q2 no year
  const qm = k.match(/Q(\d)/i);
  if(qm) return `Q${qm[1]}`;

  const nm = parseInt(k);
  if(!isNaN(nm) && nm >= 1 && nm <= 4) return `Q${nm}`;

  return k.substring(0, 2);
}


if (vb === "quarterly") {
  const wordQ = k.match(/^Quarter\s*(\d)/i);
  if (wordQ) return `Q${wordQ[1]}`;
  // "Q1 2026" or "Q1-2026" format
  const qWithYear = k.match(/Q(\d)[^0-9]*(\d{4})/i);
  if (qWithYear) return `Q${qWithYear[1]}(${qWithYear[2]})`;
  // "2026-Q1" or "Quarter-2026-1" API format
  const apiFmt = k.match(/^Quarter-(\d{4})-(\d)$/i);
  if (apiFmt) return `Q${apiFmt[2]}(${apiFmt[1]})`;
  // ISO date "2026-01" → Q1(2026)
  const iso = k.match(/^(\d{4})-(\d{2})$/);
  if (iso) return `Q${Math.ceil(parseInt(iso[2]) / 3)}(${iso[1]})`;
  // plain Q1/Q2
  const qm = k.match(/Q(\d)/i);
  if (qm) return `Q${qm[1]}`;
  const nm = parseInt(k);
  if (!isNaN(nm) && nm >= 1 && nm <= 4) return `Q${nm}`;
  return k.substring(0, 2);
}
