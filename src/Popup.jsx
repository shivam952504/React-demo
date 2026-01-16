const [tileHoverMap, setTileHoverMap] = useState({});
const [activeTile, setActiveTile] = useState(null);

const tilesHover = result?.hover_data?.tiles_hover || [];

const tileHoverLookup = {};
tilesHover.forEach(item => {
  tileHoverLookup[item.id] = {
    title: item.details.title,
    ...item.details.metrics
  };
});

setTileHoverMap(tileHoverLookup);

useEffect(() => {
  const callApi = async () => {
    setLoading(true);

    const response = await fetch("http://localhost:9009/api/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ geo, job: "ALL" })
    });

    const data = await response.json();
    const result = data?.result;
    if (!result) return;

    // existing
    setTiles(result.tiles || []);
    setMetrics(result.metrics || []);
    setTables(result.table_rows || []);

    // 🔴 THIS IS POINT-4
    const tilesHover = result?.hover_data?.tiles_hover || [];
    const tileHoverLookup = {};

    tilesHover.forEach(item => {
      tileHoverLookup[item.id] = {
        title: item.details.title,
        ...item.details.metrics
      };
    });

    setTileHoverMap(tileHoverLookup);

    setLoading(false);
  };

  callApi();
}, [geo]);

wrap each tile 

<div
  onMouseEnter={() => setActiveTile(tile.id)}
  onMouseLeave={() => setActiveTile(null)}
  style={{ position: "relative" }}
>
  <MetricTile
    title={tile.label}
    value={tile.value}
  />

  {activeTile === tile.id && tileHoverMap[tile.id] && (
    <HoverPopup data={tileHoverMap[tile.id]} />
  )}
</div>
