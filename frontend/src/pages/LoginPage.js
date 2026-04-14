import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

export default function LoginPage() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        await register(email, password, name);
      }
    } catch (err) {
      const detail = err.response?.data?.detail;
      if (typeof detail === 'string') setError(detail);
      else if (Array.isArray(detail)) setError(detail.map(d => d.msg || JSON.stringify(d)).join(' '));
      else setError('Anmeldung fehlgeschlagen');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page" data-testid="login-page">
      <div className="auth-card animate-in">
        <h1 className="auth-title">Athlete OS</h1>
        <p className="auth-sub">{mode === 'login' ? 'Willkommen zurueck' : 'Erstelle dein Konto'}</p>

        {error && <div className="auth-error" data-testid="auth-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          {mode === 'register' && (
            <div className="form-group">
              <label className="form-label">Name</label>
              <input className="form-input" data-testid="register-name" value={name} onChange={e => setName(e.target.value)} placeholder="Dein Name" />
            </div>
          )}
          <div className="form-group">
            <label className="form-label">E-Mail</label>
            <input className="form-input" data-testid="auth-email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@beispiel.de" required />
          </div>
          <div className="form-group">
            <label className="form-label">Passwort</label>
            <input className="form-input" data-testid="auth-password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Mindestens 6 Zeichen" required />
          </div>
          <button className="auth-btn" data-testid="auth-submit" type="submit" disabled={loading}>
            {loading ? 'Laden...' : mode === 'login' ? 'Anmelden' : 'Registrieren'}
          </button>
        </form>

        <div className="auth-switch">
          {mode === 'login' ? (
            <>Noch kein Konto? <button data-testid="switch-to-register" onClick={() => { setMode('register'); setError(''); }}>Registrieren</button></>
          ) : (
            <>Bereits registriert? <button data-testid="switch-to-login" onClick={() => { setMode('login'); setError(''); }}>Anmelden</button></>
          )}
        </div>
      </div>
    </div>
  );
}
