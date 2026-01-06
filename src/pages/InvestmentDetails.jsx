import { useParams } from 'react-router-dom';
import { Typography } from 'antd';

export default function InvestmentDetails() {
  const { id } = useParams();
  return (
    <div style={{ padding: 24 }}>
      <Typography.Title level={3}>
        Investment Details - {id}
      </Typography.Title>
    </div>
  );
}