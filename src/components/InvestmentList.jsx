import { Card, Button, Input } from 'antd';
import { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchInvestments } from '../api/investments.api';
import { DashboardContext } from '../context/DashboardContext';

export default function InvestmentList() {
  const { geo } = useContext(DashboardContext);
  const [list, setList] = useState([]);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchInvestments(geo, search)
      .then(res => setList(res.data || []))
      .catch(() => setList([]));
  }, [geo, search]);

  return (
    <div>
      <Input.Search
        placeholder="Search investment"
        style={{ width: 240, marginBottom: 16 }}
        onChange={e => setSearch(e.target.value)}
      />

      {list.map(inv => (
        <Card key={inv.id} className="card" style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div>
              <strong>{inv.name}</strong>
              <div>Current Value: {inv.value}</div>
            </div>
            <Button type="primary" onClick={() => navigate('/investment/' + inv.id)}>
              View
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
}