import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  iconBgColor?: string;
  iconColor?: string;
  trendText?: string;
  trendPositive?: boolean;
  onClick?: () => void;
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  iconBgColor = 'bg-blue-50',
  iconColor = 'text-[#2855A6]',
  trendText,
  trendPositive = true,
  onClick,
  className = '',
}) => {
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs transition hover:shadow-md ${
        onClick ? 'cursor-pointer hover:border-blue-300' : ''
      } ${className}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-[#78869A] uppercase tracking-wider">{title}</p>
          <h3 className="text-2xl font-bold text-[#142B4A] mt-1.5 tracking-tight">{value}</h3>
          {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
        </div>

        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${iconBgColor}`}>
          <Icon className={`w-6 h-6 ${iconColor}`} />
        </div>
      </div>

      {trendText && (
        <div className="mt-3.5 pt-3 border-t border-slate-100 flex items-center gap-1.5 text-xs">
          <span
            className={`font-semibold ${
              trendPositive ? 'text-emerald-600' : 'text-amber-600'
            }`}
          >
            {trendText}
          </span>
        </div>
      )}
    </div>
  );
};
