import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, Loader2, X, Check, Mail } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';
import { AuthProviderType } from '../../services/interfaces';

interface AuthScreenProps {
  initialMode: 'login' | 'signup';
  onClose?: () => void;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const GitHubIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
    />
  </svg>
);

const GoogleIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
    <path
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      fill="#4285F4"
    />
    <path
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      fill="#34A853"
    />
    <path
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      fill="#FBBC05"
    />
    <path
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      fill="#EA4335"
    />
  </svg>
);

const LinkedInIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="#0A66C2" aria-hidden="true">
    <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
  </svg>
);

const AuthCard: React.FC<AuthScreenProps> = ({ initialMode, onClose }) => {
  const { login, signup, loginWithProvider, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTarget = (location.state as { from?: string } | null)?.from || '/app/dashboard';

  const isLogin = initialMode === 'login';

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [activeProvider, setActiveProvider] = useState<AuthProviderType | null>(null);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [resetEmail, setResetEmail] = useState('');

  const [errors, setErrors] = useState<{
    fullName?: string;
    email?: string;
    password?: string;
  }>({});

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      navigate('/');
    }
  };

  const validateForm = () => {
    const nextErrors: { fullName?: string; email?: string; password?: string } = {};

    if (!isLogin && fullName.trim().length < 2) {
      nextErrors.fullName = 'Please enter your full name.';
    }

    if (!email.trim()) {
      nextErrors.email = 'E-mail address is required.';
    } else if (!EMAIL_REGEX.test(email.trim())) {
      nextErrors.email = 'Please enter a valid e-mail address.';
    }

    if (!password) {
      nextErrors.password = 'Password is required.';
    } else if (password.length < 6) {
      nextErrors.password = 'Password must be at least 6 characters.';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      if (isLogin) {
        const session = await login({
          email: email.trim(),
          password,
          rememberMe,
        });
        toast.success(`Welcome back, ${session.name}`);
      } else {
        const session = await signup({
          name: fullName.trim(),
          email: email.trim(),
          password,
        });
        toast.success(`Account created for ${session.name}`);
      }
      navigate(redirectTarget, { replace: true });
    } catch (err: any) {
      const msg =
        err?.message ||
        (isLogin
          ? 'Unable to sign in. Please check your credentials.'
          : 'Unable to create account. Please try again.');
      toast.error(msg);
    }
  };

  const handleSocialLogin = async (provider: AuthProviderType) => {
    setActiveProvider(provider);
    try {
      const session = await loginWithProvider(provider);
      const label = provider === 'github' ? 'GitHub' : provider === 'google' ? 'Google' : 'LinkedIn';
      toast.success(`Signed in with ${label} as ${session.name}`);
      navigate(redirectTarget, { replace: true });
    } catch {
      toast.error('Social authentication could not be completed.');
    } finally {
      setActiveProvider(null);
    }
  };

  const handlePasswordReset = (e: React.FormEvent) => {
    e.preventDefault();
    const targetEmail = resetEmail.trim() || email.trim();
    if (!targetEmail || !EMAIL_REGEX.test(targetEmail)) {
      toast.error('Please enter a valid e-mail address to receive reset instructions.');
      return;
    }
    toast.success(`Password reset link sent to ${targetEmail}`);
    setShowForgotModal(false);
  };

  return (
    <div className="relative bg-white dark:bg-[#0D111D] rounded-3xl border border-slate-200/90 dark:border-slate-800/90 p-7 sm:p-9 shadow-[0_20px_60px_-15px_rgba(15,23,42,0.08)] dark:shadow-[0_24px_70px_-15px_rgba(0,0,0,0.65)] transition-colors duration-200">
      {/* A. Dismiss / Navigation Control */}
      <button
        type="button"
        onClick={handleClose}
        aria-label="Close authentication screen"
        className="absolute top-5 right-5 w-9 h-9 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
      >
        <X className="w-4 h-4 stroke-[2.25]" />
      </button>

      {/* B. Header & Typography */}
      <div className="pr-8 mb-6">
        <h1 className="text-2xl sm:text-[26px] font-bold tracking-tight text-[#1E1B4B] dark:text-white leading-snug">
          {isLogin ? 'Login to your account.' : 'Create an account.'}
        </h1>
        <p className="mt-1.5 text-sm text-[#64748B] dark:text-[#94A3B8] font-normal">
          {isLogin
            ? 'Hello, welcome back to your account'
            : 'Get started with your free candidate workspace.'}
        </p>
      </div>

      {isLogin && (
        <div className="mb-6 p-3.5 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/60 dark:border-indigo-800/60 flex items-center justify-between gap-3 text-xs">
          <div className="min-w-0">
            <p className="font-semibold text-indigo-950 dark:text-indigo-200">
              Quick Test Account:
            </p>
            <p className="font-mono text-indigo-700 dark:text-indigo-400 truncate">
              rohan.verma@radix.ai · Password123!
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setEmail('rohan.verma@radix.ai');
              setPassword('Password123!');
              toast.info('Filled test candidate credentials.');
            }}
            className="shrink-0 px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-[11px] transition shadow-xs cursor-pointer"
          >
            Auto-fill
          </button>
        </div>
      )}

      {/* C. Floating-Border Form Fields */}
      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        {!isLogin && (
          <div>
            <div className="relative">
              <label
                htmlFor="auth-full-name"
                className="absolute -top-2.5 left-3.5 px-1.5 bg-white dark:bg-[#0D111D] text-[12px] font-medium text-slate-600 dark:text-slate-300 pointer-events-none transition-colors"
              >
                Full Name
              </label>
              <input
                id="auth-full-name"
                type="text"
                autoComplete="name"
                value={fullName}
                onChange={(e) => {
                  setFullName(e.target.value);
                  if (errors.fullName) setErrors((prev) => ({ ...prev, fullName: undefined }));
                }}
                placeholder="Enter your full name"
                className={`w-full h-12 px-4 rounded-xl bg-transparent border text-sm text-[#0F172A] dark:text-[#F8FAFC] placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none transition ${
                  errors.fullName
                    ? 'border-rose-500 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/15'
                    : 'border-slate-200 dark:border-slate-800 focus:border-[#535BF2] dark:focus:border-[#6366F1] focus:ring-3 focus:ring-[#535BF2]/15'
                }`}
              />
            </div>
            {errors.fullName && (
              <p className="mt-1.5 text-xs text-rose-600 dark:text-rose-400 pl-1" role="alert">
                {errors.fullName}
              </p>
            )}
          </div>
        )}

        <div>
          <div className="relative">
            <label
              htmlFor="auth-email"
              className="absolute -top-2.5 left-3.5 px-1.5 bg-white dark:bg-[#0D111D] text-[12px] font-medium text-slate-600 dark:text-slate-300 pointer-events-none transition-colors"
            >
              E-mail
            </label>
            <input
              id="auth-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
              }}
              placeholder="example@email.com"
              className={`w-full h-12 px-4 rounded-xl bg-transparent border text-sm text-[#0F172A] dark:text-[#F8FAFC] placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none transition ${
                errors.email
                  ? 'border-rose-500 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/15'
                  : 'border-slate-200 dark:border-slate-800 focus:border-[#535BF2] dark:focus:border-[#6366F1] focus:ring-3 focus:ring-[#535BF2]/15'
              }`}
            />
          </div>
          {errors.email && (
            <p className="mt-1.5 text-xs text-rose-600 dark:text-rose-400 pl-1" role="alert">
              {errors.email}
            </p>
          )}
        </div>

        <div>
          <div className="relative">
            <label
              htmlFor="auth-password"
              className="absolute -top-2.5 left-3.5 px-1.5 bg-white dark:bg-[#0D111D] text-[12px] font-medium text-slate-600 dark:text-slate-300 pointer-events-none transition-colors"
            >
              Password
            </label>
            <input
              id="auth-password"
              type={showPassword ? 'text' : 'password'}
              autoComplete={isLogin ? 'current-password' : 'new-password'}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
              }}
              placeholder="Your Password"
              className={`w-full h-12 pl-4 pr-11 rounded-xl bg-transparent border text-sm text-[#0F172A] dark:text-[#F8FAFC] placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none transition ${
                errors.password
                  ? 'border-rose-500 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/15'
                  : 'border-slate-200 dark:border-slate-800 focus:border-[#535BF2] dark:focus:border-[#6366F1] focus:ring-3 focus:ring-[#535BF2]/15'
              }`}
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.password && (
            <p className="mt-1.5 text-xs text-rose-600 dark:text-rose-400 pl-1" role="alert">
              {errors.password}
            </p>
          )}
        </div>

        {/* D. Utility Actions (Login View) */}
        {isLogin && (
          <div className="flex items-center justify-between pt-0.5">
            <label className="inline-flex items-center gap-2.5 cursor-pointer select-none group">
              <span className="relative flex items-center justify-center">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="sr-only"
                />
                <span
                  className={`w-4 h-4 rounded-[5px] border flex items-center justify-center transition ${
                    rememberMe
                      ? 'bg-[#535BF2] border-[#535BF2] text-white'
                      : 'border-slate-300 dark:border-slate-700 bg-transparent group-hover:border-[#535BF2]'
                  }`}
                >
                  {rememberMe && <Check className="w-3 h-3 stroke-[3]" />}
                </span>
              </span>
              <span className="text-xs font-medium text-[#0F172A] dark:text-slate-300">
                Remember me
              </span>
            </label>

            <button
              type="button"
              onClick={() => {
                setResetEmail(email);
                setShowForgotModal(true);
              }}
              className="text-xs font-medium text-[#64748B] dark:text-[#94A3B8] hover:text-[#535BF2] dark:hover:text-[#6366F1] hover:underline transition cursor-pointer"
            >
              Forgot Password?
            </button>
          </div>
        )}

        {/* E. Primary Action Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full h-12 rounded-xl bg-[#535BF2] hover:bg-[#434CE6] active:scale-[0.99] text-white text-sm font-semibold shadow-sm shadow-[#535BF2]/25 transition flex items-center justify-center gap-2 disabled:opacity-60 disabled:pointer-events-none cursor-pointer"
        >
          {isLoading && !activeProvider ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>{isLogin ? 'Signing in...' : 'Creating account...'}</span>
            </>
          ) : (
            <span>{isLogin ? 'Login' : 'Create Account'}</span>
          )}
        </button>
      </form>

      {/* F. Divider */}
      <div className="relative my-6 flex items-center justify-center">
        <div className="w-full border-t border-slate-200 dark:border-slate-800" />
        <span className="relative px-3 bg-white dark:bg-[#0D111D] text-xs text-[#64748B] dark:text-[#94A3B8] whitespace-nowrap">
          {isLogin ? 'or sign in with' : 'or sign up with'}
        </span>
        <div className="w-full border-t border-slate-200 dark:border-slate-800" />
      </div>

      {/* G. Social Auth Providers */}
      <div className="grid grid-cols-3 gap-3">
        <button
          type="button"
          disabled={isLoading}
          onClick={() => handleSocialLogin('github')}
          aria-label={isLogin ? 'Sign in with GitHub' : 'Sign up with GitHub'}
          className="h-11 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:bg-slate-50 dark:hover:bg-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 text-slate-800 dark:text-slate-100 flex items-center justify-center gap-2 text-xs font-medium transition disabled:opacity-60 cursor-pointer"
        >
          {activeProvider === 'github' ? (
            <Loader2 className="w-4 h-4 animate-spin text-[#535BF2]" />
          ) : (
            <GitHubIcon className="w-4 h-4" />
          )}
          <span>GitHub</span>
        </button>

        <button
          type="button"
          disabled={isLoading}
          onClick={() => handleSocialLogin('google')}
          aria-label={isLogin ? 'Sign in with Google' : 'Sign up with Google'}
          className="h-11 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:bg-slate-50 dark:hover:bg-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 text-slate-800 dark:text-slate-100 flex items-center justify-center gap-2 text-xs font-medium transition disabled:opacity-60 cursor-pointer"
        >
          {activeProvider === 'google' ? (
            <Loader2 className="w-4 h-4 animate-spin text-[#535BF2]" />
          ) : (
            <GoogleIcon className="w-4 h-4" />
          )}
          <span>Google</span>
        </button>

        <button
          type="button"
          disabled={isLoading}
          onClick={() => handleSocialLogin('linkedin')}
          aria-label={isLogin ? 'Sign in with LinkedIn' : 'Sign up with LinkedIn'}
          className="h-11 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:bg-slate-50 dark:hover:bg-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 text-slate-800 dark:text-slate-100 flex items-center justify-center gap-2 text-xs font-medium transition disabled:opacity-60 cursor-pointer"
        >
          {activeProvider === 'linkedin' ? (
            <Loader2 className="w-4 h-4 animate-spin text-[#535BF2]" />
          ) : (
            <LinkedInIcon className="w-4 h-4" />
          )}
          <span>LinkedIn</span>
        </button>
      </div>

      {/* H. Alternate Mode Switcher */}
      <p className="mt-7 text-center text-xs text-[#64748B] dark:text-[#94A3B8]">
        {isLogin ? (
          <>
            Don&apos;t have an account?{' '}
            <Link
              to="/signup"
              state={location.state}
              className="font-semibold text-[#535BF2] dark:text-[#6366F1] hover:underline"
            >
              Sign up
            </Link>
          </>
        ) : (
          <>
            Already have an account?{' '}
            <Link
              to="/login"
              state={location.state}
              className="font-semibold text-[#535BF2] dark:text-[#6366F1] hover:underline"
            >
              Sign in
            </Link>
          </>
        )}
      </p>

      {/* Password Recovery Modal */}
      {showForgotModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
          aria-labelledby="reset-password-title"
        >
          <div className="relative w-full max-w-sm rounded-2xl bg-white dark:bg-[#0D111D] border border-slate-200 dark:border-slate-800 p-6 shadow-2xl">
            <button
              type="button"
              onClick={() => setShowForgotModal(false)}
              aria-label="Close password reset dialog"
              className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="w-10 h-10 rounded-xl bg-[#535BF2]/10 text-[#535BF2] flex items-center justify-center mb-4">
              <Mail className="w-5 h-5" />
            </div>

            <h2
              id="reset-password-title"
              className="text-lg font-bold text-[#1E1B4B] dark:text-white"
            >
              Reset your password
            </h2>
            <p className="mt-1 text-xs text-[#64748B] dark:text-[#94A3B8]">
              Enter the e-mail address associated with your account and we&apos;ll send you a link to reset your password.
            </p>

            <form onSubmit={handlePasswordReset} className="mt-5 space-y-4">
              <div className="relative">
                <label
                  htmlFor="reset-email-input"
                  className="absolute -top-2.5 left-3.5 px-1.5 bg-white dark:bg-[#0D111D] text-[12px] font-medium text-slate-600 dark:text-slate-300"
                >
                  E-mail
                </label>
                <input
                  id="reset-email-input"
                  type="email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  placeholder="example@email.com"
                  className="w-full h-11 px-3.5 rounded-xl bg-transparent border border-slate-200 dark:border-slate-800 text-sm text-[#0F172A] dark:text-[#F8FAFC] focus:outline-none focus:border-[#535BF2] focus:ring-3 focus:ring-[#535BF2]/15"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => setShowForgotModal(false)}
                  className="h-10 px-4 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="h-10 px-4 rounded-xl bg-[#535BF2] hover:bg-[#434CE6] text-white text-xs font-semibold transition cursor-pointer"
                >
                  Send Reset Link
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export const LoginPage: React.FC = () => <AuthCard initialMode="login" />;

export const SignupPage: React.FC = () => <AuthCard initialMode="signup" />;
