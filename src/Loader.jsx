import "./loader.css";

export default function LoaderOverlay({ show }) {
  if (!show) return null;

  return (
    <div className="loader-overlay">
      <div className="spinner" />
    </div>
  );
}

/* Full screen overlay */
.loader-overlay {
  position: fixed;
  inset: 0;
  background: rgba(255, 255, 255, 0.6); /* dim background */
  backdrop-filter: blur(2px);           /* optional premium look */
  z-index: 9999;

  display: flex;
  align-items: center;
  justify-content: center;
}

/* Spinner */
.spinner {
  width: 56px;
  height: 56px;
  border: 4px solid #e0e0e0;
  border-top-color: #1677ff; /* your theme blue */
  border-radius: 50%;
  animation: spin 0.9s linear infinite;
}

/* Animation */
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
  import LoaderOverlay from "../components/LoaderOverlay";

function KeyMetricsSummary() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData().finally(() => setLoading(false));
  }, []);

  return (
    <>
      <LoaderOverlay show={loading} />

      {/* Existing page content */}
      <DashboardHeader />
      <MetricsTiles />
      <Charts />
      <Tables />
    </>
  );
}
<div className="spinner-container">
  <div className="spinner" />
  <span>Loading metrics…</span>
</div>

@media (prefers-color-scheme: dark) {
  .loader-overlay {
    background: rgba(0, 0, 0, 0.5);
  }
}
