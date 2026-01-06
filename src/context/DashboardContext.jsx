import { createContext, useState } from 'react';

export const DashboardContext = createContext();

export function DashboardProvider({ children }) {
  const [geo, setGeo] = useState('ALL');
  const [loading, setLoading] = useState(false);

  return (
    <DashboardContext.Provider value={{ geo, setGeo, loading, setLoading }}>
      {children}
    </DashboardContext.Provider>
  );
}