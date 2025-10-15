/**
 * Stat Card Component
 * Display statistics in a card format
 */

import './StatCard.css';

interface StatCardProps {
  label: string;
  value: string | number;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
  icon?: string;
}

export const StatCard = ({ label, value, change, trend = 'neutral', icon }: StatCardProps) => {
  return (
    <div className="stat-card">
      <div className="stat-card-header">
        <span className="stat-label">{label}</span>
        {icon && <span className="stat-icon">{icon}</span>}
      </div>
      <div className="stat-value">{value}</div>
      {change && (
        <div className={`stat-change stat-change-${trend}`}>
          {change}
        </div>
      )}
    </div>
  );
};

