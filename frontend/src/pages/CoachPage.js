import React, { useState, useEffect, useRef } from 'react';
import { Send } from 'lucide-react';
import api from '../utils/api';

const METRICS = {
  recovery: 78, sleep: 82, sleepHours: 7.8, rhr: 49, hrv: 62,
  steps: 12480, stress: 34, vo2max: 56, calories: 2860, avgHr: 67
};

const QUICK = [
  'Was soll ich heute trainieren?',
  'Bin ich fit fuer Intervalle?',
  'Wie viel pro Woche trainieren?',
  'Gib mir einen Wochenplan'
];

export default function CoachPage() {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hey Vincent, frag mich einfach nach heute, Intervallen, Umfang oder deinem Wochenplan.' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState({ sport: 'Run', goal: 'Halbmarathon', days: 5, goalDate: '2026-09-21' });
  const [activities, setActivities] = useState([]);
  const messagesEnd = useRef(null);

  useEffect(() => {
    api.get('/api/profile').then(r => setProfile(p => ({ ...p, ...r.data }))).catch(() => {});
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
    api.get('/api/coach/history').then(r => {
      if (r.data.ok && r.data.messages && r.data.messages.length > 0) {
        const hist = r.data.messages.slice(-10).flatMap(m => [
          { role: 'user', content: m.question },
          { role: 'assistant', content: m.answer }
        ]);
        setMessages(prev => [...prev, ...hist]);
      }
    }).catch(() => {});
  }, []);

  useEffect(() => { messagesEnd.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const strain = Math.max(1, Math.min(100, Math.round(35 * 0.65 + METRICS.stress * 0.35)));

  const send = async (q) => {
    const question = q || input.trim();
    if (!question || loading) return;
    setInput('');
    const newMsgs = [...messages, { role: 'user', content: question }];
    setMessages(newMsgs);
    setLoading(true);

    try {
      const { data } = await api.post('/api/coach', {
        question,
        userData: profile,
        metrics: METRICS,
        activities,
        latestActivity: activities[0] || null,
        dayStrain: strain,
        history: newMsgs.slice(-10)
      });
      if (data.ok && data.answer) {
        setMessages(m => [...m, { role: 'assistant', content: data.answer }]);
      } else {
        setMessages(m => [...m, { role: 'assistant', content: 'Entschuldigung, ich konnte gerade nicht antworten.' }]);
      }
    } catch {
      setMessages(m => [...m, { role: 'assistant', content: 'Verbindungsfehler. Bitte versuche es erneut.' }]);
    } finally {
      setLoading(false);
    }
  };

  const sportMap = { Run: 'Laufen', Ride: 'Radfahren', Ski: 'Ski Skating', Mixed: 'Mixed' };

  return (
    <div className="animate-in" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 160px)' }} data-testid="coach-page">
      <h2 className="screen-title">Vincent</h2>
      <p className="screen-sub">Dein persoenlicher AI-Coach</p>

      <div className="coach-profile" data-testid="coach-profile">
        <p>{sportMap[profile.sport] || profile.sport} · {profile.goal} · {profile.days} Tage/Woche</p>
        <p>Erholung {METRICS.recovery} · Schlaf {METRICS.sleep} · Belastung {strain}</p>
      </div>

      <div className="coach-quick" data-testid="coach-quick-actions">
        {QUICK.map((q, i) => (
          <button key={i} className="coach-quick-btn" onClick={() => send(q)} disabled={loading} data-testid={`quick-q-${i}`}>
            {q}
          </button>
        ))}
      </div>

      <div className="coach-messages" data-testid="coach-messages">
        {messages.map((m, i) => (
          <div key={i} className={`msg ${m.role}`}>
            <div className="msg-role">{m.role === 'user' ? 'Du' : 'Vincent'}</div>
            <div className="msg-bubble" dangerouslySetInnerHTML={{ __html: m.content.replace(/\n/g, '<br/>') }} />
          </div>
        ))}
        {loading && (
          <div className="msg assistant">
            <div className="msg-role">Vincent</div>
            <div className="msg-bubble" style={{ opacity: 0.6 }}>Ich schaue kurz auf deine Daten...</div>
          </div>
        )}
        <div ref={messagesEnd} />
      </div>

      <div className="coach-input-row" data-testid="coach-input-row">
        <input
          className="coach-input"
          data-testid="coach-input"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && send()}
          placeholder="Frag Vincent..."
          disabled={loading}
        />
        <button className="coach-send" data-testid="coach-send-btn" onClick={() => send()} disabled={loading || !input.trim()}>
          <Send size={16} />
        </button>
      </div>
    </div>
  );
}
