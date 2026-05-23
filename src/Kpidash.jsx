// ═══════════════════════════════════════════════════════════════════════
//  SINGLE FIX — Replace your hasNonAllPending logic with this
//
//  Old logic: show Apply when ANY multiselect has non-ALL value
//  New logic: show Apply when pendingFilters differs from current filters
//             i.e. the user has made a change that hasn't been fetched yet
// ═══════════════════════════════════════════════════════════════════════

// REMOVE this old block:
// ─────────────────────────────────────────────────────────────────────
// const hasNonAllPending = pendingFilters && (
//   (pendingFilters.geo    && !(pendingFilters.geo.length    === 1 && pendingFilters.geo[0]    === "ALL")) ||
//   ...
// );
// ─────────────────────────────────────────────────────────────────────


// REPLACE with this:
// ─────────────────────────────────────────────────────────────────────

const MULTISELECT_KEYS = ["geo", "program", "lob", "supervisor", "tenure_unit"];

// Returns true if the pending multiselect values differ from
// the currently applied (already fetched) filter values.
const hasPendingChanges = pendingFilters !== null && MULTISELECT_KEYS.some(key => {
  const pending  = (pendingFilters[key] || []).slice().sort().join(",");
  const applied  = (filters[key]        || []).slice().sort().join(",");
  return pending !== applied;
});

// ─────────────────────────────────────────────────────────────────────
// Then in JSX, replace:
//   {hasNonAllPending && ( ... Apply button ... )}
// with:
//   {hasPendingChanges && ( ... Apply button ... )}
// ─────────────────────────────────────────────────────────────────────


// ═══════════════════════════════════════════════════════════════════════
//  HOW THIS WORKS:
//
//  Scenario 1 — Initial state, all filters ALL:
//    filters.geo       = ["ALL"]
//    pendingFilters    = null          → hasPendingChanges = false → no Apply ✓
//
//  Scenario 2 — User selects GEO = "North":
//    filters.geo       = ["ALL"]
//    pendingFilters.geo = ["North"]    → differ → hasPendingChanges = true → Apply ✓
//
//  Scenario 3 — User clicks Apply (fetches data with GEO = "North"):
//    filters.geo       = ["North"]
//    pendingFilters    = null          → hasPendingChanges = false → no Apply ✓
//
//  Scenario 4 — User deselects "North", back to ALL:
//    filters.geo       = ["North"]     ← last fetched value
//    pendingFilters.geo = ["ALL"]      ← new pending value
//    "ALL" !== "North" → differ → hasPendingChanges = true → Apply shown ✓
//    (because the screen still shows "North" data, Apply needed to refresh)
//
//  Scenario 5 — User selects "North" again after deselecting:
//    filters.geo       = ["North"]
//    pendingFilters.geo = ["North"]    → same → hasPendingChanges = false → no Apply ✓
// ═══════════════════════════════════════════════════════════════════════
