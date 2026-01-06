import { useContext, useEffect, useState } from 'react';
import { Spin } from 'antd';
import { DashboardContext } from '../context/DashboardContext';
import PortfolioSummary from '../components/PortfolioSummary';
import InvestmentList from '../components/InvestmentList';
import { fetchDashboard } from '../api/dashboard.api';

export default function Dashboard() {
  const { geo, loading, setLoading } = useContext(DashboardContext);
  const [data, setData] = useState(null);

  useEffect(() => {
    setLoading(true);
    fetchDashboard(geo)
      .then(res => setData(res.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [geo]);

  return (
    <div style={{ padding: 24, maxWidth: 1600, margin: '0 auto' }}>
      <Spin spinning={loading}>
        <PortfolioSummary data={data} />
        <InvestmentList />
      </Spin>
    </div>
  );
}