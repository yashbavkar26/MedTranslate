import React, { createContext, useContext, ReactNode } from 'react';
import { Language } from '../constants/translations';
import { useLocalStorage } from '../hooks/useLocalStorage';

interface AppContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  isLoggedIn: boolean;
  setIsLoggedIn: (logged: boolean) => void;
  currentPage: 'intro' | 'login' | 'dashboard' | 'history';
  setCurrentPage: (page: 'intro' | 'login' | 'dashboard' | 'history') => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useLocalStorage<Language>('language', 'en');
  const [isLoggedIn, setIsLoggedIn] = useLocalStorage<boolean>('isLoggedIn', false);
  const [currentPage, setCurrentPage] = useLocalStorage<'intro' | 'login' | 'dashboard' | 'history'>(
    'currentPage',
    'intro'
  );

  return (
    <AppContext.Provider
      value={{
        language,
        setLanguage,
        isLoggedIn,
        setIsLoggedIn,
        currentPage,
        setCurrentPage
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
}
