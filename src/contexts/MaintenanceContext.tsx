import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { subscribeToMaintenanceStatus, MaintenanceStatus, isDeveloper } from '../services/maintenance';
import { useAuth } from './AuthContext';

interface MaintenanceContextType {
  maintenanceStatus: MaintenanceStatus;
  isLoading: boolean;
  isDeveloperUser: boolean;
  shouldShowMaintenance: boolean;
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
  const { user } = useAuth();
  const [maintenanceStatus, setMaintenanceStatus] = useState<MaintenanceStatus>({
    isMaintenanceMode: false,
  });
  const [isDeveloperUser, setIsDeveloperUser] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // メンテナンス状態を監視
  useEffect(() => {
    const unsubscribe = subscribeToMaintenanceStatus((status) => {
      setMaintenanceStatus(status);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // ユーザーが開発者かどうかをチェック
  useEffect(() => {
    const checkDeveloperStatus = async () => {
      if (user && !user.isAnonymous) {
        const isDev = await isDeveloper(user.uid);
        setIsDeveloperUser(isDev);
      } else {
        setIsDeveloperUser(false);
      }
    };

    checkDeveloperStatus();
  }, [user]);

  // メンテナンス画面を表示するかどうか
  const shouldShowMaintenance = maintenanceStatus.isMaintenanceMode && !isDeveloperUser;

  return (
    <MaintenanceContext.Provider value={{ maintenanceStatus, isLoading, isDeveloperUser, shouldShowMaintenance }}>
      {children}
    </MaintenanceContext.Provider>
  );
};
