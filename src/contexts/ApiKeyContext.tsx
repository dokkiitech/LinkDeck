import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { getGeminiApiKey, saveGeminiApiKey, removeGeminiApiKey } from '../utils/storage';

interface ApiKeyContextType {
  hasApiKey: boolean;
  isLoading: boolean;
  checkApiKey: () => Promise<void>;
  saveApiKey: (apiKey: string) => Promise<void>;
  deleteApiKey: () => Promise<void>;
}

const ApiKeyContext = createContext<ApiKeyContextType | undefined>(undefined);

export const ApiKeyProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [hasApiKey, setHasApiKey] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const checkApiKey = async () => {
    try {
      const apiKey = await getGeminiApiKey();
      setHasApiKey(!!apiKey);
    } catch (error) {
      setHasApiKey(false);
    } finally {
      setIsLoading(false);
    }
  };

  const saveApiKey = async (apiKey: string) => {
    await saveGeminiApiKey(apiKey);
    setHasApiKey(true);
  };

  const deleteApiKey = async () => {
    await removeGeminiApiKey();
    setHasApiKey(false);
  };

  useEffect(() => {
    checkApiKey();
  }, []);

  return (
    <ApiKeyContext.Provider
      value={{
        hasApiKey,
        isLoading,
        checkApiKey,
        saveApiKey,
        deleteApiKey,
      }}
    >
      {children}
    </ApiKeyContext.Provider>
  );
};

export const useApiKey = () => {
  const context = useContext(ApiKeyContext);
  if (context === undefined) {
    throw new Error('useApiKey must be used within an ApiKeyProvider');
  }
  return context;
};
