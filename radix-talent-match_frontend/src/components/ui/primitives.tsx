import React, { useState, useRef } from 'react';
import { UploadCloud, FileText, X, AlertCircle, CheckCircle2 } from 'lucide-react';
import { cn } from '../../utils/cn';

/**
 * 1. BUTTON
 */
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, children, disabled, ...props }, ref) => {
    const variants = {
      primary:
        'bg-indigo-600 text-white hover:bg-indigo-500 dark:bg-indigo-500 dark:hover:bg-indigo-400 shadow-xs focus-visible:ring-indigo-500',
      secondary:
        'bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700',
      outline:
        'border border-slate-300 dark:border-slate-700 bg-transparent text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/70',
      ghost:
        'bg-transparent text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60',
      danger:
        'bg-red-600 text-white hover:bg-red-500 dark:bg-red-600 dark:hover:bg-red-500',
    };

    const sizes = {
      sm: 'h-8 px-3 text-xs rounded-md gap-1.5',
      md: 'h-10 px-4 py-2 text-sm rounded-lg gap-2',
      lg: 'h-11 px-6 py-2.5 text-sm rounded-lg gap-2.5',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          'inline-flex items-center justify-center font-medium whitespace-nowrap shrink-0 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-950 disabled:opacity-50 disabled:pointer-events-none cursor-pointer',
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {isLoading && (
          <svg
            className="animate-spin h-4 w-4 shrink-0"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';

/**
 * 2. INPUT
 */
export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helperText, id, ...props }, ref) => {
    const inputId = id || (label ? `input-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);
    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-medium text-slate-700 dark:text-slate-300"
          >
            {label}
          </label>
        )}
        <input
          id={inputId}
          ref={ref}
          className={cn(
            'w-full h-10 px-3.5 py-2 text-sm rounded-lg border bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500',
            error
              ? 'border-red-500 dark:border-red-500'
              : 'border-slate-300 dark:border-slate-700',
            className
          )}
          {...props}
        />
        {error && (
          <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1" role="alert">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{error}</span>
          </p>
        )}
        {!error && helperText && (
          <p className="text-xs text-slate-500 dark:text-slate-400">{helperText}</p>
        )}
      </div>
    );
  }
);
Input.displayName = 'Input';

/**
 * 3. SELECT
 */
export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: Array<{ value: string; label: string }>;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, options, id, ...props }, ref) => {
    const selectId = id || (label ? `select-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);
    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label
            htmlFor={selectId}
            className="block text-xs font-medium text-slate-700 dark:text-slate-300"
          >
            {label}
          </label>
        )}
        <select
          id={selectId}
          ref={ref}
          className={cn(
            'w-full h-10 px-3 py-2 text-sm rounded-lg border bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500',
            error ? 'border-red-500' : 'border-slate-300 dark:border-slate-700',
            className
          )}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {error && (
          <p className="text-xs text-red-600 dark:text-red-400" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }
);
Select.displayName = 'Select';

/**
 * 4. BADGE (Clean unboxed / semantic status label with explicit text)
 */
export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'accent';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'default', className }) => {
  const styles = {
    default: 'text-slate-600 dark:text-slate-400',
    success: 'text-emerald-700 dark:text-emerald-400 font-medium',
    warning: 'text-amber-700 dark:text-amber-400 font-medium',
    danger: 'text-red-700 dark:text-red-400 font-medium',
    accent: 'text-indigo-600 dark:text-indigo-400 font-medium',
  };
  return (
    <span className={cn('inline-flex items-center gap-1 text-xs whitespace-nowrap shrink-0', styles[variant], className)}>
      {children}
    </span>
  );
};

/**
 * 5. PROGRESS BAR
 */
export interface ProgressProps {
  value: number;
  max?: number;
  label?: string;
  showValue?: boolean;
  tone?: 'indigo' | 'emerald' | 'amber' | 'rose' | 'cyan';
  className?: string;
}

export const Progress: React.FC<ProgressProps> = ({
  value,
  max = 100,
  label,
  showValue = false,
  tone = 'indigo',
  className,
}) => {
  const percentage = Math.min(100, Math.max(0, Math.round((value / max) * 100)));
  const tones = {
    indigo: 'bg-indigo-600 dark:bg-indigo-500',
    emerald: 'bg-emerald-600 dark:bg-emerald-500',
    amber: 'bg-amber-500',
    rose: 'bg-red-600 dark:bg-red-500',
    cyan: 'bg-cyan-600 dark:bg-cyan-500',
  };

  return (
    <div className={cn('w-full space-y-1.5', className)}>
      {(label || showValue) && (
        <div className="flex items-center justify-between text-xs">
          {label && <span className="font-medium text-slate-700 dark:text-slate-300">{label}</span>}
          {showValue && (
            <span className="font-mono tabular-nums text-slate-600 dark:text-slate-400">
              {percentage}%
            </span>
          )}
        </div>
      )}
      <div
        className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden"
        role="progressbar"
        aria-valuenow={percentage}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className={cn('h-full transition-all duration-300 rounded-full', tones[tone])}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

/**
 * 6. SCORE RING
 */
export interface ScoreRingProps {
  score: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
  sublabel?: string;
}

export const ScoreRing: React.FC<ScoreRingProps> = ({
  score,
  size = 112,
  strokeWidth = 8,
  label,
  sublabel,
}) => {
  const clamped = Math.min(100, Math.max(0, Math.round(score)));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;

  const strokeColor =
    clamped >= 75
      ? 'stroke-emerald-500'
      : clamped >= 55
      ? 'stroke-indigo-500'
      : 'stroke-amber-500';

  const statusLabel =
    clamped >= 75 ? 'Job-Ready' : clamped >= 55 ? 'Moderate Fit' : 'Needs Upskilling';

  return (
    <div className="inline-flex flex-col items-center gap-1.5">
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            strokeWidth={strokeWidth}
            className="stroke-slate-200 dark:stroke-slate-800"
            fill="transparent"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className={cn('transition-all duration-500 ease-out', strokeColor)}
            fill="transparent"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="font-mono tabular-nums text-2xl font-bold text-slate-900 dark:text-white">
            {clamped}
          </span>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">/100</span>
        </div>
      </div>
      {label && (
        <div className="text-center">
          <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">{label}</p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">{sublabel || statusLabel}</p>
        </div>
      )}
    </div>
  );
};

/**
 * 7. STAT CARD
 */
export interface StatCardProps {
  label: string;
  value: string | number;
  meta?: string;
  icon?: React.ReactNode;
  actionLabel?: string;
  onAction?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  meta,
  icon,
  actionLabel,
  onAction,
}) => {
  return (
    <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col justify-between gap-3">
      <div className="flex items-start justify-between gap-3">
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</span>
        {icon && <span className="text-slate-400 dark:text-slate-500 shrink-0">{icon}</span>}
      </div>
      <div>
        <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
          {value}
        </div>
        {meta && (
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{meta}</p>
        )}
      </div>
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline text-left w-fit cursor-pointer"
        >
          {actionLabel} →
        </button>
      )}
    </div>
  );
};

/**
 * 8. PAGE HEADER
 */
export interface PageHeaderProps {
  kicker?: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  kicker,
  title,
  description,
  actions,
}) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
      <div className="space-y-1 max-w-2xl">
        {kicker && (
          <p className="text-xs font-medium text-indigo-600 dark:text-indigo-400">
            {kicker}
          </p>
        )}
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          {title}
        </h1>
        {description && (
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2.5 shrink-0 flex-wrap">{actions}</div>}
    </div>
  );
};

/**
 * 9. EMPTY STATE
 */
export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
}) => {
  return (
    <div className="py-12 px-6 text-center rounded-xl border border-dashed border-slate-300 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 flex flex-col items-center justify-center max-w-lg mx-auto my-4">
      {icon && (
        <div className="w-10 h-10 rounded-lg bg-slate-200/70 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400 mb-3">
          {icon}
        </div>
      )}
      <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{title}</h3>
      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm leading-relaxed">
        {description}
      </p>
      {actionLabel && onAction && (
        <Button variant="primary" size="sm" onClick={onAction} className="mt-4">
          {actionLabel}
        </Button>
      )}
    </div>
  );
};

/**
 * 10. ERROR STATE
 */
export interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Unable to complete operation',
  message,
  onRetry,
}) => {
  return (
    <div
      role="alert"
      className="p-5 rounded-xl border border-red-200 dark:border-red-900/60 bg-red-50/60 dark:bg-red-950/30 flex items-start justify-between gap-4"
    >
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
        <div>
          <h4 className="text-sm font-semibold text-red-900 dark:text-red-200">{title}</h4>
          <p className="text-xs text-red-700 dark:text-red-300 mt-1">{message}</p>
        </div>
      </div>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          Retry
        </Button>
      )}
    </div>
  );
};

/**
 * 11. SKELETON
 */
export const Skeleton: React.FC<{ className?: string }> = ({ className }) => (
  <div
    className={cn(
      'animate-pulse rounded-md bg-slate-200 dark:bg-slate-800',
      className
    )}
    aria-hidden="true"
  />
);

/**
 * 12. MODAL & CONFIRM DIALOG
 */
export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className="w-full max-w-lg rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h2 id="modal-title" className="text-base font-semibold text-slate-900 dark:text-white">
              {title}
            </h2>
            {description && (
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{description}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-5 text-sm text-slate-700 dark:text-slate-300 max-h-[70vh] overflow-y-auto">
          {children}
        </div>
        {footer && (
          <div className="px-5 py-3.5 bg-slate-50 dark:bg-slate-950/50 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2.5">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  variant?: 'primary' | 'danger';
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  variant = 'primary',
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant={variant}
            size="sm"
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{message}</p>
    </Modal>
  );
};

/**
 * 13. FILE UPLOAD (Drag-and-drop PDF / DOCX with validation & preview)
 */
export interface FileUploadProps {
  label?: string;
  accept?: string;
  maxSizeMB?: number;
  selectedFile: File | null;
  onFileSelect: (file: File | null) => void;
  helperText?: string;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  label = 'Upload Document (PDF, Word, TXT, MD)',
  accept = '.pdf,.docx,.doc,.txt,.md,.rtf,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword,text/plain,text/markdown',
  maxSizeMB = 15,
  selectedFile,
  onFileSelect,
  helperText = 'Supports PDF, Word (.docx, .doc), and Text (.txt, .md) up to 15 MB',
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const validateAndSet = (file: File | null) => {
    setError(null);
    if (!file) {
      onFileSelect(null);
      return;
    }

    const ext = file.name.split('.').pop()?.toLowerCase();
    const allowed = ['pdf', 'docx', 'doc', 'txt', 'md', 'markdown', 'rtf', 'text'];
    if (!ext || !allowed.includes(ext)) {
      setError('Invalid file format. Supported: .pdf, .docx, .doc, .txt, .md');
      return;
    }

    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`File exceeds maximum size of ${maxSizeMB} MB.`);
      return;
    }

    onFileSelect(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSet(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
          {label}
        </label>
      )}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setDragActive(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setDragActive(false);
        }}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        tabIndex={0}
        role="button"
        aria-label={label}
        className={cn(
          'p-5 rounded-xl border border-dashed transition-colors cursor-pointer flex flex-col items-center justify-center text-center focus:outline-none focus:ring-2 focus:ring-indigo-500',
          dragActive
            ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30'
            : 'border-slate-300 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-900/50 hover:border-indigo-400 dark:hover:border-indigo-500'
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={(e) => validateAndSet(e.target.files?.[0] || null)}
        />
        {selectedFile ? (
          <div className="flex items-center justify-between w-full max-w-md px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2.5 min-w-0 text-left">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                  {selectedFile.name}
                </p>
                <p className="text-[11px] font-mono text-slate-500">
                  {(selectedFile.size / 1024).toFixed(1)} KB · Validated for Demo Pipeline
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                validateAndSet(null);
              }}
              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              aria-label="Remove selected file"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <>
            <div className="w-9 h-9 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-2">
              <UploadCloud className="w-5 h-5" />
            </div>
            <p className="text-xs font-medium text-slate-800 dark:text-slate-200">
              Drag & drop your file here, or <span className="text-indigo-600 dark:text-indigo-400 underline">browse</span>
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">{helperText}</p>
          </>
        )}
      </div>
      {error && (
        <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1" role="alert">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
};

/**
 * 14. TOOLTIP (Simple accessible hover/focus wrapper)
 */
export const Tooltip: React.FC<{ content: string; children: React.ReactNode }> = ({
  content,
  children,
}) => (
  <span className="relative group inline-flex items-center">
    {children}
    <span
      role="tooltip"
      className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:block group-focus-within:block px-2.5 py-1 rounded bg-slate-900 text-white text-[11px] whitespace-nowrap shadow-md z-40"
    >
      {content}
    </span>
  </span>
);
