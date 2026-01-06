import { useEffect, useState } from "react";

function Landing() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const callApi = async () => {
    setLoading(true);
    try {
      const response = await fetch("http://localhost:8000/api/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          geo: "ALL",
          job: "ALL",
        }),
      });

      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error("API error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    callApi();
  }, []);

  return (
    <div>
      <h2>Landing API Data</h2>

      {loading && <p>Loading...</p>}

      {data && (
        <pre style={{ background: "#f5f5f5", padding: 12 }}>
          {JSON.stringify(data, null, 2)}
        </pre>
      )}
    </div>
  );
}

export default Landing;
