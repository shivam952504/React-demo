import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import InvestmentDetails from './pages/InvestmentDetails';
import { DashboardProvider } from './context/DashboardContext';

export default function App() {
  return (
    <DashboardProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/investment/:id" element={<InvestmentDetails />} />
        </Routes>
      </BrowserRouter>
    </DashboardProvider>
  );
}