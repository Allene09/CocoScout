import React from 'react';

export default function StatCard({ label, value, subtext, icon: Icon, variant = 'trees', trend }) {
  return (
    <div className="stat-card">
      <div className={`stat-icon-wrapper ${variant}`}>
        {Icon && <Icon size={26} />}
      </div>
      <div className="stat-info">
        <span className="stat-label">{label}</span>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
          <span className="stat-value">{value}</span>
          {trend && (
            <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 600 }}>
              {trend}
            </span>
          )}
        </div>
        {subtext && <span className="stat-sub">{subtext}</span>}
      </div>
    </div>
  );
}
