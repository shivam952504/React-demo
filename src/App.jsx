import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import { DashboardProvider } from "./context/DashboardContext";
import { GlobalErrorProvider } from "./context/GlobalErrorContext";
import { TrendProvider } from "./context/TrendContext";

import ErrorWrapper from "./errorWrapper/ErrorWrapper";

import Login from "./pages/Login";
import RequireAuth from "./auth/RequireAuth";
import NoAccess from "./pages/noAccess/NoAccess";

import Landing from "./pages/Landing";
import ClientLanding from "./pages/ClientLanding";

import Overview from "./pages/clientOverview/Overview";
import KeyMetricsSummary from "./pages/clientOverview/KeyMetricsSummary";
import PeopleSummary from "./pages/clientOverview/PeopleSummary";
import KPI from "./pages/clientOverview/KPI";
import KPIDashboard from "./pages/clientOverview/KPIDashboard";

export default function App() {
  return (
    <TrendProvider>
      <DashboardProvider>
        <GlobalErrorProvider>
          <BrowserRouter>
            <ErrorWrapper>
              <Routes>

                {/* Public Routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/no-access" element={<NoAccess />} />

                {/* Protected Routes */}
                <Route element={<RequireAuth />}>

                  {/* Main Landing */}
                  <Route
                    path="/"
                    element={<Landing hideJobCodeFilter={false} />}
                  />

                  {/* Client Routes */}
                  <Route
                    path="/client/:clientSlug/landing"
                    element={<ClientLanding />}
                  >

                    {/* Overview */}
                    <Route
                      index
                      element={<Overview hideJobCodeFilter={false} />}
                    />

                    <Route
                      path="overview"
                      element={<Overview hideJobCodeFilter={false} />}
                    />

                    {/* KPI */}
                    <Route
                      path="KPI"
                      element={<KPI hideJobCodeFilter={false} />}
                    />

                    {/* Key Metrics */}
                    <Route
                      path="key-metrics"
                      element={<KeyMetricsSummary hideJobCodeFilter={false} />}
                    />

                    {/* People */}
                    <Route
                      path="people"
                      element={<PeopleSummary hideJobCodeFilter={false} />}
                    />

                    {/* Analytics */}
                    <Route
                      path="analytics"
                      element={<KPIDashboard hideJobCodeFilter={true} />}
                    />

                  </Route>
                </Route>

                {/* Catch All */}
                <Route path="*" element={<Navigate to="/" />} />

              </Routes>
            </ErrorWrapper>
          </BrowserRouter>
        </GlobalErrorProvider>
      </DashboardProvider>
    </TrendProvider>
  );
}

export default function Landing({ hideJobCodeFilter = false }) {

  return (
    <>
      <Header hideJobCodeFilter={hideJobCodeFilter} />

      <Outlet />
    </>
  );
}

export default function Header({ hideJobCodeFilter }) {

  return (
    <div className="header">

      {!hideJobCodeFilter && (
        <JobCodeFilter />
      )}

    </div>
  );
}

