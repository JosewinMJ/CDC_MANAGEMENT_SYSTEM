import React from 'react';
import { BADGE_STYLES } from '../../shared/theme';

interface StatusBadgeProps {
  status: string;
  label?: string;
  dot?: boolean;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  label,
  dot = true,
  className = '',
}) => {
  const normalizedKey = status.toUpperCase().replace(/\s+/g, '_') as keyof typeof BADGE_STYLES;
  const style = BADGE_STYLES[normalizedKey] || 'bg-slate-100 text-slate-700 border-slate-200';

  // Format label nicely if not explicitly provided
  const displayLabel = label || status.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase());

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${style} ${className}`}
    >
      {dot && <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />}
      {displayLabel}
    </span>
  );
};
