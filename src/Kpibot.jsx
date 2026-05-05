const STATIC_RESPONSES = {
  "Which agents have the highest AHT today?": "The top 5 agents with the highest AHT today are Catherine Ruiz, Hazel Grace Zurchito, Warren Medina, Katrina Mae Ghian Sevilla, and Leo Evangelio. Catherine Ruiz has the highest AHT among all agents, with values across the top group remaining closely clustered.\n\n| Rank | Agent Name | AHT |\n|------|-----------|-----|\n| 1 | Catherine Ruiz | 11,440 |\n| 2 | Hazel Grace Zurchito | 11,334 |\n| 3 | Warren Medina | 11,189 |\n| 4 | Katrina Mae Ghian Sevilla | 11,119 |\n| 5 | Leo Evangelio | 10,848 |\n\n**Insights:**\n- Catherine Ruiz leads with the highest AHT today\n- The variation between top 5 agents is minimal, indicating balanced distribution\n- No extreme outliers observed in AHT values",

  "How many agents are out of adherence right now?": "A total of **127 agents** are currently out of adherence (below 93%). This indicates a widespread adherence gap that may require immediate attention.\n\n| Agent Name | Adherence |\n|-----------|----------|\n| Rochelle Cruz | 68.43% |\n| Perlita de Leon | 74.12% |\n| Euben Ferrera Jr. | 82.94% |\n| Amirah Alay-ay | 83.14% |\n| Cezmark Pineda | 84.12% |\n| Mary Rose Rosario Fernandez | 86.00% |\n| Imelda Lata | 86.47% |\n| Warren Medina | 87.84% |\n| Showie Manansala | 89.41% |\n| Charlene Chao | 89.80% |\n\n**Insights:**\n- 127 agents are below the adherence threshold of 93%, indicating a broad performance issue\n- The lowest adherence observed is 68.43%, showing significant deviation in some cases\n- Most underperforming agents fall between 80%-90%, suggesting moderate gaps with a few severe outliers",

  "Which segments (30+, 60+, 90+) are underperforming?": "No tenure segments are currently underperforming. The 61-90 and 90+ segments have sufficient data and are performing above the 93% threshold. No agents are present in the lower tenure segments.\n\n| Segment | Avg Adherence | Agent Count | Status |\n|---------|--------------|-------------|--------|\n| 0-30 | No data | 0 | No data |\n| 31-60 | No data | 0 | No data |\n| 61-90 | 96% | — | On track |\n| 90+ | 94% | 123 | On track |\n\n**Insights:**\n- No agents fall within the 0-60 day tenure segments\n- Both active segments (61-90 and 90+) are performing above the 93% threshold\n- The 90+ segment has slightly lower adherence compared to 61-90 but remains within acceptable limits",
};


// REMOVE the old function:
const getStaticResponse = () => {
  return STATIC_RESPONSES[Math.floor(Math.random() * STATIC_RESPONSES.length)];
};

// REPLACE with:
const getStaticResponse = (query) => {
  // exact match first
  if (STATIC_RESPONSES[query]) return STATIC_RESPONSES[query];
  
  // fallback — find closest match
  const key = Object.keys(STATIC_RESPONSES).find(k =>
    k.toLowerCase().includes(query.toLowerCase()) ||
    query.toLowerCase().includes(k.toLowerCase().split(" ").slice(0,3).join(" "))
  );
  return key ? STATIC_RESPONSES[key] : "I can answer questions about AHT, adherence, and tenure segments. Please use the suggestion chips below.";
};

