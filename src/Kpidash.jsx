if(viewBy==="quarterly"){
  // handles "Q1", "Q1 2026", "2026-Q1", "1" etc.
  const wordQ = k.match(/^Quarter\s*(\d)/i);
  if(wordQ) return `Q${wordQ[1]}`;

  const qm = k.match(/Q(\d)/i);
  if(qm) return `Q${qm[1]}`;

  const nm = parseInt(k);
  if(!isNaN(nm) && nm >= 1 && nm <= 4) return `Q${nm}`;

  // ISO month → map to quarter  ← THIS IS THE KEY FIX
  const iso = k.match(/^(\d{4})-(\d{2})$/);
  if(iso){
    const mo = parseInt(iso[2]);
    return `Q${Math.ceil(mo/3)}-${iso[1]}`; // e.g. Q1-2026
  }

  // Handle "Quarter-2026-2" or "Quarter-2025-1" format from API
  const apiFormat = k.match(/^Quarter-(\d{4})-(\d)$/i);
  if(apiFormat) return `Q${apiFormat[2]}-${apiFormat[1]}`; // Q1-2026

  return k.substring(0, 2);
}
