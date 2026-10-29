import React, { useState } from 'react';
import { Link, NavLink, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  FileSearch,
  FileText,
  UserCheck,
  ShieldCheck,
  GitCompare,
  History,
  Settings,
  Bell,
  Sun,
  Moon,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  LogOut,
} from 'lucide-react';
import { RadixLogo } from '../ui/RadixLogo';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useWorkspace } from '../../context/WorkspaceContext';
import { cn, formatDateTime } from '../../utils/cn';
import { toast } from 'sonner';

const NAV_ITEMS = [
  { to: '/app/jd-analytics', label: '01. JD Analytics', icon: FileSearch },
  { to: '/app/resume-parsing', label: '02. Resume Parsing', icon: FileText },
  { to: '/app/profile', label: '03. Profile Builder', icon: UserCheck },
  { to: '/app/talent-check', label: '04. Talent Check', icon: ShieldCheck },
  { to: '/app/skill-matching', label: '05. Skill Matching', icon: GitCompare },
  { to: '/app/dashboard', label: 'Overview Dashboard', icon: LayoutDashboard },
  { to: '/app/history', label: 'History', icon: History },
  { to: '/app/settings', label: 'Settings', icon: Settings },
];

const ROUTE_TITLES: Record<string, string> = {
  '/app/jd-analytics': 'Role 01 · JD Analytics',
  '/app/resume-parsing': 'Role 02 · Resume Parsing',
  '/app/profile': 'Role 03 · Profile Builder',
  '/app/talent-check': 'Role 04 · Talent Check',
  '/app/skill-matching': 'Role 05 · Skill Matching',
  '/app/dashboard': 'Overview Dashboard · All 5 Modules',
  '/app/history': 'Analysis & Session History',
  '/app/settings': 'Workspace & Theme Settings',
  '/app/notifications': 'Notifications',
};

export const DashboardLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const { resolvedTheme, setTheme } = useTheme();
  const {
    activeProfile,
    notifications,
    markNotificationRead,
    markAllNotificationsRead,
  } = useWorkspace();

  const [collapsed, setCollapsed] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();

  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  const unreadCount = notifications.filter((n) => !n.read).length;
  const currentTitle = ROUTE_TITLES[location.pathname] || 'RADIX Workspace';

  const handleLogout = async () => {
    await logout();
    toast.info('Signed out of workspace.');
    navigate('/');
  };

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-[#090D16] text-slate-900 dark:text-slate-100">
      {/* Desktop Persistent Sidebar */}
      <aside
        className={cn(
          'hidden lg:flex flex-col border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1322] transition-all duration-200 shrink-0',
          collapsed ? 'w-18' : 'w-64'
        )}
      >
        <div className="h-16 px-4 flex items-center justify-between border-b border-slate-200 dark:border-slate-800">
          {!collapsed ? (
            <Link to="/" className="overflow-hidden">
              <RadixLogo />
            </Link>
          ) : (
            <Link to="/" className="mx-auto" aria-label="RADIX Home">
              <svg width="26" height="26" viewBox="0 0 32 32" fill="none">
                <circle cx="16" cy="16" r="14" className="stroke-slate-500" strokeWidth="1.5" />
                <circle cx="16" cy="16" r="8" className="stroke-indigo-500" strokeWidth="1.5" />
                <circle cx="16" cy="16" r="4" className="fill-indigo-500" />
              </svg>
            </Link>
          )}
          <button
            type="button"
            onClick={() => setCollapsed((c) => !c)}
            className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto" aria-label="Workspace Navigation">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap',
                    isActive
                      ? 'bg-indigo-600 text-white dark:bg-indigo-500/20 dark:text-indigo-300 dark:border dark:border-indigo-500/30'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/70 hover:text-slate-900 dark:hover:text-slate-200',
                    collapsed && 'justify-center px-2'
                  )
                }
                title={collapsed ? item.label : undefined}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </NavLink>
            );
          })}
        </nav>

        <div className="p-3 border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={handleLogout}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-600 dark:hover:text-red-400 transition-colors cursor-pointer',
              collapsed && 'justify-center px-2'
            )}
            title={collapsed ? 'Sign Out' : undefined}
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {!collapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* Mobile Sidebar Drawer */}
      {mobileDrawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs"
            onClick={() => setMobileDrawerOpen(false)}
          />
          <aside className="relative w-72 max-w-[85vw] bg-white dark:bg-[#0D1322] h-full flex flex-col border-r border-slate-200 dark:border-slate-800 z-10">
            <div className="h-16 px-4 flex items-center justify-between border-b border-slate-200 dark:border-slate-800">
              <RadixLogo />
              <button
                type="button"
                onClick={() => setMobileDrawerOpen(false)}
                className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                aria-label="Close drawer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => setMobileDrawerOpen(false)}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium',
                        isActive
                          ? 'bg-indigo-600 text-white'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                      )
                    }
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
            </nav>

            <div className="p-3 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium text-red-600 dark:text-red-400"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 h-16 px-4 sm:px-6 lg:px-8 border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-[#090D16]/90 backdrop-blur-md flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileDrawerOpen(true)}
              className="lg:hidden p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              aria-label="Open navigation drawer"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 text-xs sm:text-sm min-w-0">
              <Link
                to="/app/dashboard"
                className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hidden sm:inline whitespace-nowrap"
              >
                Workspace
              </Link>
              <span className="text-slate-400 hidden sm:inline" aria-hidden="true">
                /
              </span>
              <span className="font-semibold text-slate-900 dark:text-white truncate">
                {currentTitle}
              </span>
            </div>
          </div>

          {/* Right Controls: Quick Module Jump, Theme, Notifications, User Profile */}
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
              className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              aria-label="Toggle theme"
              title={resolvedTheme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {resolvedTheme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-indigo-600" />
              )}
            </button>

            {/* Notifications Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setNotifOpen((o) => !o);
                  setUserMenuOpen(false);
                }}
                className="relative p-2 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                aria-label="Notifications"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 px-1 min-w-4 h-4 rounded-full bg-indigo-600 text-white text-[10px] font-mono flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>

              {notifOpen && (
                <div className="absolute right-0 mt-2 w-80 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl py-2 z-50">
                  <div className="px-4 py-2 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-900 dark:text-white">
                      Notifications
                    </span>
                    <button
                      type="button"
                      onClick={markAllNotificationsRead}
                      className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                    >
                      Mark all read
                    </button>
                  </div>
                  <div className="max-h-64 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                    {notifications.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => {
                          markNotificationRead(n.id);
                          setNotifOpen(false);
                          if (n.link) navigate(n.link);
                        }}
                        className={cn(
                          'px-4 py-3 text-xs cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/60',
                          !n.read && 'bg-indigo-50/40 dark:bg-indigo-950/20'
                        )}
                      >
                        <p className="font-semibold text-slate-900 dark:text-white">{n.title}</p>
                        <p className="text-slate-600 dark:text-slate-400 mt-0.5 leading-relaxed">
                          {n.message}
                        </p>
                        <p className="text-[10px] font-mono text-slate-400 mt-1">
                          {formatDateTime(n.timestamp)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* User Avatar & Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setUserMenuOpen((o) => !o);
                  setNotifOpen(false);
                }}
                className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <span className="w-6 h-6 rounded-md bg-indigo-600 text-white text-xs font-bold flex items-center justify-center">
                  {activeProfile.name.charAt(0)}
                </span>
                <span className="text-xs font-medium text-slate-800 dark:text-slate-200 hidden sm:inline max-w-[120px] truncate">
                  {activeProfile.name}
                </span>
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl py-1.5 z-50 text-xs">
                  <div className="px-3.5 py-2 border-b border-slate-200 dark:border-slate-800">
                    <p className="font-semibold text-slate-900 dark:text-white truncate">
                      {activeProfile.name}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      {activeProfile.email}
                    </p>
                  </div>
                  <Link
                    to="/app/profile"
                    onClick={() => setUserMenuOpen(false)}
                    className="block px-3.5 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    03. Profile Builder
                  </Link>
                  <Link
                    to="/app/settings"
                    onClick={() => setUserMenuOpen(false)}
                    className="block px-3.5 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    Theme & Settings
                  </Link>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full text-left px-3.5 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 cursor-pointer"
                  >
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Main Viewport */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
