import React from "react";
import { Alert, Button, Spin, Empty } from "antd";

function ApiStateWrapper({
  loading,
  error,
  data,
  children,
  retry,
  emptyMessage = "No data available"
}) {
  // 🔵 Loading
  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "60px 0" }}>
        <Spin size="large" />
      </div>
    );
  }

  // 🔴 Error
  if (error) {
    return (
      <div style={{ padding: "40px 0" }}>
        <Alert
          message="Database connection error"
          description={error}
          type="error"
          showIcon
          action={
            retry && (
              <Button size="small" danger onClick={retry}>
                Retry
              </Button>
            )
          }
        />
      </div>
    );
  }

  // 🟡 Empty state
  if (!data || (Array.isArray(data) && data.length === 0)) {
    return (
      <div style={{ padding: "60px 0" }}>
        <Empty description={emptyMessage} />
      </div>
    );
  }

  // 🟢 Normal render
  return <>{children}</>;
}

export default ApiStateWrapper;
const [error, setError] = useState(null);

setError(null);
setLoading(true);

try {
   ...
} catch (err) {
   setError("Please try again later.");
} finally {
   setLoading(false);
}

<Outlet context={{ data, loading, error, jobCodes }} />
import ApiStateWrapper from "../../components/ApiStateWrapper";

const { data, loading, error } = useOutletContext();

<ApiStateWrapper
  loading={loading}
  error={error}
  data={data}
  emptyMessage="No KPI data available"
>
   {/* Your Existing KPI UI */}
   <>
     <Row gutter={[20, 20]}>
       {data.tiles.map(metric => (
         ...
       ))}
     </Row>

     <div style={{ marginTop: 24 }}>
       <Table
         bordered
         loading={loading}
         columns={tableColumns}
         dataSource={filteredRows}
         rowKey={(row, index) => index}
         pagination={false}
       />
     </div>
   </>
</ApiStateWrapper>
<ApiStateWrapper loading={loading} error={error} data={data}>
   <YourContent />
</ApiStateWrapper>




