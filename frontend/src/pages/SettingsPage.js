import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  User, Link2, MessageCircle, Shield, ChevronRight, RefreshCw,
  Watch, LogOut, FileText, Calculator, Dumbbell, ChevronLeft
} from 'lucide-react';
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
      'Erweiterte Personalisierung mit Wettkampfzeiten',
      'Wissenschaftliche Formeln fuer Recovery & Strain',
      'Morgenreport mit KI-Analyse aller Garmin-Daten',
      'Farbige Metrik-Kacheln mit Vergleich zu gestern'
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

const FORMULAS = [
  {
    name: 'Recovery Score',
    formula: '0.40 × HRV_norm + 0.25 × Schlaf + 0.20 × RHR_inv + 0.15 × Stress_inv',
    sources: ['Plews et al., MSSE 2013', 'Buchheit, Sports Med 2014'],
    desc: 'HRV wird ueber ln(RMSSD) normalisiert. RHR und Stress invertiert (niedriger = besser). Schlaf-Score direkt von Garmin.'
  },
  {
    name: 'Strain Score',
    formula: '0.60 × TRIMP_norm + 0.25 × Stress + 0.15 × HR_delta',
    sources: ['Edwards, 1993', 'Impellizzeri et al., J Sports Sci 2004'],
    desc: 'TRIMP basiert auf Edwards-Methode (Zeit × Zonen-Koeffizienten). HR_delta = Tagespuls relativ zu Ruhepuls.'
  },
  {
    name: 'Trainingsbereitschaft',
    formula: '0.35 × Recovery + 0.25 × BodyBattery + 0.25 × Schlaf + 0.15 × Stress_inv',
    sources: ['Halson, Sports Med 2014', 'Saw et al., Sports Med 2016'],
    desc: 'Composite aus berechnetem Recovery-Score, Garmin Body Battery, Schlafqualitaet und inversem Stress.'
  },
  {
    name: 'VO2max Schaetzung (VDOT)',
    formula: 'Jack Daniels VDOT Tabelle basierend auf Wettkampfzeiten',
    sources: ['Daniels, Running Formula, 3rd Ed. 2014'],
    desc: 'Deine Wettkampfzeiten (5k/10k/HM/Marathon) werden in VDOT-Werte umgerechnet. Daraus ergibt sich die geschaetzte VO2max.'
  }
];

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const [view, setView] = useState('main');
  const [profile, setProfile] = useState({
    sport: 'Run', goal: 'Halbmarathon', days: 5, goalDate: '2026-09-21',
    name: '', age: '', weight: '', height: '', gender: 'M',
    time5k: '', time10k: '', timeHalf: '', timeMarathon: '', maxHr: '', restHr: ''
  });
  const [strava, setStrava] = useState({ connected: false, athlete: null });
  const [garmin, setGarmin] = useState({ connected: false });

  useEffect(() => {
    api.get('/api/profile').then(r => setProfile(p => ({ ...p, ...r.data }))).catch(() => {});
    api.get('/api/strava/status').then(r => setStrava(r.data)).catch(() => {});
    api.get('/api/garmin/status').then(r => setGarmin(r.data)).catch(() => {});
  }, []);

  const save = async (field, value) => {
    await api.put('/api/profile', { [field]: value }).catch(() => {});
    setProfile(p => ({ ...p, [field]: value }));
  };

  const connectStrava = async () => {
    try {
      const { data } = await api.get('/api/strava/login-url');
      if (data.ok && data.url) window.open(data.url, '_blank');
    } catch {}
  };

  const [garminLogin, setGarminLogin] = useState({ email: '', password: '', show: false, loading: false, error: '' });

  const connectGarmin = async () => {
    if (!garminLogin.show) { setGarminLogin(g => ({ ...g, show: true })); return; }
    setGarminLogin(g => ({ ...g, loading: true, error: '' }));
    try {
      const { data } = await api.post('/api/garmin/connect', { email: garminLogin.email, password: garminLogin.password });
      if (data.ok) { setGarmin({ connected: true, athlete: data.athlete }); setGarminLogin({ email: '', password: '', show: false, loading: false, error: '' }); }
    } catch (e) {
      setGarminLogin(g => ({ ...g, loading: false, error: e.response?.data?.detail || 'Verbindung fehlgeschlagen' }));
    }
  };

  const disconnectGarmin = async () => {
    await api.post('/api/garmin/disconnect').catch(() => {});
    setGarmin({ connected: false, athlete: null });
  };

  if (view === 'profile') return <ProfileView profile={profile} save={save} back={() => setView('main')} user={user} />;
  if (view === 'athletic') return <AthleticView profile={profile} save={save} back={() => setView('main')} />;
  if (view === 'changelog') return <ChangelogView back={() => setView('main')} />;
  if (view === 'formulas') return <FormulasView back={() => setView('main')} />;

  return (
    <div className="animate-in" data-testid="settings-page">
      <h2 className="screen-title">Einstellungen</h2>
      <p className="screen-sub">Profil, Verbindungen und App-Info</p>

      <div className="version-banner" data-testid="version-banner">
        <div className="version-num">1.2.0</div>
        <div className="version-label">Athlete OS</div>
      </div>

      {/* KONTO */}
      <Section label="Konto">
        <SettingsCard>
          <Row icon={User} label="Profil" sub={profile.name || user?.name || user?.email} onClick={() => setView('profile')} arrow />
          <Row icon={Dumbbell} label="Athletik-Profil" sub={profile.time10k ? `10k: ${profile.time10k}` : 'Zeiten & Koerperdaten'} onClick={() => setView('athletic')} arrow />
        </SettingsCard>
      </Section>

      {/* INTEGRATIONEN */}
      <Section label="Integrationen">
        <IntCard icon={Link2} name="Strava"
          status={strava.connected ? `Verbunden${strava.athlete ? ` · ${strava.athlete.firstname}` : ''}` : 'Nicht verbunden'}
          connected={strava.connected}
          onAction={strava.connected ? () => api.get('/api/strava/status').then(r => setStrava(r.data)) : connectStrava}
          actionLabel={strava.connected ? 'Sync' : 'Verbinden'}
        />
        <IntCard icon={Watch} name="Garmin"
          status={garmin.connected ? `Verbunden${garmin.athlete ? ` · ${garmin.athlete.name}` : ''}` : 'Nicht verbunden'}
          connected={garmin.connected}
          onAction={garmin.connected ? disconnectGarmin : connectGarmin}
          actionLabel={garmin.connected ? 'Trennen' : (garminLogin.show ? 'Anmelden' : 'Verbinden')}
        />
        {garminLogin.show && !garmin.connected && (
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 14, padding: 14, marginBottom: 10, marginTop: -6 }}>
            {garminLogin.error && <div style={{ background: 'rgba(239,68,68,.08)', border: '1px solid rgba(239,68,68,.15)', borderRadius: 8, padding: '8px 12px', fontSize: 12, color: '#ef4444', marginBottom: 10 }}>{garminLogin.error}</div>}
            <input className="form-input" placeholder="Garmin E-Mail" value={garminLogin.email}
              onChange={e => setGarminLogin(g => ({ ...g, email: e.target.value }))} style={{ marginBottom: 8, fontSize: 13 }} data-testid="garmin-email" />
            <input className="form-input" type="password" placeholder="Garmin Passwort" value={garminLogin.password}
              onChange={e => setGarminLogin(g => ({ ...g, password: e.target.value }))}
              onKeyDown={e => e.key === 'Enter' && connectGarmin()} style={{ marginBottom: 10, fontSize: 13 }} data-testid="garmin-password" />
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={connectGarmin} disabled={garminLogin.loading || !garminLogin.email || !garminLogin.password}
                style={{ flex: 1, padding: 10, borderRadius: 10, background: '#6c63ff', color: 'white', border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: garminLogin.loading ? .5 : 1 }} data-testid="garmin-submit">
                {garminLogin.loading ? 'Verbinde...' : 'Garmin verbinden'}
              </button>
              <button onClick={() => setGarminLogin({ email: '', password: '', show: false, loading: false, error: '' })}
                style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(255,255,255,.04)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', fontSize: 13, cursor: 'pointer' }}>Abbrechen</button>
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-tertiary)', marginTop: 8 }}>Deine Garmin Connect Zugangsdaten. Werden verschluesselt gespeichert.</div>
          </div>
        )}
      </Section>

      {/* APP */}
      <Section label="App">
        <SettingsCard>
          <Row icon={FileText} label="Changelog" sub="Release Notes" right="v1.2.0" onClick={() => setView('changelog')} arrow />
          <Row icon={Calculator} label="Formeln" sub="Wissenschaftliche Grundlagen" onClick={() => setView('formulas')} arrow />
          <Row icon={MessageCircle} label="AI-Coach" sub="Vincent · Gemini 2.5 Flash" right="Aktiv" />
          <Row icon={Shield} label="Datenschutz" sub="Daten lokal & verschluesselt" arrow />
        </SettingsCard>
      </Section>

      <button
        style={{
          width: '100%', padding: 14, borderRadius: 12, fontSize: 14, fontWeight: 600,
          background: 'rgba(239,68,68,.06)', border: '1px solid rgba(239,68,68,.15)',
          color: '#ef4444', cursor: 'pointer', marginTop: 8
        }}
        onClick={logout} data-testid="logout-btn"
      >
        <LogOut size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} /> Abmelden
      </button>
    </div>
  );
}

/* === Sub-Components === */
function Section({ label, children }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ fontSize: 11, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 10 }}>{label}</div>
      {children}
    </div>
  );
}

function SettingsCard({ children }) {
  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 14, overflow: 'hidden' }}>
      {children}
    </div>
  );
}

function Row({ icon: Icon, label, sub, right, onClick, arrow }) {
  return (
    <div
      style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '14px 16px', borderBottom: '1px solid var(--border-color)',
        cursor: onClick ? 'pointer' : 'default', transition: 'background .2s'
      }}
      onClick={onClick}
      data-testid={`settings-row-${label.toLowerCase().replace(/[^a-z]/g, '')}`}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <Icon size={18} style={{ color: 'var(--text-secondary)' }} />
        <div>
          <div style={{ fontSize: 14 }}>{label}</div>
          {sub && <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>{sub}</div>}
        </div>
      </div>
      <div style={{ fontSize: 13, color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: 4 }}>
        {right} {arrow && <ChevronRight size={16} />}
      </div>
    </div>
  );
}

function IntCard({ icon: Icon, name, status, connected, onAction, actionLabel, disabled }) {
  const btnStyle = connected
    ? { background: 'rgba(0,212,255,.08)', color: '#00d4ff', border: '1px solid rgba(0,212,255,.15)' }
    : { background: '#6c63ff', color: 'white', border: 'none' };
  return (
    <div style={{
      background: 'var(--bg-card)', border: '1px solid var(--border-color)',
      borderRadius: 14, padding: '14px 16px', marginBottom: 10,
      display: 'flex', justifyContent: 'space-between', alignItems: 'center'
    }} data-testid={`int-${name.toLowerCase()}`}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <Icon size={18} style={{ color: 'var(--text-secondary)' }} />
        <div>
          <div style={{ fontSize: 14, fontWeight: 500 }}>{name}</div>
          <div style={{ fontSize: 11, marginTop: 2, color: connected ? '#10b981' : 'var(--text-tertiary)' }}>{status}</div>
        </div>
      </div>
      <button
        style={{ padding: '8px 14px', borderRadius: 10, fontSize: 12, fontWeight: 600, cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? .5 : 1, ...btnStyle }}
        onClick={disabled ? undefined : onAction}
        disabled={disabled}
      >
        {connected && <RefreshCw size={11} style={{ marginRight: 4, verticalAlign: 'middle' }} />}
        {actionLabel}
      </button>
    </div>
  );
}

function BackBtn({ onClick }) {
  return (
    <button onClick={onClick} style={{
      display: 'inline-flex', alignItems: 'center', gap: 4, background: 'none', border: '1px solid var(--border-color)',
      borderRadius: 10, padding: '8px 14px', color: 'var(--text-primary)', fontSize: 12, cursor: 'pointer', marginBottom: 16
    }} data-testid="back-btn"><ChevronLeft size={14} /> Zurueck</button>
  );
}

function Input({ label, value, onChange, type, placeholder, sub }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ fontSize: 12, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '.04em', display: 'block', marginBottom: 6 }}>{label}</label>
      <input
        className="form-input"
        type={type || 'text'} value={value || ''} onChange={onChange} placeholder={placeholder}
        data-testid={`input-${label.toLowerCase().replace(/[^a-z0-9]/g, '')}`}
      />
      {sub && <div style={{ fontSize: 10, color: 'var(--text-tertiary)', marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

/* === Profile View === */
function ProfileView({ profile, save, back, user }) {
  return (
    <div className="animate-in" data-testid="profile-view">
      <BackBtn onClick={back} />
      <h2 className="screen-title">Profil</h2>
      <p className="screen-sub">Persoenliche Einstellungen</p>

      <Input label="Name" value={profile.name || user?.name} onChange={e => save('name', e.target.value)} placeholder="Dein Name" />
      <Input label="Alter" value={profile.age} onChange={e => save('age', e.target.value)} type="number" placeholder="z.B. 32" />

      <div style={{ marginBottom: 16 }}>
        <label className="form-label">Geschlecht</label>
        <select className="form-select" value={profile.gender || 'M'} onChange={e => save('gender', e.target.value)} data-testid="gender-select">
          <option value="M">Maennlich</option>
          <option value="F">Weiblich</option>
        </select>
      </div>

      <div style={{ marginBottom: 16 }}>
        <label className="form-label">Sportart</label>
        <select className="form-select" value={profile.sport} onChange={e => save('sport', e.target.value)} data-testid="sport-select">
          <option value="Run">Laufen</option><option value="Ride">Radfahren</option>
          <option value="Ski">Ski Skating</option><option value="Mixed">Mixed Sports</option>
        </select>
      </div>

      <div style={{ marginBottom: 16 }}>
        <label className="form-label">Ziel</label>
        <select className="form-select" value={profile.goal} onChange={e => save('goal', e.target.value)} data-testid="goal-select">
          <option value="Halbmarathon">Halbmarathon</option><option value="Marathon">Marathon</option>
          <option value="10 km">10 km</option><option value="5 km">5 km</option>
          <option value="Radrennen">Radrennen</option><option value="Gran Fondo">Gran Fondo</option>
        </select>
      </div>

      <Input label="Trainingstage / Woche" value={profile.days} onChange={e => save('days', parseInt(e.target.value) || 5)} type="number" placeholder="5" />
      <Input label="Wettkampfdatum" value={profile.goalDate} onChange={e => save('goalDate', e.target.value)} type="date" />
    </div>
  );
}

/* === Athletic Profile View === */
function AthleticView({ profile, save, back }) {
  return (
    <div className="animate-in" data-testid="athletic-view">
      <BackBtn onClick={back} />
      <h2 className="screen-title">Athletik-Profil</h2>
      <p className="screen-sub">Koerperdaten und Bestzeiten fuer praezisere Berechnung</p>

      <div style={{
        background: 'rgba(108,99,255,.04)', border: '1px solid rgba(108,99,255,.12)',
        borderRadius: 14, padding: 14, marginBottom: 20, fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6
      }}>
        <strong style={{ color: 'var(--text-primary)' }}>Warum?</strong> Deine Wettkampfzeiten werden ueber die Jack Daniels VDOT-Tabelle in eine geschaetzte VO2max umgerechnet. Koerperdaten verbessern die Kalorien- und Belastungsberechnung.
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Input label="Gewicht (kg)" value={profile.weight} onChange={e => save('weight', e.target.value)} type="number" placeholder="75" />
        <Input label="Groesse (cm)" value={profile.height} onChange={e => save('height', e.target.value)} type="number" placeholder="180" />
        <Input label="Max. HF" value={profile.maxHr} onChange={e => save('maxHr', e.target.value)} type="number" placeholder="190" sub="Maximale Herzfrequenz" />
        <Input label="Ruhe-HF" value={profile.restHr} onChange={e => save('restHr', e.target.value)} type="number" placeholder="48" sub="Ruheherzfrequenz" />
      </div>

      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', margin: '20px 0 12px', textTransform: 'uppercase', letterSpacing: '.04em' }}>
        Bestzeiten
      </div>
      <div style={{
        background: 'rgba(16,185,129,.04)', border: '1px solid rgba(16,185,129,.12)',
        borderRadius: 14, padding: 14, marginBottom: 16, fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.5
      }}>
        Format: mm:ss (z.B. 22:30 fuer 5k) oder h:mm:ss (z.B. 1:45:00 fuer HM). Diese Zeiten bestimmen dein Leistungsniveau nach der VDOT-Methode.
      </div>

      <Input label="5 km Bestzeit" value={profile.time5k} onChange={e => save('time5k', e.target.value)} placeholder="z.B. 22:30" sub="VDOT-Berechnung" />
      <Input label="10 km Bestzeit" value={profile.time10k} onChange={e => save('time10k', e.target.value)} placeholder="z.B. 47:00" sub="VDOT-Berechnung" />
      <Input label="Halbmarathon Bestzeit" value={profile.timeHalf} onChange={e => save('timeHalf', e.target.value)} placeholder="z.B. 1:45:00" sub="VDOT-Berechnung" />
      <Input label="Marathon Bestzeit" value={profile.timeMarathon} onChange={e => save('timeMarathon', e.target.value)} placeholder="z.B. 3:50:00" sub="VDOT-Berechnung" />
    </div>
  );
}

/* === Changelog View === */
function ChangelogView({ back }) {
  return (
    <div className="animate-in" data-testid="changelog-view">
      <BackBtn onClick={back} />
      <h2 className="screen-title">Changelog</h2>
      <p className="screen-sub">Release Notes & Updates</p>
      {CHANGELOG.map(entry => (
        <div key={entry.version} className="changelog-item" data-testid={`changelog-${entry.version}`}>
          <div className="changelog-header">
            <span className="changelog-version">v{entry.version}</span>
            <span className="changelog-date">{entry.date}</span>
          </div>
          <div className="changelog-title">{entry.title}</div>
          <ul className="changelog-list">{entry.changes.map((c, i) => <li key={i}>{c}</li>)}</ul>
        </div>
      ))}
    </div>
  );
}

/* === Formulas View === */
function FormulasView({ back }) {
  return (
    <div className="animate-in" data-testid="formulas-view">
      <BackBtn onClick={back} />
      <h2 className="screen-title">Formeln</h2>
      <p className="screen-sub">Wissenschaftliche Grundlagen der Berechnungen</p>

      <div style={{
        background: 'rgba(245,158,11,.04)', border: '1px solid rgba(245,158,11,.12)',
        borderRadius: 14, padding: 14, marginBottom: 20, fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6
      }}>
        <strong style={{ color: '#f59e0b' }}>Hinweis:</strong> Rohdaten wie HRV, Ruhepuls, Schlaf-Score, Schritte, VO2max, SpO2, Body Battery und Stress kommen direkt von deinem Garmin/Strava-Geraet. Nur die folgenden Composite-Werte werden von uns berechnet.
      </div>

      {FORMULAS.map((f, i) => (
        <div key={i} style={{
          background: 'var(--bg-card)', border: '1px solid var(--border-color)',
          borderRadius: 14, padding: '14px 16px', marginBottom: 12
        }} data-testid={`formula-${i}`}>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#6c63ff', marginBottom: 8 }}>{f.name}</div>
          <div style={{
            background: 'rgba(108,99,255,.06)', borderRadius: 8, padding: '10px 12px',
            fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: '#a78bfa',
            marginBottom: 10, lineHeight: 1.5, overflowX: 'auto'
          }}>
            {f.formula}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 8 }}>{f.desc}</div>
          <div style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>
            Quellen: {f.sources.join(' · ')}
          </div>
        </div>
      ))}
    </div>
  );
}
