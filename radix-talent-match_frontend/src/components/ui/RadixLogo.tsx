import React from 'react';
import { cn } from '../../utils/cn';

interface RadixLogoProps {
  className?: string;
  showSubtitle?: boolean;
}

/**
 * Reusable RADIX geometric SVG mark + wordmark inspired by the hackathon brief cover
 * (concentric orbital rings with precision node markers).
 */
export const RadixLogo: React.FC<RadixLogoProps> = ({ className }) => {
  return (
    <span className={cn('inline-flex items-center gap-2.5 whitespace-nowrap shrink-0 select-none', className)}>
      <svg
        width="28"
        height="28"
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0"
        aria-hidden="true"
      >
        <circle
          cx="16"
          cy="16"
          r="14"
          className="stroke-slate-400/50 dark:stroke-slate-600"
          strokeWidth="1.5"
        />
        <circle
          cx="16"
          cy="16"
          r="9"
          className="stroke-indigo-500/70 dark:stroke-indigo-400/70"
          strokeWidth="1.5"
        />
        <circle cx="16" cy="16" r="4" className="fill-indigo-600 dark:fill-indigo-400" />
        <circle cx="25" cy="16" r="2" className="fill-cyan-500" />
        <circle cx="10" cy="6" r="1.75" className="fill-amber-500" />
      </svg>
      <span className="font-bold tracking-tight text-slate-900 dark:text-white text-base sm:text-lg">
        RADIX <span className="font-medium text-indigo-600 dark:text-indigo-400">Talent Match</span>
      </span>
    </span>
  );
};
