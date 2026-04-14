import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { User, Link2, MessageCircle, Shield, ChevronRight, RefreshCw, Watch, LogOut, FileText } from 'lucide-react';
import api from '../utils/api';

const CHANGELOG = [
  {
    version: '1.2.0', date: '2026-04-14', title: 'Coach Vincent & Kalender-Upgrade',
    changes: [
      'AI-Coach Vincent mit Gedaechtnis und kompakten Antworten',
      'Interaktiver Trainingskalender mit Wochenplan',
      'ICS-Export fuer iCloud/Google Kalender',
      'Strava-Integration mit automatischem Token-Refresh',
      'Garmin-Integration vorbereitet',
      'Settings mit Versionsanzeige und Changelog',
      'Statistiken mit Zeitreihen-Charts',
      'Mobile-optimiertes Design'
    ]
  },
  {
    version: '1.1.0', date: '2026-03-01', title: 'Strava & AI-Coach',
    changes: ['Strava-Anbindung', 'AI-Coach mit Gemini 2.5', 'Metriken-Dashboard', 'Wochenplaner Grundversion']
  },
  {
    version: '1.0.0', date: '2026-01-15', title: 'Erster Release',
    changes: ['Grundlegende App-Struktur', 'Heute-Ansicht', 'Trainingsempfehlungen', 'Profil-Einstellungen']
  }
];

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const [view, setView] = useState('main');
  const [profile, setProfile] = useState({ sport: 'Run', goal: 'Halbmarathon', days: 5, goalDate: '2026-09-21' });
  const [strava, setStrava] = useState({ connected: false, athlete: null });
  const [garmin, setGarmin] = useState({ connected: false });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/api/profile').then(r => setProfile(p => ({ ...p, ...r.data }))).catch(() => {});
    api.get('/api/strava/status').then(r => setStrava(r.data)).catch(() => {});
    api.get('/api/garmin/status').then(r => setGarmin(r.data)).catch(() => {});
  }, []);

  const saveProfile = async (field, value) => {
    setSaving(true);
    try {
      const update = { [field]: value };
      await api.put('/api/profile', update);
      setProfile(p => ({ ...p, [field]: value }));
    } catch {}
    finally { setSaving(false); }
  };

  const connectStrava = async () => {
    try {
      const { data } = await api.get('/api/strava/login-url');
      if (data.ok && data.url) window.open(data.url, '_blank');
    } catch { alert('Strava konnte nicht geoeffnet werden.'); }
  };

  const refreshStrava = async () => {
    const { data } = await api.get('/api/strava/status');
    setStrava(data);
  };

  if (view === 'profile') return <ProfileView profile={profile} saveProfile={saveProfile} saving={saving} back={() => setView('main')} />;
  if (view === 'changelog') return <ChangelogView back={() => setView('main')} />;

  return (
    <div className="animate-in" data-testid="settings-page">
      <h2 className="screen-title">Einstellungen</h2>
      <p className="screen-sub">Profil, Verbindungen und App-Info</p>

      <div className="version-banner" data-testid="version-banner">
        <div className="version-num">1.2.0</div>
        <div className="version-label">Athlete OS</div>
      </div>

      <div className="settings-section">
        <div className="settings-label">Konto</div>
        <div className="settings-card">
          <div className="settings-row" onClick={() => setView('profile')} data-testid="settings-profile">
            <div className="settings-row-left"><User size={18} /><div><div className="settings-row-label">Profil</div><div className="settings-row-sub">{user?.name || user?.email}</div></div></div>
            <div className="settings-row-right"><ChevronRight size={16} /></div>
          </div>
        </div>
      </div>

      <div className="settings-section">
        <div className="settings-label">Integrationen</div>
        <div className="integration-card" data-testid="strava-integration">
          <div className="int-left">
            <Link2 size={18} />
            <div>
              <div className="int-name">Strava</div>
              <div className={`int-status ${strava.connected ? 'on' : 'off'}`}>
                {strava.connected ? `Verbunden${strava.athlete ? ` · ${strava.athlete.firstname}` : ''}` : 'Nicht verbunden'}
              </div>
            </div>
          </div>
          {strava.connected ? (
            <button className="int-btn refresh" onClick={refreshStrava} data-testid="strava-refresh-btn">
              <RefreshCw size={12} style={{ marginRight: 4 }} /> Sync
            </button>
          ) : (
            <button className="int-btn connect" onClick={connectStrava} data-testid="strava-connect-btn">Verbinden</button>
          )}
        </div>

        <div className="integration-card" data-testid="garmin-integration">
          <div className="int-left">
            <Watch size={18} />
            <div>
              <div className="int-name">Garmin</div>
              <div className={`int-status ${garmin.connected ? 'on' : 'off'}`}>
                {garmin.connected ? 'Verbunden' : 'Nicht verbunden'}
              </div>
            </div>
          </div>
          <button className="int-btn connect" style={{ opacity: 0.5 }} disabled data-testid="garmin-connect-btn">Bald verfuegbar</button>
        </div>
      </div>

      <div className="settings-section">
        <div className="settings-label">App</div>
        <div className="settings-card">
          <div className="settings-row" onClick={() => setView('changelog')} data-testid="settings-changelog">
            <div className="settings-row-left"><FileText size={18} /><div><div className="settings-row-label">Changelog</div><div className="settings-row-sub">Release Notes & Updates</div></div></div>
            <div className="settings-row-right">v1.2.0 <ChevronRight size={16} /></div>
          </div>
          <div className="settings-row" data-testid="settings-coach-info">
            <div className="settings-row-left"><MessageCircle size={18} /><div><div className="settings-row-label">AI-Coach</div><div className="settings-row-sub">Vincent · Gemini 2.5</div></div></div>
            <div className="settings-row-right">Aktiv</div>
          </div>
          <div className="settings-row" data-testid="settings-privacy">
            <div className="settings-row-left"><Shield size={18} /><div><div className="settings-row-label">Datenschutz</div><div className="settings-row-sub">Daten lokal & verschluesselt</div></div></div>
            <div className="settings-row-right"><ChevronRight size={16} /></div>
          </div>
        </div>
      </div>

      <button
        className="cal-btn secondary" style={{ width: '100%', marginTop: 8, color: 'var(--danger)' }}
        onClick={logout} data-testid="logout-btn"
      >
        <LogOut size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} /> Abmelden
      </button>
    </div>
  );
}

function ProfileView({ profile, saveProfile, saving, back }) {
  return (
    <div className="animate-in" data-testid="profile-view">
      <button className="cal-btn secondary" onClick={back} style={{ marginBottom: 16, padding: '8px 14px', fontSize: 12 }} data-testid="back-btn">Zurueck</button>
      <h2 className="screen-title">Profil</h2>
      <p className="screen-sub">Deine Trainingseinstellungen</p>

      <div className="form-group">
        <label className="form-label">Sportart</label>
        <select className="form-select" value={profile.sport} onChange={e => saveProfile('sport', e.target.value)} data-testid="sport-select">
          <option value="Run">Laufen</option>
          <option value="Ride">Radfahren</option>
          <option value="Ski">Ski Skating</option>
          <option value="Mixed">Mixed Sports</option>
        </select>
      </div>
      <div className="form-group">
        <label className="form-label">Ziel</label>
        <select className="form-select" value={profile.goal} onChange={e => saveProfile('goal', e.target.value)} data-testid="goal-select">
          <option value="Halbmarathon">Halbmarathon</option>
          <option value="Marathon">Marathon</option>
          <option value="10 km">10 km</option>
          <option value="5 km">5 km</option>
          <option value="Radrennen">Radrennen</option>
          <option value="Gran Fondo">Gran Fondo</option>
        </select>
      </div>
      <div className="form-group">
        <label className="form-label">Trainingstage pro Woche</label>
        <input className="form-input" type="number" min="2" max="7" value={profile.days} onChange={e => saveProfile('days', parseInt(e.target.value) || 5)} data-testid="days-input" />
      </div>
      <div className="form-group">
        <label className="form-label">Wettkampfdatum</label>
        <input className="form-input" type="date" value={profile.goalDate || ''} onChange={e => saveProfile('goalDate', e.target.value)} data-testid="goal-date" />
      </div>
    </div>
  );
}

function ChangelogView({ back }) {
  return (
    <div className="animate-in" data-testid="changelog-view">
      <button className="cal-btn secondary" onClick={back} style={{ marginBottom: 16, padding: '8px 14px', fontSize: 12 }} data-testid="back-btn">Zurueck</button>
      <h2 className="screen-title">Changelog</h2>
      <p className="screen-sub">Release Notes & Updates</p>

      {CHANGELOG.map(entry => (
        <div key={entry.version} className="changelog-item" data-testid={`changelog-${entry.version}`}>
          <div className="changelog-header">
            <span className="changelog-version">v{entry.version}</span>
            <span className="changelog-date">{entry.date}</span>
          </div>
          <div className="changelog-title">{entry.title}</div>
          <ul className="changelog-list">
            {entry.changes.map((c, i) => <li key={i}>{c}</li>)}
          </ul>
        </div>
      ))}
    </div>
  );
}
