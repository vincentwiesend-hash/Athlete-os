import React, { useState, useEffect } from 'react';
import { Download, RefreshCw } from 'lucide-react';
import api from '../utils/api';

const METRICS = {
  recovery: 78, sleep: 82, sleepHours: 7.8, rhr: 49, hrv: 62,
  steps: 12480, stress: 34, vo2max: 56
};

export default function CalendarPage() {
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState({ sport: 'Run', goal: 'Halbmarathon', days: 5, goalDate: '2026-09-21' });
  const [activities, setActivities] = useState([]);

  useEffect(() => {
    api.get('/api/training-plan').then(r => {
      if (r.data.ok && r.data.plan) setPlan(r.data.plan);
    }).catch(() => {});
    api.get('/api/profile').then(r => setProfile(p => ({ ...p, ...r.data }))).catch(() => {});
    api.get('/api/strava/activities').then(r => {
      if (r.data.ok && r.data.activities) {
        setActivities(r.data.activities.slice(0, 5).map(a => ({
          name: a.name, type: a.type,
          distanceKm: a.distance ? (a.distance / 1000).toFixed(1) : 0,
          movingTimeMin: a.moving_time ? Math.round(a.moving_time / 60) : 0,
          load: Math.min(100, Math.max(5, Math.round((a.moving_time || 0) / 60 * 0.4 + (a.distance || 0) / 1000 * 1.6)))
        })));
      }
    }).catch(() => {});
  }, []);

  const generatePlan = async () => {
    setLoading(true);
    try {
      const strain = Math.max(1, Math.min(100, Math.round(35 * 0.65 + METRICS.stress * 0.35)));
      const { data } = await api.post('/api/calendar-plan', {
        userData: profile, metrics: METRICS, activities,
        latestActivity: activities[0] || null, dayStrain: strain
      });
      if (data.ok && data.plan) setPlan(data.plan);
    } catch { /* error handled silently */ }
    finally { setLoading(false); }
  };

  const exportIcs = async () => {
    try {
      const resp = await api.get('/api/calendar/export-ics', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([resp.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = 'athlete-os-training.ics';
      a.click();
      window.URL.revokeObjectURL(url);
    } catch { alert('Kein Wochenplan zum Exportieren vorhanden.'); }
  };

  const FALLBACK = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map((d, i) => ({
    day: d, title: ['Locker', 'Tempo', 'Ruhe', 'GA1', 'Kraft', 'Long', 'Easy'][i],
    details: 'Plan wird generiert...', type: 'training', intensity: 'low'
  }));

  const days = plan?.days || FALLBACK;

  return (
    <div className="animate-in" data-testid="calendar-page">
      <h2 className="screen-title">Wochenplaner</h2>
      <p className="screen-sub">Dein Trainingsplan fuer diese Woche</p>

      {plan?.weekFocus && (
        <div className="week-focus" data-testid="week-focus">
          <h3>Wochenfokus</h3>
          <p>{plan.weekFocus}</p>
        </div>
      )}

      {days.map((d, i) => (
        <div key={i} className={`cal-day ${d.type === 'rest' ? 'rest' : ''}`} data-testid={`cal-day-${d.day}`}>
          <div className="cal-day-left">
            <div className="cal-day-label">
              {d.intensity && <span className={`intensity-dot ${d.intensity}`} />}
              {d.day}
            </div>
            <div className="cal-day-detail">{d.details}</div>
          </div>
          <div className="cal-day-title">{d.title}</div>
        </div>
      ))}

      <div className="cal-actions" data-testid="calendar-actions">
        <button className="cal-btn primary" onClick={generatePlan} disabled={loading} data-testid="generate-plan-btn">
          <RefreshCw size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} />
          {loading ? 'Generiere...' : plan ? 'Neu generieren' : 'Plan erstellen'}
        </button>
        {plan && (
          <button className="cal-btn secondary" onClick={exportIcs} data-testid="export-ics-btn">
            <Download size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} />
            ICS Export
          </button>
        )}
      </div>
    </div>
  );
}
