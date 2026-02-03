import "./CategoryFilters.css";

const categories = [
  "Home",
  "People",
  "Capacity",
  "Performance",
  "Road to advocacy",
];

function CategoryFilters({ selectedCategory, onCategoryChange }) {
  return (
    <div className="category-tabs">
      {categories.map((cat) => (
        <button
          key={cat}
          className={`category-tab ${
            selectedCategory === cat ? "active" : ""
          }`}
          onClick={() => onCategoryChange(cat)}
          type="button"
        >
          {cat}
        </button>
      ))}
    </div>
  );
}

export default CategoryFilters;

.category-tabs {
  display: flex;
  gap: 24px;
  border-bottom: 1px solid #e5e7eb;
  margin-bottom: 12px;
}

.category-tab {
  background: none;
  border: none;
  padding: 10px 4px;
  font-size: 14px;
  font-weight: 500;
  color: #6b7280;
  cursor: pointer;
  position: relative;
}

.category-tab:hover {
  color: #111827;
}

.category-tab.active {
  color: #2563eb;
  font-weight: 600;
}

.category-tab.active::after {
  content: "";
  position: absolute;
  left: 0;
  bottom: -1px;
  width: 100%;
  height: 2px;
  background-color: #2563eb;
}


<CategoryFilters
  selectedCategory={selectedCategory}
  onCategoryChange={setSelectedCategory}
/>

<DashboardTicker highlights={highlights} />
