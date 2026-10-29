import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';

export const AuthLayout: React.FC = () => {
  const { resolvedTheme, setTheme } = useTheme();
  const { user } = useAuth();

  if (user) {
    return <Navigate to="/app/dashboard" replace />;
  }

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center bg-[#F8FAFC] dark:bg-[#070B14] text-slate-900 dark:text-slate-100 p-4 sm:p-6 overflow-hidden transition-colors duration-200">
      {/* Subtle ambient radial glow */}
      <div
        className="pointer-events-none fixed inset-0 overflow-hidden"
        aria-hidden="true"
      >
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[640px] h-[640px] rounded-full bg-[#535BF2]/[0.05] dark:bg-[#535BF2]/[0.08] blur-3xl" />
      </div>

      {/* Subtle floating theme switcher */}
      <div className="fixed top-5 right-5 z-20">
        <button
          type="button"
          onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
          className="w-10 h-10 rounded-full flex items-center justify-center border border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-[#0D111D]/80 backdrop-blur-md text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition shadow-sm cursor-pointer"
          aria-label="Toggle color theme"
          title={resolvedTheme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {resolvedTheme === 'dark' ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-[#535BF2]" />
          )}
        </button>
      </div>

      <main className="relative z-10 w-full max-w-[440px]">
        <Outlet />
      </main>
    </div>
  );
};
