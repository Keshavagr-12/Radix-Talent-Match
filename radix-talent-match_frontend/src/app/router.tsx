import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { PublicLayout } from '../components/layout/PublicLayout';
import { AuthLayout } from '../components/layout/AuthLayout';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { LandingPage } from '../features/landing/LandingPage';
import { LoginPage, SignupPage } from '../features/auth/AuthPages';
import { DashboardPage } from '../features/dashboard/DashboardPage';
import { JDAnalyticsPage } from '../features/jd-analytics/JDAnalyticsPage';
import { ResumeParsingPage } from '../features/resume-parsing/ResumeParsingPage';
import { ProfileBuilderPage } from '../features/profile-builder/ProfileBuilderPage';
import { TalentCheckPage } from '../features/talent-check/TalentCheckPage';
import { SkillMatchingPage } from '../features/skill-matching/SkillMatchingPage';
import { SettingsPage } from '../features/settings/SettingsPage';
import {
  HistoryPage,
  NotificationsPage,
} from '../features/history/HistoryAndHelpPages';

export const AppRouter: React.FC = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<LandingPage />} />
      </Route>

      {/* Auth Routes */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
      </Route>

      {/* Protected Application Routes */}
      <Route path="/app" element={<DashboardLayout />}>
        <Route index element={<Navigate to="/app/jd-analytics" replace />} />
        <Route path="jd-analytics" element={<JDAnalyticsPage />} />
        <Route path="resume-parsing" element={<ResumeParsingPage />} />
        <Route path="profile" element={<ProfileBuilderPage />} />
        <Route path="talent-check" element={<TalentCheckPage />} />
        <Route path="skill-matching" element={<SkillMatchingPage />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="history" element={<HistoryPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="help" element={<Navigate to="/app/dashboard" replace />} />
      </Route>

      {/* Fallback Redirect */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};
