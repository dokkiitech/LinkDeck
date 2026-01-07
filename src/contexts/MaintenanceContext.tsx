import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { subscribeToMaintenanceStatus, MaintenanceStatus } from '../services/maintenance';

interface MaintenanceContextType {
  maintenanceStatus: MaintenanceStatus;
  isLoading: boolean;
}

const MaintenanceContext = createContext<MaintenanceContextType | undefined>(undefined);

export const useMaintenanceContext = () => {
  const context = useContext(MaintenanceContext);
  if (!context) {
    throw new Error('useMaintenanceContext must be used within MaintenanceProvider');
  }
  return context;
};

interface MaintenanceProviderProps {
  children: ReactNode;
}

export const MaintenanceProvider: React.FC<MaintenanceProviderProps> = ({ children }) => {
  const [maintenanceStatus, setMaintenanceStatus] = useState<MaintenanceStatus>({
    isMaintenanceMode: false,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeToMaintenanceStatus((status) => {
      setMaintenanceStatus(status);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <MaintenanceContext.Provider value={{ maintenanceStatus, isLoading }}>
      {children}
    </MaintenanceContext.Provider>
  );
};
