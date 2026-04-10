import React, { useEffect } from 'react';
import { MainLayout } from './layouts/MainLayout';
import { IntroPage } from './pages/IntroPage';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { AppProvider, useApp } from './context/AppContext';

function AppContent() {
  const { currentPage, isLoggedIn, setCurrentPage } = useApp();

  useEffect(() => {
    if (isLoggedIn && currentPage === 'intro') {
      setCurrentPage('dashboard');
    } else if (!isLoggedIn && currentPage === 'dashboard') {
      setCurrentPage('login');
    }
  }, [isLoggedIn, currentPage, setCurrentPage]);

  return (
    <MainLayout>
      {currentPage === 'intro' && <IntroPage />}
      {currentPage === 'login' && <LoginPage />}
      {currentPage === 'dashboard' && <DashboardPage />}
    </MainLayout>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
