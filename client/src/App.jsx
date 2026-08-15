import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useLanguage } from './context/LanguageContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import MobileNav from './components/MobileNav';

import HomePage from './pages/HomePage';
import DashboardPage from './pages/DashboardPage';
import ParentPage from './pages/ParentPage';
import CalendarPage from './pages/CalendarPage';
import AdminPage from './pages/AdminPage';
import AuthPage from './pages/AuthPage';
import GamesPage from './pages/GamesPage';
import AdminRoute from './components/AdminRoute';

export default function App() {
  const { isRtl } = useLanguage();

  return (
    <div dir={isRtl ? 'rtl' : 'ltr'} class="bg-surface text-on-surface font-body-md min-h-screen flex flex-col antialiased selection:bg-secondary-container selection:text-on-secondary-container">
      {/* Navbar Header */}
      <Navbar />

      {/* Main Page Content */}
      <main class="flex-grow flex flex-col w-full">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/parent" element={<ParentPage />} />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/games" element={<GamesPage />} />
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminPage />
              </AdminRoute>
            }
          />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {/* Bottom Navigation for Mobile */}
      <MobileNav />

      {/* Footer */}
      <Footer />
    </div>
  );
}
