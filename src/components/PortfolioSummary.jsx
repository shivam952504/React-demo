import { Card, Row, Col, Typography } from 'antd';

const { Title, Text } = Typography;

export default function PortfolioSummary({ data }) {
  const summary = data?.summary || {};

  return (
    <Card className="card" style={{ marginBottom: 24 }}>
      <Row gutter={24}>
        <Col span={6}>
          <Text type="secondary">Current Value</Text>
          <Title level={4}>{summary.currentValue || '--'}</Title>
        </Col>
        <Col span={6}>
          <Text type="secondary">Invested</Text>
          <Title level={4}>{summary.invested || '--'}</Title>
        </Col>
        <Col span={6}>
          <Text type="secondary">Returns</Text>
          <Title level={4} style={{ color: '#15803d' }}>
            {summary.returns || '--'}
          </Title>
        </Col>
        <Col span={6}>
          <Text type="secondary">Today</Text>
          <Title level={4} style={{ color: '#b91c1c' }}>
            {summary.today || '--'}
          </Title>
        </Col>
      </Row>
    </Card>
  );
}