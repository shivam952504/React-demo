<Col
  key={tile.id}
  style={{
    flex: "0 0 20%",
    maxWidth: "20%"
  }}
  className="kpi-tile"
>

/* Desktop */
.kpi-tile {
  flex: 0 0 10%;
  max-width: 10%;
}

/* Tablet */
@media (max-width: 1200px) {
  .kpi-tile {
    flex: 0 0 20%;
    max-width: 20%;
  }
}

/* Mobile */
@media (max-width: 768px) {
  .kpi-tile {
    flex: 0 0 50%;
    max-width: 50%;
  }
}
