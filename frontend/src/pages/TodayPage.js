import React, { useState, useEffect } from 'react';
import { Lightbulb, Target, Zap } from 'lucide-react';
import MetricRing from '../components/MetricRing';
import api from '../utils/api';

const METRICS = {
  recovery: 78, sleep: 82, sleepHours: 7.8, rhr: 49, hrv: 62,
  steps: 12480, stress: 34, vo2max: 56, calories: 2860, respiration: 14.8, avgHr: 67
};

function normalize(v, min, max) {
  return Math.round(((Math.max(min, Math.min(max, v)) - min) / (max - min)) * 100);
}

function getStatus(v) { return v >= 75 ? 'Gut' : v >= 50 ? 'Moderat' : 'Niedrig'; }

export default function TodayPage() {
  const [activities, setActivities] = useState([]);
  const [profile, setProfile] = useState({ sport: 'Run', goal: 'Halbmarathon', days: 5 });

  useEffect(() => {
    api.get('/api/strava/activities').then(r => {
      if (r.data.ok && r.data.activities) {
        setActivities(r.data.activities.slice(0, 5).map(a => ({
          name: a.name, type: a.type,
          distanceKm: a.distance ? (a.distance / 1000).toFixed(1) : 0,
          movingTimeMin: a.moving_time ? Math.round(a.moving_time / 60) : 0,
          load: Math.min(100, Math.max(5, Math.round((a.moving_time || 0) / 60 * 0.4 + (a.distance || 0) / 1000 * 1.6))),
          averageHeartrate: a.average_heartrate
        })));
      }
    }).catch(() => {});
    api.get('/api/profile').then(r => setProfile(p => ({ ...p, ...r.data }))).catch(() => {});
  }, []);

  const actLoad = activities.reduce((s, a) => s + (a.load || 0), 0);
  const strain = Math.max(1, Math.min(100, Math.round(normalize(actLoad, 0, 160) * 0.65 + METRICS.stress * 0.35)));
  const latest = activities[0];

  const rec = METRICS.recovery < 45 ? { t: 'Heute eher regenerativ', d: 'Vincent, heute eher locker oder Pause. Deine Erholung ist niedrig.' }
    : METRICS.recovery >= 70 && strain < 70 ? { t: 'Heute Qualitaet moeglich', d: 'Vincent, du bist frisch. Ein kontrollierter Reiz ist heute drin.' }
    : { t: 'Heute locker bis moderat', d: 'Vincent, ein ruhiger bis moderater Trainingstag passt heute.' };

  const planned = METRICS.recovery < 45 ? { t: '30 min Recovery', d: 'Locker bewegen oder Pause.' }
    : profile.goal === 'Marathon' ? { t: '60 min Grundlage', d: 'Stabil und ruhig, Fokus auf Umfang.' }
    : { t: '45-60 min locker', d: 'Ruhig laufen, sauberer Rhythmus.' };

  return (
    <div className="animate-in" data-testid="today-page">
      <h2 className="screen-title">Heute</h2>
      <p className="screen-sub">Dein Status fuer den heutigen Tag</p>

      <div className="metrics-row">
        <MetricRing value={METRICS.recovery} label="Erholung" status={getStatus(METRICS.recovery)} colorClass="recovery" />
        <MetricRing value={strain} label="Belastung" status={getStatus(strain)} colorClass="strain" />
        <MetricRing value={METRICS.sleep} label="Schlaf" status={getStatus(METRICS.sleep)} colorClass="sleep" />
      </div>

      <div className="quick-stats" data-testid="quick-stats">
        <div className="stat-box"><div className="stat-label">Schlaf</div><div className="stat-val">{METRICS.sleepHours}h</div></div>
        <div className="stat-box"><div className="stat-label">Ruhepuls</div><div className="stat-val">{METRICS.rhr}</div></div>
        <div className="stat-box"><div className="stat-label">HRV</div><div className="stat-val">{METRICS.hrv}ms</div></div>
        <div className="stat-box"><div className="stat-label">Schritte</div><div className="stat-val">{(METRICS.steps / 1000).toFixed(1)}k</div></div>
      </div>

      <div className="card" data-testid="recommendation-card">
        <div className="card-head"><Lightbulb size={16} className="card-head-icon" /><h3>Heute empfohlen</h3></div>
        <div className="card-body"><h4>{rec.t}</h4><p>{rec.d}</p></div>
      </div>

      <div className="card" data-testid="planned-card">
        <div className="card-head"><Target size={16} className="card-head-icon" /><h3>Geplante Einheit</h3></div>
        <div className="card-body"><h4>{planned.t}</h4><p>{planned.d}</p></div>
      </div>

      <div className="options-row" data-testid="options-row">
        <div className="option-card primary">
          <div className="option-kicker">Option A</div>
          <div className="option-title">Lockerer Dauerlauf</div>
          <div className="option-text">45-60 min locker in ruhigem Bereich.</div>
        </div>
        <div className="option-card">
          <div className="option-kicker">Option B</div>
          <div className="option-title">Recovery</div>
          <div className="option-text">30-40 min sehr locker oder Mobility.</div>
        </div>
      </div>

      <div className="card" data-testid="latest-activity-card">
        <div className="card-head"><Zap size={16} className="card-head-icon" /><h3>Letzte Aktivitaet</h3></div>
        <div className="card-body">
          {latest ? (
            <>
              <h4>{latest.name}</h4>
              <p>{latest.type} · {latest.distanceKm} km · {latest.movingTimeMin} min · {latest.load} Load
                {latest.averageHeartrate ? ` · ${Math.round(latest.averageHeartrate)} bpm` : ''}</p>
            </>
          ) : (
            <>
              <h4>Noch keine Aktivitaet</h4>
              <p>Verbinde Strava in den Einstellungen.</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
