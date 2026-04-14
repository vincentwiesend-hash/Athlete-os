import React, { useState, useEffect } from 'react';
import { Download, RefreshCw, Edit3, Check, X, Watch, Wand2 } from 'lucide-react';
import api from '../utils/api';

const METRICS = {
  recovery: 78, sleep: 82, sleepHours: 7.8, rhr: 49, hrv: 62,
  steps: 12480, stress: 34, vo2max: 56
};

export default function CalendarPage() {
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [editIdx, setEditIdx] = useState(null);
  const [editData, setEditData] = useState({});
  const [pushing, setPushing] = useState(null);
  const [profile, setProfile] = useState({ sport: 'Run', goal: 'Halbmarathon', days: 5, goalDate: '2026-09-21' });
  const [activities, setActivities] = useState([]);
  const [coachSuggestion, setCoachSuggestion] = useState('');
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    api.get('/api/training-plan').then(r => { if (r.data.ok && r.data.plan) setPlan(r.data.plan); }).catch(() => {});
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
    } catch {}
    finally { setLoading(false); }
  };

  const exportIcs = async () => {
    try {
      const resp = await api.get('/api/calendar/export-ics', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([resp.data]));
      const a = document.createElement('a'); a.href = url; a.download = 'athlete-os-training.ics'; a.click();
      window.URL.revokeObjectURL(url);
    } catch { alert('Kein Wochenplan zum Exportieren.'); }
  };

  const startEdit = (i, day) => { setEditIdx(i); setEditData({ title: day.title, details: day.details, type: day.type || 'training', intensity: day.intensity || 'medium' }); };

  const saveEdit = async () => {
    try {
      const { data } = await api.put('/api/training-plan/day', { dayIndex: editIdx, updates: editData });
      if (data.ok) { setPlan(p => ({ ...p, days: p.days.map((d, i) => i === editIdx ? { ...d, ...editData } : d) })); }
    } catch {}
    setEditIdx(null);
  };

  const pushToGarmin = async (day) => {
    setPushing(day.day);
    try {
      const { data } = await api.post('/api/garmin/push-workout', { workout: { title: day.title, details: day.details, duration_minutes: 45 } });
      alert(data.message || 'Gesendet');
    } catch { alert('Garmin nicht verbunden.'); }
    finally { setPushing(null); }
  };

  const applyCoachSuggestion = async () => {
    if (!coachSuggestion.trim()) return;
    setApplying(true);
    try {
      const { data } = await api.post('/api/coach/apply-to-plan', { suggestion: coachSuggestion });
      if (data.ok && data.plan) { setPlan(data.plan); setCoachSuggestion(''); }
    } catch { alert('Konnte Vorschlag nicht uebernehmen.'); }
    finally { setApplying(false); }
  };

  const days = plan?.days || ['Mo','Di','Mi','Do','Fr','Sa','So'].map((d, i) => ({
    day: d, title: ['Locker','Tempo','Ruhe','GA1','Kraft','Long','Easy'][i], details: '...', type: 'training', intensity: 'low'
  }));

  return (
    <div className="animate-in" data-testid="calendar-page">
      <h2 className="screen-title">Wochenplaner</h2>
      <p className="screen-sub">Trainingsplan bearbeiten und synchronisieren</p>

      {plan?.weekFocus && (
        <div className="week-focus" data-testid="week-focus">
          <h3>Wochenfokus</h3><p>{plan.weekFocus}</p>
        </div>
      )}

      {days.map((d, i) => (
        <div key={i} data-testid={`cal-day-${d.day}`}>
          {editIdx === i ? (
            <div style={{ background: 'rgba(108,99,255,.06)', border: '1px solid rgba(108,99,255,.2)', borderRadius: 12, padding: 14, marginBottom: 8 }}>
              <input className="form-input" value={editData.title} onChange={e => setEditData(p => ({ ...p, title: e.target.value }))}
                placeholder="Titel" style={{ marginBottom: 8, fontSize: 13 }} data-testid={`edit-title-${i}`} />
              <input className="form-input" value={editData.details} onChange={e => setEditData(p => ({ ...p, details: e.target.value }))}
                placeholder="Details" style={{ marginBottom: 8, fontSize: 13 }} data-testid={`edit-details-${i}`} />
              <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
                {['training', 'rest', 'recovery'].map(t => (
                  <button key={t} onClick={() => setEditData(p => ({ ...p, type: t }))}
                    style={{ flex: 1, padding: '6px 0', borderRadius: 8, fontSize: 11, border: '1px solid var(--border-color)', cursor: 'pointer',
                      background: editData.type === t ? 'rgba(108,99,255,.15)' : 'transparent', color: 'var(--text-primary)' }}>
                    {t === 'training' ? 'Training' : t === 'rest' ? 'Ruhe' : 'Recovery'}
                  </button>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                {['low', 'medium', 'high'].map(int_ => (
                  <button key={int_} onClick={() => setEditData(p => ({ ...p, intensity: int_ }))}
                    style={{ flex: 1, padding: '6px 0', borderRadius: 8, fontSize: 11, border: '1px solid var(--border-color)', cursor: 'pointer',
                      background: editData.intensity === int_ ? (int_ === 'high' ? 'rgba(239,68,68,.15)' : int_ === 'medium' ? 'rgba(245,158,11,.15)' : 'rgba(16,185,129,.15)') : 'transparent',
                      color: 'var(--text-primary)' }}>
                    {int_ === 'low' ? 'Leicht' : int_ === 'medium' ? 'Mittel' : 'Hart'}
                  </button>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                <button onClick={saveEdit} style={{ flex: 1, padding: 8, borderRadius: 8, background: '#6c63ff', color: 'white', border: 'none', fontSize: 12, fontWeight: 600, cursor: 'pointer' }} data-testid={`save-edit-${i}`}>
                  <Check size={12} style={{ marginRight: 4 }} /> Speichern
                </button>
                <button onClick={() => setEditIdx(null)} style={{ padding: 8, borderRadius: 8, background: 'rgba(255,255,255,.04)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', fontSize: 12, cursor: 'pointer' }}>
                  <X size={12} />
                </button>
              </div>
            </div>
          ) : (
            <div className={`cal-day ${d.type === 'rest' ? 'rest' : ''}`} style={{ position: 'relative' }}>
              <div className="cal-day-left">
                <div className="cal-day-label">
                  {d.intensity && <span className={`intensity-dot ${d.intensity}`} />}
                  {d.day}
                </div>
                <div className="cal-day-detail">{d.details}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div className="cal-day-title">{d.title}</div>
                <button onClick={() => startEdit(i, d)} title="Bearbeiten"
                  style={{ background: 'none', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer', padding: 4 }} data-testid={`edit-btn-${i}`}>
                  <Edit3 size={14} />
                </button>
                {d.type !== 'rest' && (
                  <button onClick={() => pushToGarmin(d)} title="An Garmin senden" disabled={pushing === d.day}
                    style={{ background: 'none', border: 'none', color: pushing === d.day ? 'var(--text-tertiary)' : '#00d4ff', cursor: 'pointer', padding: 4 }} data-testid={`push-garmin-${i}`}>
                    <Watch size={14} />
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      ))}

      {/* Coach-Vorschlag direkt uebernehmen */}
      <div style={{ background: 'rgba(245,158,11,.04)', border: '1px solid rgba(245,158,11,.12)', borderRadius: 14, padding: 14, marginTop: 16, marginBottom: 16 }} data-testid="coach-apply">
        <div style={{ fontSize: 11, fontWeight: 600, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
          <Wand2 size={14} /> Coach-Vorschlag uebernehmen
        </div>
        <div style={{ display: 'flex', gap: 0 }}>
          <input className="coach-input" value={coachSuggestion} onChange={e => setCoachSuggestion(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && applyCoachSuggestion()}
            placeholder="z.B. Mittwoch statt Tempo lieber Intervalle..." disabled={applying} data-testid="coach-suggestion-input" />
          <button className="coach-send" onClick={applyCoachSuggestion} disabled={applying || !coachSuggestion.trim()} data-testid="apply-suggestion-btn">
            {applying ? '...' : <Wand2 size={14} />}
          </button>
        </div>
        <div style={{ fontSize: 10, color: 'var(--text-tertiary)', marginTop: 6 }}>Vincent passt den Plan nach deinem Wunsch an.</div>
      </div>

      <div className="cal-actions" data-testid="calendar-actions">
        <button className="cal-btn primary" onClick={generatePlan} disabled={loading} data-testid="generate-plan-btn">
          <RefreshCw size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} />
          {loading ? 'Generiere...' : plan ? 'Neu generieren' : 'Plan erstellen'}
        </button>
        {plan && (
          <button className="cal-btn secondary" onClick={exportIcs} data-testid="export-ics-btn">
            <Download size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} /> ICS
          </button>
        )}
      </div>
    </div>
  );
}
