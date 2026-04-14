import React from 'react';

const C = 264.6; // 2*PI*42.1 circumference

function MetricRing({ value, label, status, colorClass }) {
  const offset = C - (value / 100) * C;
  return (
    <div className="metric-card" data-testid={`metric-${colorClass}`}>
      <div className="metric-label">{label}</div>
      <div className="ring-wrap">
        <svg className="ring-svg" viewBox="0 0 96 96">
          <circle cx="48" cy="48" r="42.1" className="ring-bg" />
          <circle cx="48" cy="48" r="42.1" className={`ring-fill ${colorClass}`}
            strokeDasharray={C} strokeDashoffset={offset} />
        </svg>
        <div className="ring-center">
          <div className="ring-value">{value}</div>
          <div className="ring-status">{status}</div>
        </div>
      </div>
    </div>
  );
}

export default MetricRing;
