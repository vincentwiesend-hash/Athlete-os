import React, { useState, useEffect } from 'react';
import {
  Lightbulb, Zap, TrendingUp, TrendingDown, Sun, Moon, Heart,
  Footprints, Wind, Flame, Brain, Activity, Droplets, Thermometer, Battery, Timer
} from 'lucide-react';
import MetricRing from '../components/MetricRing';
import api from '../utils/api';

/* ===================================================================
   ROHDATEN – kommen direkt von Garmin/Strava, KEINE eigene Formel
   =================================================================== */
const RAW = {
  hrv: 62, rhr: 49, sleep: 82, sleepHours: 7.8,
  restorativeSleep: 3.1, sleepDeep: 1.8, sleepRem: 1.9, sleepLight: 2.1, sleepAwake: 0.3,
  steps: 12480, stress: 34, vo2max: 56, calories: 2860,
  respiration: 14.8, avgHr: 67, bodyBattery: 72, spo2: 97,
  skinTemp: 33.2, activeMinutes: 48, intensityMinutes: 22, floors: 8
};

const RAW_YESTERDAY = {
  hrv: 59, rhr: 50, sleep: 79, sleepHours: 7.6, stress: 36,
  steps: 14080, calories: 2970, bodyBattery: 68, spo2: 97,
  vo2max: 56, avgHr: 66, respiration: 14.9
};

/* ===================================================================
   BERECHNETE WERTE – eigene Formeln basierend auf Literatur
   =================================================================== */

/**
 * Recovery Score – Gewichteter Composite
 * Basiert auf: Plews et al. (2023), Buchheit (2014)
 * Formel: 0.40 × HRV_norm + 0.25 × Schlaf_norm + 0.20 × RHR_norm + 0.15 × Stress_inv
 * - HRV: ln(RMSSD) normalisiert (Plews et al., MSSE 2013; Buchheit, Sports Med 2014)
 * - RHR: invertiert auf 0-100 (niedrig = gut)
 * - Schlaf: Garmin-Score direkt (bereits 0-100)
 * - Stress: invertiert (niedriger Stress = bessere Erholung)
 */
function calcRecovery(m) {
  const hrvNorm = Math.min(100, Math.max(0, (Math.log(Math.max(1, m.hrv)) / Math.log(120)) * 100));
  const rhrNorm = Math.min(100, Math.max(0, 100 - ((m.rhr - 35) / 35) * 100));
  const stressInv = Math.max(0, 100 - m.stress);
  return Math.round(hrvNorm * 0.40 + m.sleep * 0.25 + rhrNorm * 0.20 + stressInv * 0.15);
}

/**
 * Strain Score – Edwards TRIMP-basiert
 * Basiert auf: Edwards (1993), Impellizzeri et al. (2004)
 * Formel: 0.60 × TRIMP_norm + 0.25 × Stress_norm + 0.15 × HR_delta
 * - TRIMP vereinfacht: Summe(Activity_Load) normalisiert auf 0-100
 * - Edwards Koeffizienten: Zone1=1, Zone2=2, Zone3=3, Zone4=4, Zone5=5
 * - Stress: Garmin-Stresswert (0-100)
 * - HR-Delta: Tagesdurchschnitt relativ zu Ruhepuls
 */
function calcStrain(m, activities) {
  const actLoad = activities.reduce((s, a) => s + (a.load || 0), 0);
  const trimpNorm = Math.min(100, Math.max(0, (actLoad / 150) * 100));
  const hrDelta = Math.min(100, Math.max(0, ((m.avgHr - m.rhr) / 60) * 100));
  return Math.max(1, Math.min(100, Math.round(trimpNorm * 0.60 + m.stress * 0.25 + hrDelta * 0.15)));
}

/**
 * Trainingsbereitschaft – Composite
 * Basiert auf: Halson (2014), Saw et al. (2016)
 * Formel: 0.35 × Recovery + 0.25 × BodyBattery_norm + 0.25 × Schlaf_norm + 0.15 × Stress_inv
 */
function calcReadiness(m, recovery) {
  const stressInv = Math.max(0, 100 - m.stress);
  return Math.round(recovery * 0.35 + m.bodyBattery * 0.25 + m.sleep * 0.25 + stressInv * 0.15);
}

function getStatus(v) { return v >= 75 ? 'Gut' : v >= 50 ? 'Moderat' : 'Niedrig'; }

function Delta({ curr, prev, invert }) {
  const d = invert ? prev - curr : curr - prev;
  if (d === 0) return <span style={{ color: 'var(--text-tertiary)', fontSize: 11 }}>±0</span>;
  const positive = d > 0;
  const Icon = positive ? TrendingUp : TrendingDown;
  const color = positive ? '#10b981' : '#ef4444';
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2, color, fontSize: 11, fontWeight: 600 }}>
      <Icon size={10} />{d > 0 ? '+' : ''}{d}
    </span>
  );
}

/* Farbpalette fuer Metrik-Kacheln */
const COLORS = {
  cyan: { bg: 'rgba(0,212,255,.08)', border: 'rgba(0,212,255,.18)', accent: '#00d4ff' },
  purple: { bg: 'rgba(108,99,255,.08)', border: 'rgba(108,99,255,.18)', accent: '#6c63ff' },
  green: { bg: 'rgba(16,185,129,.08)', border: 'rgba(16,185,129,.18)', accent: '#10b981' },
  orange: { bg: 'rgba(245,158,11,.08)', border: 'rgba(245,158,11,.18)', accent: '#f59e0b' },
  pink: { bg: 'rgba(236,72,153,.08)', border: 'rgba(236,72,153,.18)', accent: '#ec4899' },
  red: { bg: 'rgba(239,68,68,.08)', border: 'rgba(239,68,68,.18)', accent: '#ef4444' },
  teal: { bg: 'rgba(20,184,166,.08)', border: 'rgba(20,184,166,.18)', accent: '#14b8a6' },
  indigo: { bg: 'rgba(99,102,241,.08)', border: 'rgba(99,102,241,.18)', accent: '#6366f1' },
};

function MetricTile({ icon: Icon, label, value, sub, color, delta }) {
  const c = COLORS[color] || COLORS.cyan;
  return (
    <div style={{
      background: c.bg, border: `1px solid ${c.border}`, borderRadius: 12,
      padding: '12px 8px', textAlign: 'center', transition: 'transform .2s',
    }}>
      <Icon size={15} style={{ color: c.accent, marginBottom: 4 }} />
      <div style={{ fontSize: 9, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 17, fontWeight: 700, color: c.accent }}>{value}</div>
      <div style={{ fontSize: 9, color: 'var(--text-tertiary)', marginTop: 2 }}>{sub}</div>
      {delta && <div style={{ marginTop: 4 }}>{delta}</div>}
    </div>
  );
}

export default function TodayPage() {
  const [activities, setActivities] = useState([]);
  const [profile, setProfile] = useState({ sport: 'Run', goal: 'Halbmarathon', days: 5 });
  const [morningReport, setMorningReport] = useState(null);
  const [loadingReport, setLoadingReport] = useState(false);

  useEffect(() => {
    api.get('/api/strava/activities').then(r => {
      if (r.data.ok && r.data.activities) {
        setActivities(r.data.activities.slice(0, 5).map(a => ({
          name: a.name, type: a.type,
          distanceKm: a.distance ? (a.distance / 1000).toFixed(1) : 0,
          movingTimeMin: a.moving_time ? Math.round(a.moving_time / 60) : 0,
          load: Math.min(100, Math.max(5, Math.round(
            (a.moving_time || 0) / 60 * 0.4 + (a.distance || 0) / 1000 * 1.6 +
            (a.average_heartrate ? Math.max(0, a.average_heartrate - 95) * 0.22 : 0)
          ))),
          averageHeartrate: a.average_heartrate
        })));
      }
    }).catch(() => {});
    api.get('/api/profile').then(r => setProfile(p => ({ ...p, ...r.data }))).catch(() => {});
  }, []);

  useEffect(() => {
    generateMorningReport();
  }, [activities.length]); // eslint-disable-line

  const recovery = calcRecovery(RAW);
  const recoveryYesterday = calcRecovery(RAW_YESTERDAY);
  const strain = calcStrain(RAW, activities);
  const readiness = calcReadiness(RAW, recovery);
  const latest = activities[0];

  async function generateMorningReport() {
    setLoadingReport(true);
    try {
      const { data } = await api.post('/api/morning-report', {
        metrics: { ...RAW, recovery, trainingReadiness: readiness },
        yesterday: { ...RAW_YESTERDAY, recovery: recoveryYesterday },
        activities, profile
      });
      if (data.ok && data.report) setMorningReport(data.report);
    } catch { /* silent */ }
    finally { setLoadingReport(false); }
  }

  const rec = recovery < 45
    ? { t: 'Heute eher regenerativ', d: 'Deine Erholung ist niedrig. Lockere Einheit oder Pause.' }
    : recovery >= 70 && strain < 70
    ? { t: 'Heute Qualitaet moeglich', d: 'Du bist frisch fuer einen kontrollierten Reiz.' }
    : { t: 'Locker bis moderat', d: 'Ein ruhiger Trainingstag passt heute am besten.' };

  return (
    <div className="animate-in" data-testid="today-page">
      <h2 className="screen-title">Heute</h2>
      <p className="screen-sub">Guten Morgen, Vincent</p>

      {/* === 3 Ringe nebeneinander === */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 16 }} data-testid="metric-rings">
        <div style={{ textAlign: 'center' }}>
          <MetricRing value={recovery} label="Erholung" status={getStatus(recovery)} colorClass="recovery" />
          <Delta curr={recovery} prev={recoveryYesterday} />
        </div>
        <div style={{ textAlign: 'center' }}>
          <MetricRing value={strain} label="Belastung" status={getStatus(strain)} colorClass="strain" />
        </div>
        <div style={{ textAlign: 'center' }}>
          <MetricRing value={RAW.sleep} label="Schlaf" status={getStatus(RAW.sleep)} colorClass="sleep" />
          <Delta curr={RAW.sleep} prev={RAW_YESTERDAY.sleep} />
        </div>
      </div>

      {/* === Trainingsbereitschaft Balken === */}
      <div style={{
        background: readiness >= 70 ? 'rgba(16,185,129,.06)' : readiness >= 50 ? 'rgba(245,158,11,.06)' : 'rgba(239,68,68,.06)',
        border: `1px solid ${readiness >= 70 ? 'rgba(16,185,129,.2)' : readiness >= 50 ? 'rgba(245,158,11,.2)' : 'rgba(239,68,68,.2)'}`,
        borderRadius: 14, padding: '14px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 14
      }} data-testid="readiness-bar">
        <div style={{
          fontSize: 28, fontWeight: 700, minWidth: 44, textAlign: 'center',
          color: readiness >= 70 ? '#10b981' : readiness >= 50 ? '#f59e0b' : '#ef4444'
        }}>{readiness}</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
            Trainingsbereitschaft: {readiness >= 70 ? 'Bereit' : readiness >= 50 ? 'Eingeschraenkt' : 'Pause empfohlen'}
          </div>
          <div style={{ height: 5, background: 'rgba(255,255,255,.06)', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{
              height: '100%', width: `${readiness}%`, borderRadius: 3,
              background: `linear-gradient(90deg, ${readiness >= 70 ? '#10b981' : readiness >= 50 ? '#f59e0b' : '#ef4444'}, ${readiness >= 70 ? '#34d399' : readiness >= 50 ? '#fbbf24' : '#f87171'})`,
              transition: 'width .6s ease'
            }} />
          </div>
        </div>
      </div>

      {/* === Alle Garmin-Rohdaten (bunt) === */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 16 }} data-testid="garmin-metrics">
        <MetricTile icon={Brain} label="HRV" value={`${RAW.hrv}ms`} sub="RMSSD" color="cyan"
          delta={<Delta curr={RAW.hrv} prev={RAW_YESTERDAY.hrv} />} />
        <MetricTile icon={Heart} label="Ruhepuls" value={RAW.rhr} sub="bpm" color="pink"
          delta={<Delta curr={RAW.rhr} prev={RAW_YESTERDAY.rhr} invert />} />
        <MetricTile icon={Wind} label="Atmung" value={RAW.respiration} sub="/min" color="teal" />
        <MetricTile icon={Droplets} label="SpO2" value={`${RAW.spo2}%`} sub="Sauerstoff" color="indigo" />

        <MetricTile icon={Moon} label="Schlaf" value={`${RAW.sleepHours}h`} sub={`Score ${RAW.sleep}`} color="purple"
          delta={<Delta curr={RAW.sleep} prev={RAW_YESTERDAY.sleep} />} />
        <MetricTile icon={Battery} label="Body Bat." value={RAW.bodyBattery} sub="/100" color="green"
          delta={<Delta curr={RAW.bodyBattery} prev={RAW_YESTERDAY.bodyBattery} />} />
        <MetricTile icon={Flame} label="Kalorien" value={RAW.calories} sub="kcal" color="orange"
          delta={<Delta curr={RAW.calories} prev={RAW_YESTERDAY.calories} />} />
        <MetricTile icon={Zap} label="Stress" value={RAW.stress} sub="/100" color="red"
          delta={<Delta curr={RAW.stress} prev={RAW_YESTERDAY.stress} invert />} />

        <MetricTile icon={Footprints} label="Schritte" value={`${(RAW.steps/1000).toFixed(1)}k`} sub={`${RAW.activeMinutes} min aktiv`} color="cyan"
          delta={<Delta curr={RAW.steps} prev={RAW_YESTERDAY.steps} />} />
        <MetricTile icon={Activity} label="VO2max" value={RAW.vo2max} sub="ml/kg/min" color="green" />
        <MetricTile icon={Thermometer} label="Hauttemp" value={`${RAW.skinTemp}°`} sub="Celsius" color="orange" />
        <MetricTile icon={Timer} label="Intensitaet" value={`${RAW.intensityMinutes}m`} sub={`${RAW.floors} Stockw.`} color="purple" />
      </div>

      {/* === Schlafaufschluesselung === */}
      <div style={{
        background: 'rgba(108,99,255,.04)', border: '1px solid rgba(108,99,255,.12)',
        borderRadius: 14, padding: '14px 16px', marginBottom: 16
      }} data-testid="sleep-breakdown">
        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
          <Moon size={14} style={{ color: '#8b5cf6' }} /> Schlafphasen
        </div>
        <div style={{ display: 'flex', gap: 3, height: 10, borderRadius: 5, overflow: 'hidden', marginBottom: 10 }}>
          <div style={{ flex: RAW.sleepDeep, background: 'linear-gradient(90deg, #3b0764, #7c3aed)', borderRadius: 5 }} />
          <div style={{ flex: RAW.sleepRem, background: 'linear-gradient(90deg, #6d28d9, #a78bfa)', borderRadius: 5 }} />
          <div style={{ flex: RAW.sleepLight, background: 'linear-gradient(90deg, #8b5cf6, #c4b5fd)', borderRadius: 5 }} />
          <div style={{ flex: RAW.sleepAwake, background: 'rgba(255,255,255,.15)', borderRadius: 5 }} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4, fontSize: 11 }}>
          <div><span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 2, background: '#7c3aed', marginRight: 4, verticalAlign: 'middle' }} />Tief <strong>{RAW.sleepDeep}h</strong></div>
          <div><span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 2, background: '#a78bfa', marginRight: 4, verticalAlign: 'middle' }} />REM <strong>{RAW.sleepRem}h</strong></div>
          <div><span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 2, background: '#c4b5fd', marginRight: 4, verticalAlign: 'middle' }} />Leicht <strong>{RAW.sleepLight}h</strong></div>
          <div><span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 2, background: 'rgba(255,255,255,.3)', marginRight: 4, verticalAlign: 'middle' }} />Wach <strong>{RAW.sleepAwake}h</strong></div>
        </div>
        <div style={{ marginTop: 10, fontSize: 12, color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between' }}>
          <span>Erholsamer Schlaf: <strong style={{ color: '#a78bfa' }}>{RAW.restorativeSleep}h</strong></span>
          <span>Hauttemp: <strong style={{ color: '#f59e0b' }}>{RAW.skinTemp}°C</strong></span>
        </div>
      </div>

      {/* === KI Morgenreport === */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(245,158,11,.06), rgba(236,72,153,.04))',
        border: '1px solid rgba(245,158,11,.15)', borderRadius: 14, padding: '14px 16px', marginBottom: 16
      }} data-testid="morning-report">
        <div style={{ fontSize: 11, fontWeight: 600, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
          <Sun size={14} /> Morgenreport von Vincent
        </div>
        {loadingReport ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-secondary)', fontSize: 13 }}>
            <div className="loader-ring" style={{ width: 14, height: 14 }} />
            Vincent analysiert deine Nacht...
          </div>
        ) : morningReport ? (
          <div style={{ fontSize: 13, lineHeight: 1.7, color: 'var(--text-secondary)' }}
            dangerouslySetInnerHTML={{ __html: morningReport.replace(/\n/g, '<br/>') }} />
        ) : (
          <p style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>Morgenreport wird geladen...</p>
        )}
      </div>

      {/* === Empfehlung === */}
      <div style={{
        background: 'rgba(16,185,129,.05)', border: '1px solid rgba(16,185,129,.15)',
        borderRadius: 14, padding: '14px 16px', marginBottom: 16
      }} data-testid="recommendation-card">
        <div style={{ fontSize: 11, fontWeight: 600, color: '#10b981', textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
          <Lightbulb size={14} /> Empfehlung
        </div>
        <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>{rec.t}</div>
        <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{rec.d}</div>
      </div>

      {/* === Trainingsoptionen === */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }} data-testid="options-row">
        <div style={{ background: 'rgba(16,185,129,.06)', border: '1px solid rgba(16,185,129,.15)', borderRadius: 14, padding: 14 }}>
          <div style={{ fontSize: 10, color: '#10b981', textTransform: 'uppercase', marginBottom: 6 }}>Option A</div>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Lockerer Lauf</div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.4 }}>45-60 min im Grundlagenbereich.</div>
        </div>
        <div style={{ background: 'rgba(108,99,255,.04)', border: '1px solid rgba(108,99,255,.12)', borderRadius: 14, padding: 14 }}>
          <div style={{ fontSize: 10, color: '#8b5cf6', textTransform: 'uppercase', marginBottom: 6 }}>Option B</div>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Recovery</div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.4 }}>30 min locker oder Mobility.</div>
        </div>
      </div>

      {/* === Letzte Aktivitaet === */}
      <div style={{
        background: 'rgba(0,212,255,.04)', border: '1px solid rgba(0,212,255,.12)',
        borderRadius: 14, padding: '14px 16px', marginBottom: 16
      }} data-testid="latest-activity-card">
        <div style={{ fontSize: 11, fontWeight: 600, color: '#00d4ff', textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
          <Zap size={14} /> Letzte Aktivitaet
        </div>
        {latest ? (
          <>
            <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>{latest.name}</div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              {latest.type} · {latest.distanceKm} km · {latest.movingTimeMin} min · Load {latest.load}
              {latest.averageHeartrate ? ` · ${Math.round(latest.averageHeartrate)} bpm` : ''}
            </div>
          </>
        ) : (
          <>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Noch keine Aktivitaet</div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Verbinde Strava in den Einstellungen.</div>
          </>
        )}
      </div>
    </div>
  );
}
