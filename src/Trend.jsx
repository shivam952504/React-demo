trendContext.jsx

import { createContext, useContext, useState } from "react";
import { apiClient } from "../auth/apiClient";

const TrendContext = createContext();

export const TrendProvider = ({ children }) => {
  const [trendData, setTrendData] = useState(null);
  const [loadingTrend, setLoadingTrend] = useState(false);

  const fetchTrend = async (payload) => {
    if (trendData) return; // ✅ already fetched, don’t call again

    try {
      setLoadingTrend(true);

      const response = await apiClient(
        "http://localhost:9009/api/monthly_trend",
        {
          method: "POST",
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();
      setTrendData(data.result);
    } catch (err) {
      console.error("Trend API error:", err);
    } finally {
      setLoadingTrend(false);
    }
  };

  return (
    <TrendContext.Provider
      value={{ trendData, fetchTrend, loadingTrend }}
    >
      {children}
    </TrendContext.Provider>
  );
};

export const useTrend = () => useContext(TrendContext);

wrap
import { TrendProvider } from "./context/TrendContext";

function App() {
  return (
    <TrendProvider>
      <DashboardProvider>
        <BrowserRouter>
          <Routes>
            ...
          </Routes>
        </BrowserRouter>
      </DashboardProvider>
    </TrendProvider>
  );
}

on landing.jsx

import { useTrend } from "../context/TrendContext";

function Landing() {
  const { fetchTrend } = useTrend();

  useEffect(() => {
    fetchTrend({
      geo: ["ALL"],
      job: ["ALL"],
      year: 2026,
      user_id: ""
    });
  }, []);

inside matricTile

import { InfoCircleOutlined } from "@ant-design/icons";

<InfoCircleOutlined
  style={{
    position: "absolute",
    top: 8,
    right: 8,
    cursor: "pointer",
    fontSize: "16px"
  }}
  onClick={() => {
    setSelectedTrendTile(tile.id);
    setTrendOpen(true);
  }}
/>


  
import { Drawer } from "antd";
import { useTrend } from "../context/TrendContext";

const TrendDrawer = ({ open, onClose, tileId }) => {
  const { trendData } = useTrend();

  const tileTrend =
    trendData?.monthly_trend?.find(
      (m) => m.tiles?.tiles?.some(t => t.id === tileId)
    );

  return (
    <Drawer
      title="Monthly Trend"
      placement="right"
      width={600}
      onClose={onClose}
      open={open}
    >
      {/* Render chart here */}
      <pre>{JSON.stringify(tileTrend, null, 2)}</pre>
    </Drawer>
  );
};


  
