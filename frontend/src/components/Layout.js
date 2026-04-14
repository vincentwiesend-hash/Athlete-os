import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Activity, BarChart3, Calendar, MessageCircle, Settings, Zap } from 'lucide-react';
import api from '../utils/api';

const NAV = [
  { path: '/', icon: Activity, label: 'Heute' },
  { path: '/activities', icon: Zap, label: 'Training' },
  { path: '/coach', icon: MessageCircle, label: 'Coach' },
  { path: '/calendar', icon: Calendar, label: 'Woche' },
  { path: '/stats', icon: BarChart3, label: 'Stats' },
  { path: '/settings', icon: Settings, label: 'Setup' },
];

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [stravaStatus, setStravaStatus] = React.useState(null);

  React.useEffect(() => {
    api.get('/api/strava/status').then(r => setStravaStatus(r.data)).catch(() => {});
  }, []);

  const now = new Date();
  const dateStr = now.toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="app-shell" data-testid="app-shell">
      <header className="app-header">
        <div className="header-row">
          <div>
            <div className="header-title" data-testid="header-title">Athlete OS</div>
            <div className="header-date">{dateStr}</div>
          </div>
          <div className={`status-pill ${stravaStatus?.connected ? 'connected' : 'demo'}`} data-testid="connection-status">
            <span className="status-dot" />
            <span>{stravaStatus?.connected ? 'Strava' : 'Demo'}</span>
          </div>
        </div>
      </header>

      <div className="content-area">
        <Outlet />
      </div>

      <nav className="bottom-nav" data-testid="bottom-nav">
        {NAV.map(n => {
          const active = location.pathname === n.path || (n.path !== '/' && location.pathname.startsWith(n.path));
          const isHome = n.path === '/' && location.pathname === '/';
          return (
            <button
              key={n.path}
              className={`nav-btn ${active || isHome ? 'active' : ''}`}
              onClick={() => navigate(n.path)}
              data-testid={`nav-${n.label.toLowerCase()}`}
            >
              <n.icon />
              <span>{n.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
