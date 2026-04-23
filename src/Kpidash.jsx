const [pendingFilters, setPendingFilters] = useState(null);

const upMulti = (key, val) => {
  let n = val;
  if (val.length > 1 && val[val.length - 1] !== "ALL") n = val.filter(v => v !== "ALL");
  else if (val.includes("ALL") && val[val.length - 1] === "ALL") n = ["ALL"];
  if (!n.length) n = ["ALL"];
  // update pending only, not live filters
  setPendingFilters(p => ({ ...(p || filters), [key]: n }));
};


{/* Apply button — only shows when pending changes exist */}
{pendingFilters && (
  <div style={{ display: "flex", alignItems: "flex-end", paddingBottom: 2 }}>
    <button
      onClick={() => {
        setFilters(pendingFilters);
        setPendingFilters(null);
      }}
      style={{
        background: "#3b82f6",
        color: "#fff",
        border: "none",
        borderRadius: 8,
        padding: "6px 20px",
        fontWeight: 700,
        fontSize: 13,
        cursor: "pointer",
        whiteSpace: "nowrap",
        height: 36,
        transition: "background 0.15s",
      }}
      onMouseEnter={e => e.currentTarget.style.background = "#2563eb"}
      onMouseLeave={e => e.currentTarget.style.background = "#3b82f6"}
    >
      Apply
    </button>
  </div>
)}


// Before:
value={filters[key]}

// After:
value={(pendingFilters || filters)[key]}

