import React, { useState, useEffect } from 'react';
import { Zap } from 'lucide-react';
import api from '../utils/api';

const ICONS = { Run: 'Lauf', Ride: 'Rad', Walk: 'Gehen', Hike: 'Wandern', Workout: 'Kraft', Swim: 'Schwimmen' };

function formatPace(distKm, timeMin, type) {
  if (type !== 'Run' && type !== 'Walk' && type !== 'Hike') return null;
  if (!distKm || distKm <= 0) return null;
  const minPerKm = timeMin / distKm;
  const m = Math.floor(minPerKm);
  const s = Math.round((minPerKm - m) * 60);
  return `${m}:${String(s).padStart(2, '0')} /km`;
}

function formatSpeed(distKm, timeMin, type) {
  if (type !== 'Ride') return null;
  if (!distKm || !timeMin) return null;
  return `${(distKm / (timeMin / 60)).toFixed(1)} km/h`;
}

export default function ActivitiesPage() {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/api/strava/activities').then(r => {
      if (r.data.ok && r.data.activities) {
        setActivities(r.data.activities.map(a => {
          const distKm = a.distance ? a.distance / 1000 : 0;
          const timeMin = a.moving_time ? Math.round(a.moving_time / 60) : 0;
          return {
            id: a.id, type: a.type || 'Workout', name: a.name || 'Aktivitaet',
            distKm, timeMin, hr: a.average_heartrate,
            load: Math.min(100, Math.max(5, Math.round(timeMin * 0.4 + distKm * 1.6 + (a.average_heartrate ? Math.max(0, a.average_heartrate - 95) * 0.22 : 0)))),
            pace: formatPace(distKm, timeMin, a.type),
            speed: formatSpeed(distKm, timeMin, a.type),
            date: a.start_date
          };
        }));
      }
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <div className="animate-in" data-testid="activities-page">
      <h2 className="screen-title">Training</h2>
      <p className="screen-sub">Deine letzten Trainingseinheiten</p>

      {loading ? (
        <div className="empty-state"><div className="loader-ring" style={{ margin: '0 auto' }} /></div>
      ) : activities.length === 0 ? (
        <div className="empty-state" data-testid="activities-empty">
          <Zap size={36} />
          <h3>Keine Aktivitaeten</h3>
          <p>Verbinde Strava in den Einstellungen, um deine Trainings zu sehen.</p>
        </div>
      ) : (
        activities.map(a => (
          <div className="activity-row" key={a.id} data-testid={`activity-${a.id}`}>
            <div className="activity-left">
              <div className="activity-type">{ICONS[a.type] || a.type}</div>
              <div className="activity-name">
                {a.name} · {a.distKm.toFixed(1)} km · {a.load} Load
                {a.pace ? ` · ${a.pace}` : ''}
                {a.speed ? ` · ${a.speed}` : ''}
                {a.hr ? ` · ${Math.round(a.hr)} bpm` : ''}
              </div>
            </div>
            <div className="activity-value">{a.timeMin}<span style={{ fontSize: 12, fontWeight: 400, color: 'var(--text-secondary)' }}> min</span></div>
          </div>
        ))
      )}
    </div>
  );
}
