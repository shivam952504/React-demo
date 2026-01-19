import React from "react";
import { Result, Button } from "antd";
import { useNavigate } from "react-router-dom";

const NoAccess = () => {
  const navigate = useNavigate();

  return (
    <Result
      status="403"
      title="Access Denied"
      subTitle="You do not have permission to access this page."
      extra={[
        <Button type="primary" key="home" onClick={() => navigate("/")}>
          Go to Dashboard
        </Button>,
      ]}
    />
  );
};

export default NoAccess;

import React from "react";
import { Navigate } from "react-router-dom";

/**
 * @param {boolean} hasAccess - permission flag
 * @param {ReactNode} children - protected component
 */
const AccessGuard = ({ hasAccess, children }) => {
  if (!hasAccess) {
    return <Navigate to="/no-access" replace />;
  }

  return children;
};

export default AccessGuard;

import { BrowserRouter, Routes, Route } from "react-router-dom";
import NoAccess from "./pages/NoAccess";
import ClientKpiTable from "./pages/ClientKpiTable";
import AccessGuard from "./components/AccessGuard";

function App() {
  const userPermissions = {
    VIEW_CLIENT_KPI: true,
    VIEW_ADMIN_PANEL: false,
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/no-access" element={<NoAccess />} />

        <Route
          path="/client-kpis"
          element={
            <AccessGuard hasAccess={userPermissions.VIEW_CLIENT_KPI}>
              <ClientKpiTable />
            </AccessGuard>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

<AccessGuard hasAccess={permissions.CAN_VIEW_SENTIMENT}>
  <SentimentColumn />
</AccessGuard>

export const hasPermission = (userPermissions, permission) => {
  return userPermissions?.includes(permission);
};

<AccessGuard hasAccess={hasPermission(user.permissions, "VIEW_CLIENT_KPI")}>
  <ClientKpiTable />
</AccessGuard>

