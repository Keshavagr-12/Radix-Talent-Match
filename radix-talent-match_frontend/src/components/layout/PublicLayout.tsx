import React, { useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { Menu, X, Sun, Moon, Mail, Instagram, Facebook, Linkedin, Github, Zap } from 'lucide-react';
import { RadixLogo } from '../ui/RadixLogo';
import { Button, Modal } from '../ui/primitives';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'sonner';

export const PublicLayout: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [legalModal, setLegalModal] = useState<'privacy' | 'terms' | null>(null);
  const { resolvedTheme, setTheme } = useTheme();
  const { user } = useAuth();
  const location = useLocation();

  const toggleTheme = () => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  };

  const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    if (location.pathname === '/') {
      e.preventDefault();
      setMobileMenuOpen(false);
      if (id === 'top') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#090D16] text-slate-900 dark:text-slate-100">
      {/* Sticky Top Header adhering to the 3-Zone Top Bar Contract */}
      <header className="sticky top-0 z-40 h-16 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/90 dark:bg-[#090D16]/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-8">
          {/* Zone 1: Single brand lockup */}
          <Link
            to="/"
            onClick={(e) => scrollToSection(e, 'top')}
            aria-label="RADIX Talent Match Home"
            className="whitespace-nowrap shrink-0"
          >
            <RadixLogo />
          </Link>

          {/* Zone 2: Concise single-line navigation links */}
          <nav
            className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600 dark:text-slate-300"
            aria-label="Primary Navigation"
          >
            <a
              href="#top"
              onClick={(e) => scrollToSection(e, 'top')}
              className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors whitespace-nowrap shrink-0"
            >
              Home
            </a>
            <a
              href="#features"
              onClick={(e) => scrollToSection(e, 'features')}
              className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors whitespace-nowrap shrink-0"
            >
              Features
            </a>
            <a
              href="#how-it-works"
              onClick={(e) => scrollToSection(e, 'how-it-works')}
              className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors whitespace-nowrap shrink-0"
            >
              How It Works
            </a>
            <a
              href="#why-radix"
              onClick={(e) => scrollToSection(e, 'why-radix')}
              className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors whitespace-nowrap shrink-0"
            >
              Why RADIX
            </a>
          </nav>

          {/* Zone 3: Theme Switcher + Log In CTA */}
          <div className="hidden md:flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={toggleTheme}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer whitespace-nowrap shrink-0"
              aria-label="Switch color theme"
              title={resolvedTheme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
            >
              {resolvedTheme === 'dark' ? (
                <>
                  <Sun className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Light</span>
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span>Dark</span>
                </>
              )}
            </button>
            <Link to={user ? '/app/dashboard' : '/login'}>
              <Button variant="primary" size="sm">
                {user ? 'Open Dashboard' : 'Log In'}
              </Button>
            </Link>
          </div>

          {/* Mobile Hamburger Trigger */}
          <div className="flex md:hidden items-center gap-2">
            <button
              type="button"
              onClick={toggleTheme}
              className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              aria-label="Switch color theme"
            >
              {resolvedTheme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-indigo-600" />
              )}
            </button>
            <button
              type="button"
              onClick={() => setMobileMenuOpen((v) => !v)}
              className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              aria-label="Toggle navigation menu"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-4 space-y-3">
            <div className="flex flex-col space-y-2 text-sm font-medium">
              <a
                href="#top"
                onClick={(e) => scrollToSection(e, 'top')}
                className="py-1.5 text-slate-700 dark:text-slate-200"
              >
                Home
              </a>
              <a
                href="#features"
                onClick={(e) => scrollToSection(e, 'features')}
                className="py-1.5 text-slate-700 dark:text-slate-200"
              >
                Features
              </a>
              <a
                href="#how-it-works"
                onClick={(e) => scrollToSection(e, 'how-it-works')}
                className="py-1.5 text-slate-700 dark:text-slate-200"
              >
                How It Works
              </a>
              <a
                href="#why-radix"
                onClick={(e) => scrollToSection(e, 'why-radix')}
                className="py-1.5 text-slate-700 dark:text-slate-200"
              >
                Why RADIX
              </a>
            </div>
            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={toggleTheme}
                className="inline-flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-300 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700"
              >
                {resolvedTheme === 'dark' ? (
                  <>
                    <Sun className="w-4 h-4 text-amber-400" />
                    <span>Light Theme</span>
                  </>
                ) : (
                  <>
                    <Moon className="w-4 h-4 text-indigo-600" />
                    <span>Dark Theme</span>
                  </>
                )}
              </button>
              <Link to={user ? '/app/dashboard' : '/login'} onClick={() => setMobileMenuOpen(false)}>
                <Button variant="primary" size="sm">
                  {user ? 'Open Dashboard' : 'Log In'}
                </Button>
              </Link>
            </div>
          </div>
        )}
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer matching the provided visual reference */}
      <footer className="border-t border-slate-200 dark:border-slate-800/80 bg-[#0A0E1A] text-slate-300 pt-16 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 pb-14 border-b border-slate-800/90">
            {/* Column 1: Brand Lockup, Tagline, and Platform Status Pill */}
            <div className="lg:col-span-4 space-y-6">
              <Link
                to="/"
                onClick={(e) => scrollToSection(e, 'top')}
                className="inline-flex items-center gap-3 select-none"
              >
                <span className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-600 to-cyan-400 flex items-center justify-center text-white shadow-md shrink-0">
                  <Zap className="w-5 h-5 fill-white" />
                </span>
                <span className="flex flex-col leading-none">
                  <span className="text-lg font-extrabold tracking-tight text-white">
                    RADIX<span className="text-indigo-500">.</span>
                  </span>
                  <span className="text-[10px] font-medium tracking-[0.18em] text-slate-400 mt-1">
                    TALENT MATCH
                  </span>
                </span>
              </Link>

              <p className="text-sm text-slate-400 leading-relaxed max-w-sm">
                Bridging candidate readiness and company hiring expectations across 12 standardized competency dimensions.
              </p>

              <div className="pt-1">
                <span className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full border border-emerald-500/30 bg-emerald-950/30 text-xs font-medium text-emerald-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span>Platform Status: Systems Operational</span>
                </span>
              </div>
            </div>

            {/* Column 2: PLATFORM */}
            <div className="lg:col-span-2 lg:col-start-6 space-y-4">
              <h3 className="text-xs font-bold tracking-wider uppercase text-white">
                PLATFORM
              </h3>
              <ul className="space-y-3 text-sm text-slate-400">
                <li>
                  <Link
                    to="/app/jd-analytics"
                    className="hover:text-white transition-colors"
                  >
                    JD Analytics
                  </Link>
                </li>
                <li>
                  <Link
                    to="/app/resume-parsing"
                    className="hover:text-white transition-colors"
                  >
                    Resume Parsing
                  </Link>
                </li>
                <li>
                  <Link
                    to="/app/profile"
                    className="hover:text-white transition-colors"
                  >
                    Profile Builder
                  </Link>
                </li>
                <li>
                  <Link
                    to="/app/talent-check"
                    className="hover:text-white transition-colors"
                  >
                    Talent Check
                  </Link>
                </li>
                <li>
                  <Link
                    to="/app/skill-matching"
                    className="hover:text-white transition-colors"
                  >
                    Skill Matching
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 3: STANDARDS */}
            <div className="lg:col-span-2 lg:col-start-8 space-y-4">
              <h3 className="text-xs font-bold tracking-wider uppercase text-white">
                STANDARDS
              </h3>
              <ul className="space-y-3 text-sm text-slate-400">
                <li>
                  <a
                    href="#categories"
                    onClick={(e) => scrollToSection(e, 'categories')}
                    className="hover:text-white transition-colors"
                  >
                    12 Skillset Framework
                  </a>
                </li>
                <li>
                  <a
                    href="#how-it-works"
                    onClick={(e) => scrollToSection(e, 'how-it-works')}
                    className="hover:text-white transition-colors"
                  >
                    5-Step Pipeline Flow
                  </a>
                </li>
                <li>
                  <Link
                    to="/app/talent-check"
                    className="hover:text-white transition-colors"
                  >
                    Verified Benchmarks
                  </Link>
                </li>
                <li>
                  <Link
                    to="/app/dashboard"
                    className="hover:text-white transition-colors"
                  >
                    Overview Dashboard
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 4: CONNECT WITH US */}
            <div className="lg:col-span-3 lg:col-start-10 space-y-4">
              <h3 className="text-xs font-bold tracking-wider uppercase text-white">
                CONNECT WITH US
              </h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Have questions or feedback? Reach out directly via our socials or mail:
              </p>

              <div className="flex items-center gap-2.5 pt-1">
                <a
                  href="mailto:support@radixtalent.io"
                  aria-label="Email Support"
                  className="w-10 h-10 rounded-xl border border-slate-800 bg-slate-900/80 hover:bg-slate-800 hover:border-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors"
                >
                  <Mail className="w-4 h-4" />
                </a>
                <button
                  type="button"
                  onClick={() => toast.info('RADIX Talent Match Instagram placeholder')}
                  aria-label="Instagram"
                  className="w-10 h-10 rounded-xl border border-slate-800 bg-slate-900/80 hover:bg-slate-800 hover:border-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                >
                  <Instagram className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => toast.info('RADIX Talent Match Facebook placeholder')}
                  aria-label="Facebook"
                  className="w-10 h-10 rounded-xl border border-slate-800 bg-slate-900/80 hover:bg-slate-800 hover:border-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                >
                  <Facebook className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => toast.info('RADIX Talent Match LinkedIn placeholder')}
                  aria-label="LinkedIn"
                  className="w-10 h-10 rounded-xl border border-slate-800 bg-slate-900/80 hover:bg-slate-800 hover:border-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                >
                  <Linkedin className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => toast.info('RADIX Talent Match GitHub repository placeholder')}
                  aria-label="GitHub"
                  className="w-10 h-10 rounded-xl border border-slate-800 bg-slate-900/80 hover:bg-slate-800 hover:border-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                >
                  <Github className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-slate-400 pt-2">
                Direct Support:{' '}
                <a
                  href="mailto:support@radixtalent.io"
                  className="font-mono text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  support@radixtalent.io
                </a>
              </p>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
            <p>© 2026 RADIX Talent Match. All rights reserved.</p>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setLegalModal('privacy')}
                className="hover:text-white transition-colors cursor-pointer"
              >
                Privacy Policy
              </button>
              <span className="text-slate-600" aria-hidden="true">
                •
              </span>
              <button
                type="button"
                onClick={() => setLegalModal('terms')}
                className="hover:text-white transition-colors cursor-pointer"
              >
                Terms of Service
              </button>
              <span className="text-slate-600" aria-hidden="true">
                •
              </span>
              <span className="font-mono text-slate-400">v1.0.0-production</span>
            </div>
          </div>
        </div>
      </footer>

      <Modal
        isOpen={legalModal !== null}
        onClose={() => setLegalModal(null)}
        title={
          legalModal === 'privacy'
            ? 'Privacy Placeholder — Hackathon Prototype'
            : 'Terms of Use Placeholder — Hackathon Prototype'
        }
        footer={
          <Button variant="primary" size="sm" onClick={() => setLegalModal(null)}>
            Understood
          </Button>
        }
      >
        {legalModal === 'privacy' ? (
          <div className="space-y-3 text-xs leading-relaxed">
            <p>
              This application is a frontend prototype developed for the RADIX Talent Match Hackathon.
            </p>
            <p>
              No personal data, uploaded files, or credentials are transmitted to any external server during the frontend demo stage. All profile edits and analysis history are stored locally in your browser&apos;s <code>localStorage</code> and can be cleared at any time from Settings.
            </p>
          </div>
        ) : (
          <div className="space-y-3 text-xs leading-relaxed">
            <p>
              RADIX Talent Match is an educational and hackathon demonstration tool designed to help candidates explore job requirements, resume skill extraction, and competency gap comparisons.
            </p>
            <p>
              Company readiness thresholds and sample job descriptions are illustrative test benchmarks provided for the hackathon and do not represent official hiring guarantees or automated recruitment decisions.
            </p>
          </div>
        )}
      </Modal>
    </div>
  );
};
