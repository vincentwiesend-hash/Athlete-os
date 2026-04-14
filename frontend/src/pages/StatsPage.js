import React, { useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer } from 'recharts';

const METRICS = {
  recovery: 78, sleep: 82, sleepHours: 7.8, rhr: 49, hrv: 62,
  steps: 12480, stress: 34, vo2max: 56, calories: 2860, respiration: 14.8, avgHr: 67
};

const HISTORY = {
  hrv: { '7d': [54,56,58,55,59,61,62], '1m': [50,51,50,52,53,54,55,54,53,55,56,55,57,58,57,59,60,58,57,59,60,61,60,59,61,62,61,60,61,62] },
  rhr: { '7d': [53,52,51,52,50,50,49], '1m': [55,55,54,54,54,53,53,54,53,52,52,53,52,51,51,52,51,50,50,51,50,49,50,49,49,50,49,49,49,49] },
  vo2max: { '7d': [55,55,55,56,56,56,56], '1m': [54,54,54,54,54,54,55,55,55,55,55,55,55,55,56,56,56,56,56,56,56,56,56,56,56,56,56,56,56,56] },
  steps: { '7d': [10200,11040,9700,12100,13200,14080,12480], '1m': [9200,9800,10200,11000,8900,9600,10040,10400,11200,11800,9900,10200,10600,10900,11300,11500,11900,12100,12500,12800,11700,11000,10800,11400,12200,13000,13600,14100,13800,12480] },
  calories: { '7d': [2500,2620,2400,2760,2880,2970,2860], '1m': [2350,2400,2480,2510,2320,2380,2440,2500,2570,2620,2410,2460,2520,2590,2630,2670,2710,2760,2800,2850,2740,2680,2640,2700,2790,2860,2920,2980,2940,2860] },
  sleep: { '7d': [74,78,80,76,79,81,82], '1m': [70,72,74,75,73,76,78,74,77,79,76,80,78,81,79,82,80,83,81,84,82,80,78,81,83,80,82,81,83,82] },
  avgHr: { '7d': [69,68,70,68,67,66,67], '1m': [72,71,70,71,70,69,70,69,70,68,69,68,69,67,68,67,68,66,67,66,67,66,67,66,67,66,67,66,67,67] },
};

const ITEMS = [
  { key: 'hrv', label: 'HRV', value: `${METRICS.hrv} ms`, sub: 'Herzfrequenzvariabilitaet' },
  { key: 'rhr', label: 'Ruhepuls', value: `${METRICS.rhr}`, sub: 'bpm' },
  { key: 'steps', label: 'Schritte', value: `${METRICS.steps}`, sub: 'heute' },
  { key: 'vo2max', label: 'VO2max', value: `${METRICS.vo2max}`, sub: 'ml/kg/min' },
  { key: 'calories', label: 'Kalorien', value: `${METRICS.calories}`, sub: 'gesamt' },
  { key: 'avgHr', label: 'Durchschn. Puls', value: `${METRICS.avgHr}`, sub: 'bpm' },
  { key: 'sleep', label: 'Schlaf-Score', value: `${METRICS.sleep}`, sub: 'Qualitaet' },
];

export default function StatsPage() {
  const [openKey, setOpenKey] = useState(null);
  const [range, setRange] = useState('7d');

  const toggle = (key) => { setOpenKey(openKey === key ? null : key); setRange('7d'); };

  const getChartData = (key) => {
    const vals = HISTORY[key]?.[range] || HISTORY[key]?.['7d'] || [];
    return vals.map((v, i) => ({ i, v }));
  };

  return (
    <div className="animate-in" data-testid="stats-page">
      <h2 className="screen-title">Statistiken</h2>
      <p className="screen-sub">Detaillierte Uebersicht deiner Kennzahlen</p>

      {ITEMS.map(item => (
        <div key={item.key}>
          <div className="dash-row" onClick={() => toggle(item.key)} data-testid={`stat-${item.key}`}>
            <div>
              <div className="dash-label">{item.label}</div>
              <div className="dash-sub">{item.sub}</div>
            </div>
            <div className="dash-value">{item.value}</div>
          </div>

          {openKey === item.key && (
            <div className="dash-detail" data-testid={`stat-detail-${item.key}`}>
              <div className="dash-detail-header">
                <div>
                  <div className="dash-detail-title">{item.label}</div>
                  <div className="dash-detail-sub">Trend {range.toUpperCase()}</div>
                </div>
                <button className="close-btn" onClick={() => setOpenKey(null)}>×</button>
              </div>
              <div className="range-tabs">
                {['7d', '1m'].map(r => (
                  <button key={r} className={`range-tab ${range === r ? 'active' : ''}`} onClick={() => setRange(r)}>
                    {r.toUpperCase()}
                  </button>
                ))}
              </div>
              <ResponsiveContainer width="100%" height={140}>
                <AreaChart data={getChartData(item.key)}>
                  <defs>
                    <linearGradient id={`grad-${item.key}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6c63ff" stopOpacity={0.25} />
                      <stop offset="100%" stopColor="#6c63ff" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Area type="monotone" dataKey="v" stroke="#6c63ff" strokeWidth={2} fill={`url(#grad-${item.key})`} />
                  <XAxis dataKey="i" hide />
                  <YAxis hide domain={['dataMin - 2', 'dataMax + 2']} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
