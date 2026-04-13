const API_BASE = "http://localhost:3000";

const app = {
  currentScreen: 'today',
  dashboardRange: '7d',
  dashboardOpenMetric: null,
  dashboardMetric: 'HRV',

  userData: {
    sport: 'Run',
    goal: 'Halbmarathon',
    days: 5,
    goalDate: '2026-09-21'
  },

  metrics: {
    recovery: 78,
    sleep: 82,
    sleepHours: 7.8,
    restorativeSleep: 3.1,
    rhr: 49,
    hrv: 62,
    steps: 12480,
    stress: 34,
    vo2max: 56,
    calories: 2860,
    respiration: 14.8,
    avgHr: 67
  },

  stravaConnected: false,
  isConnecting: false,
  isRefreshing: false,
  activities: [],

  history: {
    hrv7d: [54, 56, 58, 55, 59, 61, 62],
    rhr7d: [53, 52, 51, 52, 50, 50, 49],
    vo2max7d: [55, 55, 55, 56, 56, 56, 56],
    steps7d: [10200, 11040, 9700, 12100, 13200, 14080, 12480],
    calories7d: [2500, 2620, 2400, 2760, 2880, 2970, 2860],
    respiration7d: [15.4, 15.1, 15.2, 15.0, 14.9, 14.8, 14.8],
    avgHr7d: [69, 68, 70, 68, 67, 66, 67],
    sleepHours7d: [7.1, 7.3, 7.5, 7.2, 7.6, 7.7, 7.8],
    sleepScore7d: [74, 78, 80, 76, 79, 81, 82],
    recovery7d: [63, 67, 70, 72, 69, 75, 78],
    activity7d: [28, 34, 52, 20, 41, 58, 43],
    stress7d: [42, 39, 48, 51, 44, 36, 34],

    hrv1m: [50,51,50,52,53,54,55,54,53,55,56,55,57,58,57,59,60,58,57,59,60,61,60,59,61,62,61,60,61,62],
    rhr1m: [55,55,54,54,54,53,53,54,53,52,52,53,52,51,51,52,51,50,50,51,50,49,50,49,49,50,49,49,49,49],
    vo2max1m: [54,54,54,54,54,54,55,55,55,55,55,55,55,55,56,56,56,56,56,56,56,56,56,56,56,56,56,56,56,56],
    steps1m: [9200,9800,10200,11000,8900,9600,10040,10400,11200,11800,9900,10200,10600,10900,11300,11500,11900,12100,12500,12800,11700,11000,10800,11400,12200,13000,13600,14100,13800,12480],
    calories1m: [2350,2400,2480,2510,2320,2380,2440,2500,2570,2620,2410,2460,2520,2590,2630,2670,2710,2760,2800,2850,2740,2680,2640,2700,2790,2860,2920,2980,2940,2860],

    hrv6m: [48,50,53,56,59,62],
    rhr6m: [56,55,54,52,50,49],
    vo2max6m: [52,53,54,55,55,56],
    steps6m: [8800,9300,9700,10800,11700,12480],
    calories6m: [2280,2360,2440,2580,2720,2860],

    hrv12m: [44,45,46,48,49,50,52,54,56,58,60,62],
    rhr12m: [58,58,57,56,56,55,54,53,52,51,50,49],
    vo2max12m: [50,50,51,51,52,52,53,54,54,55,55,56],
    steps12m: [7600,7800,8100,8500,8800,9200,9600,10100,10800,11400,12000,12480],
    calories12m: [2140,2180,2220,2260,2310,2360,2410,2480,2580,2680,2780,2860]
  }
};

document.addEventListener('DOMContentLoaded', async () => {
  setupNavigation();
  setupFormHandlers();
  updateDate();
  initializeForm();

  await initializeBackendData();

  renderToday();
  renderActivities();
  renderCalendar();
  renderDashboard();
  renderCoachProfile();
  updateActionButtons();
});

async function initializeBackendData() {
  await checkStravaStatus();
  if (app.stravaConnected) {
    await loadStravaActivities();
  }
}

function updateConnectionStatus(mode = null) {
  const statusEl = document.getElementById('connection-status');
  if (!statusEl) return;

  if (mode === 'connecting') {
    statusEl.innerHTML = `<span class="status-dot"></span><span>Strava verbindet...</span>`;
    return;
  }

  if (mode === 'refreshing') {
    statusEl.innerHTML = `<span class="status-dot"></span><span>Daten werden geladen...</span>`;
    return;
  }

  if (app.stravaConnected) {
    statusEl.innerHTML = `<span class="status-dot"></span><span>Strava verbunden</span>`;
  } else {
    statusEl.innerHTML = `<span class="status-dot"></span><span>Demo Modus</span>`;
  }
}

function updateActionButtons() {
  const primaryButtons = document.querySelectorAll('.primary-action-btn');
  const secondaryButtons = document.querySelectorAll('.secondary-action-btn');

  primaryButtons.forEach(btn => {
    btn.disabled = app.isConnecting || app.isRefreshing;
    btn.textContent = app.isConnecting
      ? 'Strava wird geöffnet...'
      : (app.stravaConnected ? 'Strava erneut öffnen' : 'Strava verbinden');
    btn.style.opacity = btn.disabled ? '0.7' : '1';
    btn.style.pointerEvents = btn.disabled ? 'none' : 'auto';
  });

  secondaryButtons.forEach(btn => {
    btn.disabled = app.isConnecting || app.isRefreshing;
    btn.textContent = app.isRefreshing ? 'Aktualisiere...' : 'Daten aktualisieren';
    btn.style.opacity = btn.disabled ? '0.7' : '1';
    btn.style.pointerEvents = btn.disabled ? 'none' : 'auto';
  });
}

async function connectStravaFromApp() {
  if (app.isConnecting || app.isRefreshing) return;

  app.isConnecting = true;
  updateConnectionStatus('connecting');
  updateActionButtons();

  try {
    const response = await fetch(`${API_BASE}/api/strava/login-url`);
    const data = await response.json();

    if (!data.ok || !data.url) {
      throw new Error('Strava-Login-URL konnte nicht geladen werden.');
    }

    window.open(data.url, "_blank");
    alert("Strava-Fenster geöffnet. Nach der Freigabe bitte zurückkommen und auf 'Daten aktualisieren' klicken.");
  } catch (error) {
    console.error(error);
    alert("Fehler beim Öffnen der Strava-Verbindung.");
  } finally {
    app.isConnecting = false;
    updateConnectionStatus();
    updateActionButtons();
  }
}

async function refreshStravaData() {
  if (app.isConnecting || app.isRefreshing) return;

  app.isRefreshing = true;
  updateConnectionStatus('refreshing');
  updateActionButtons();

  try {
    await checkStravaStatus();

    if (!app.stravaConnected) {
      alert("Strava ist noch nicht verbunden.");
      return;
    }

    await loadStravaActivities();
    renderToday();
    renderActivities();
    renderCoachProfile();
    renderDashboard();
    alert("Strava-Daten aktualisiert.");
  } catch (error) {
    console.error(error);
    alert("Fehler beim Aktualisieren der Strava-Daten.");
  } finally {
    app.isRefreshing = false;
    updateConnectionStatus();
    updateActionButtons();
  }
}

async function checkStravaStatus() {
  try {
    const response = await fetch(`${API_BASE}/api/strava/status`);
    const data = await response.json();
    app.stravaConnected = !!data.connected;
    updateConnectionStatus();
    updateActionButtons();
  } catch (error) {
    console.error("Fehler bei Strava-Status:", error);
    app.stravaConnected = false;
    updateConnectionStatus();
    updateActionButtons();
  }
}

async function loadStravaActivities() {
  try {
    const response = await fetch(`${API_BASE}/api/strava/activities`);
    const data = await response.json();

    if (data.ok && Array.isArray(data.activities)) {
      app.activities = data.activities.map(activity => {
        const distanceKm = activity.distance ? activity.distance / 1000 : 0;
        const movingTimeMin = activity.moving_time ? Math.round(activity.moving_time / 60) : 0;
        const avgHeartrate = activity.average_heartrate || null;
        const pace = calculatePace(distanceKm, movingTimeMin, activity.type);
        const speed = calculateSpeed(distanceKm, movingTimeMin, activity.type);

        return {
          id: activity.id,
          type: activity.type || 'Workout',
          icon: getActivityIcon(activity.type),
          name: activity.name || 'Aktivität',
          distanceKm,
          movingTimeMin,
          averageHeartrate: avgHeartrate,
          pace,
          speed,
          startDate: activity.start_date || null,
          load: estimateActivityLoad(activity)
        };
      });
    } else {
      app.activities = [];
    }
  } catch (error) {
    console.error("Fehler beim Laden der Strava-Aktivitäten:", error);
    app.activities = [];
  }
}

function getActivityIcon(type) {
  if (type === 'Run') return '🏃';
  if (type === 'Ride') return '🚴';
  if (type === 'Walk') return '🚶';
  if (type === 'Hike') return '🥾';
  if (type === 'Workout') return '🏋️';
  if (type === 'Swim') return '🏊';
  return '⚡';
}

function calculatePace(distanceKm, movingTimeMin, type) {
  if (type !== 'Run' && type !== 'Walk' && type !== 'Hike') return null;
  if (!distanceKm || distanceKm <= 0) return null;

  const minPerKm = movingTimeMin / distanceKm;
  const minutes = Math.floor(minPerKm);
  const seconds = Math.round((minPerKm - minutes) * 60);
  return `${minutes}:${String(seconds).padStart(2, '0')} min/km`;
}

function calculateSpeed(distanceKm, movingTimeMin, type) {
  if (type !== 'Ride') return null;
  if (!distanceKm || !movingTimeMin) return null;

  const kmh = distanceKm / (movingTimeMin / 60);
  return `${kmh.toFixed(1)} km/h`;
}

function estimateActivityLoad(activity) {
  const movingMinutes = activity.moving_time ? activity.moving_time / 60 : 0;
  const distanceKm = activity.distance ? activity.distance / 1000 : 0;
  const avgHeartrate = activity.average_heartrate || 0;

  let load = 0;
  load += movingMinutes * 0.4;
  load += distanceKm * 1.6;

  if (avgHeartrate > 0) {
    load += Math.max(0, avgHeartrate - 95) * 0.22;
  }

  if (activity.type === 'Ride') load += 8;
  if (activity.type === 'Run') load += 5;

  return Math.max(5, Math.min(100, Math.round(load)));
}

function setupNavigation() {
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => {
      const screen = item.dataset.screen;
      switchScreen(screen);
    });
  });
}

function switchScreen(screenName) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));

  document.getElementById(`screen-${screenName}`).classList.add('active');
  document.querySelector(`[data-screen="${screenName}"]`).classList.add('active');

  app.currentScreen = screenName;

  if (screenName === 'dashboard') renderDashboard();
  if (screenName === 'coach') renderCoachProfile();
  if (screenName === 'activities') renderActivities();
  if (screenName === 'today') renderToday();
}

function setupFormHandlers() {
  document.getElementById('profile-form')?.addEventListener('change', updateProfile);
}

function updateProfile() {
  app.userData.sport = document.getElementById('sport-select')?.value;
  app.userData.goal = document.getElementById('goal-select')?.value;
  app.userData.days = parseInt(document.getElementById('days-input')?.value) || 5;
  app.userData.goalDate = document.getElementById('goal-date')?.value;

  renderToday();
  renderCoachProfile();
}

function updateDate() {
  const date = new Date();
  const options = { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' };
  document.getElementById('current-date').textContent = date.toLocaleDateString('de-DE', options);
}

function initializeForm() {
  const sportSelect = document.getElementById('sport-select');
  const goalSelect = document.getElementById('goal-select');
  const daysInput = document.getElementById('days-input');
  const goalDate = document.getElementById('goal-date');

  if (sportSelect) sportSelect.value = app.userData.sport;
  if (goalSelect) goalSelect.value = app.userData.goal;
  if (daysInput) daysInput.value = app.userData.days;
  if (goalDate) goalDate.value = app.userData.goalDate;
}

function normalize(value, min, max) {
  const clamped = Math.max(min, Math.min(max, value));
  return Math.round(((clamped - min) / (max - min)) * 100);
}

function getActivityLoadToday() {
  return app.activities.reduce((sum, item) => sum + item.load, 0);
}

function getLatestActivity() {
  return app.activities.length ? app.activities[0] : null;
}

function getTargetStrain() {
  const recovery = app.metrics.recovery;
  const sleep = app.metrics.sleep;

  if (recovery >= 80 && sleep >= 80) return 74;
  if (recovery >= 65 && sleep >= 75) return 62;
  if (recovery >= 50 && sleep >= 65) return 48;
  return 32;
}

function getDayStrain() {
  const activityNorm = normalize(getActivityLoadToday(), 0, 160);
  const stressNorm = Math.round(app.metrics.stress);
  return Math.max(1, Math.min(100, Math.round(activityNorm * 0.65 + stressNorm * 0.35)));
}

function getStatus(value) {
  if (value >= 75) return 'Gut';
  if (value >= 50) return 'Moderat';
  return 'Niedrig';
}

function setRingProgress(id, value) {
  const circle = document.getElementById(id);
  if (!circle) return;
  const circumference = 339.3;
  const offset = circumference - (value / 100) * circumference;
  circle.style.strokeDashoffset = offset;
}

function polarPosition(score) {
  const angle = (-90 + (score / 100) * 360) * (Math.PI / 180);
  const r = 54;
  const cx = 60;
  const cy = 60;
  return {
    x: cx + r * Math.cos(angle),
    y: cy + r * Math.sin(angle)
  };
}

function placeMarker(id, score) {
  const marker = document.getElementById(id);
  if (!marker) return;
  const pos = polarPosition(score);
  marker.setAttribute('cx', pos.x.toFixed(2));
  marker.setAttribute('cy', pos.y.toFixed(2));
}

function renderToday() {
  const recovery = app.metrics.recovery;
  const sleep = app.metrics.sleep;
  const strain = getDayStrain();
  const activityScore = normalize(getActivityLoadToday(), 0, 160);
  const stressScore = Math.round(app.metrics.stress);
  const targetScore = getTargetStrain();

  setRingProgress('recovery-ring', recovery);
  setRingProgress('strain-ring', strain);
  setRingProgress('sleep-ring', sleep);

  placeMarker('strain-marker-activity', activityScore);
  placeMarker('strain-marker-stress', stressScore);
  placeMarker('strain-marker-target', targetScore);

  document.getElementById('recovery-value').textContent = recovery;
  document.getElementById('strain-value').textContent = strain;
  document.getElementById('sleep-value').textContent = sleep;

  document.getElementById('recovery-status').textContent = getStatus(recovery);
  document.getElementById('strain-status').textContent = getStatus(strain);
  document.getElementById('sleep-status').textContent = getStatus(sleep);

  document.getElementById('stat-sleep').textContent = `${app.metrics.sleepHours}h`;
  document.getElementById('stat-rhr').textContent = `${app.metrics.rhr}`;
  document.getElementById('stat-hrv').textContent = `${app.metrics.hrv}ms`;
  document.getElementById('stat-steps').textContent = `${(app.metrics.steps / 1000).toFixed(1)}k`;

  const today = getTodayRecommendation();
  document.getElementById('recommendation-title').textContent = today.title;
  document.getElementById('recommendation-text').textContent = today.text;

  const planned = getPlannedSession();
  document.getElementById('planned-title').textContent = planned.title;
  document.getElementById('planned-text').textContent = planned.text;

  const options = getTrainingOptions();
  document.getElementById('option-a-title').textContent = options.a.title;
  document.getElementById('option-a-text').textContent = options.a.text;
  document.getElementById('option-b-title').textContent = options.b.title;
  document.getElementById('option-b-text').textContent = options.b.text;

  renderLatestActivityCard();
}

function renderLatestActivityCard() {
  const titleEl = document.getElementById('latest-activity-title');
  const textEl = document.getElementById('latest-activity-text');
  if (!titleEl || !textEl) return;

  const latest = getLatestActivity();

  if (!latest) {
    titleEl.textContent = 'Noch keine Aktivität geladen';
    textEl.textContent = 'Verbinde Strava oder aktualisiere deine Daten im Setup.';
    return;
  }

  const details = [
    `${latest.icon} ${latest.type}`,
    `${latest.distanceKm.toFixed(1)} km`,
    `${latest.movingTimeMin} min`,
    `${latest.load} Load`
  ];

  if (latest.pace) details.push(latest.pace);
  if (latest.speed) details.push(latest.speed);
  if (latest.averageHeartrate) details.push(`${Math.round(latest.averageHeartrate)} bpm`);

  titleEl.textContent = latest.name;
  textEl.textContent = details.join(' · ');
}

function getTodayRecommendation() {
  const recovery = app.metrics.recovery;
  const sleep = app.metrics.sleep;
  const strain = getDayStrain();
  const latest = getLatestActivity();

  if (recovery < 45 || sleep < 60) {
    return {
      title: 'Heute eher regenerativ',
      text: latest
        ? `Deine Erholung ist heute nicht ideal. Nach deiner letzten Einheit "${latest.name}" passt eher locker oder Pause.`
        : 'Deine Erholung oder dein Schlaf sind heute nicht ideal. Ruhig und kontrolliert ist sinnvoller als hart.'
    };
  }

  if (recovery >= 70 && strain < 70) {
    return {
      title: 'Heute Qualität möglich',
      text: latest
        ? `Du bist recht frisch. Nach "${latest.name}" ist heute ein kontrollierter Reiz möglich.`
        : 'Du bist recht frisch. Ein kontrollierter Reiz ist heute möglich, solange du sauber und nicht maximal trainierst.'
    };
  }

  return {
    title: 'Heute locker bis moderat',
    text: 'Heute passt eher ein ruhiger bis moderater Trainingstag.'
  };
}

function getPlannedSession() {
  if (app.metrics.recovery < 45) {
    return {
      title: '30 min Recovery oder Pause',
      text: 'Sehr locker bewegen oder bewusst erholen.'
    };
  }

  if (app.userData.goal === 'Halbmarathon') {
    return {
      title: '45–60 min locker',
      text: 'Ruhig laufen, sauberer Rhythmus, keine harten Spitzen.'
    };
  }

  if (app.userData.goal === 'Marathon') {
    return {
      title: '60 min Grundlage',
      text: 'Stabil und ruhig, Fokus auf Umfang statt Intensität.'
    };
  }

  if (app.userData.goal === 'Radrennen' || app.userData.goal === 'Gran Fondo') {
    return {
      title: 'GA1 auf dem Rad',
      text: 'Kontrollierte Grundlage, rund treten, nicht überziehen.'
    };
  }

  return {
    title: '45 min locker',
    text: 'Heute eher kontrolliert statt hart.'
  };
}

function getTrainingOptions() {
  if (app.metrics.recovery < 45) {
    return {
      a: { title: 'Recovery', text: '20–30 min sehr locker oder kompletter Ruhetag.' },
      b: { title: 'Alternative', text: 'Mobility, Spaziergang oder leichtes Stabi-Programm.' }
    };
  }

  if (app.userData.goal === 'Halbmarathon') {
    return {
      a: { title: 'Lockerer Dauerlauf', text: '45–60 min locker in ruhigem Bereich.' },
      b: { title: 'Alternative', text: '30–40 min locker + 4 kurze Steigerungen.' }
    };
  }

  if (app.userData.goal === 'Marathon') {
    return {
      a: { title: 'Grundlage', text: '60 min locker bis moderat, gleichmäßig und sauber.' },
      b: { title: 'Alternative', text: '45 min locker plus Mobility.' }
    };
  }

  return {
    a: { title: 'Lockere Einheit', text: 'Sauber und ruhig trainieren.' },
    b: { title: 'Alternative', text: 'Sehr locker oder Mobility.' }
  };
}

function renderActivities() {
  const container = document.getElementById('activities-container');
  if (!container) return;

  if (!app.activities.length) {
    container.innerHTML = `
      <div class="dashboard-row">
        <div class="dashboard-row-left">
          <div class="dashboard-row-label">Keine Aktivitäten</div>
          <div class="dashboard-row-sub">Noch keine Strava-Daten geladen</div>
        </div>
      </div>
    `;
    return;
  }

  container.innerHTML = app.activities.map(activity => {
    const extraLine = [];

    if (activity.pace) extraLine.push(activity.pace);
    if (activity.speed) extraLine.push(activity.speed);
    if (activity.averageHeartrate) extraLine.push(`${Math.round(activity.averageHeartrate)} bpm`);

    return `
      <div class="dashboard-row">
        <div class="dashboard-row-left">
          <div class="dashboard-row-label">${activity.icon} ${activity.type}</div>
          <div class="dashboard-row-sub">
            ${activity.name} · ${activity.distanceKm.toFixed(1)} km · ${activity.load} Load
            ${extraLine.length ? `· ${extraLine.join(' · ')}` : ''}
          </div>
        </div>
        <div class="dashboard-row-right">
          <div class="dashboard-row-value">${activity.movingTimeMin} min</div>
        </div>
      </div>
    `;
  }).join('');
}

function renderCalendar() {
  const container = document.getElementById('calendar-container');
  if (!container) return;

  const days = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
  const labels = ['Locker', 'Tempo', 'Ruhe', 'GA1', 'Kraft', 'Long', 'Easy'];

  container.innerHTML = `
    <div class="dashboard-container">
      ${days.map((day, i) => `
        <div class="dashboard-row">
          <div class="dashboard-row-left">
            <div class="dashboard-row-label">${day}</div>
            <div class="dashboard-row-sub">${labels[i]}</div>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

function renderCoachProfile() {
  const line1 = document.getElementById('coach-profile-line-1');
  const line2 = document.getElementById('coach-profile-line-2');
  if (!line1 || !line2) return;

  const sportMap = {
    Run: 'Laufen',
    Ride: 'Radfahren',
    Ski: 'Ski Skating',
    Mixed: 'Mixed Sports'
  };

  line1.textContent = `${sportMap[app.userData.sport] || app.userData.sport} · ${app.userData.goal} · ${app.userData.days} Tage/Woche`;
  line2.textContent = `Erholung ${app.metrics.recovery} · Schlaf ${app.metrics.sleep} · Tagesbelastung ${getDayStrain()}`;
}

function useQuickQuestion(question) {
  switchScreen('coach');
  document.querySelector('[data-screen="coach"]').classList.add('active');
  document.getElementById('coach-input').value = question;
  askCoach();
}

function addCoachMessage(role, text) {
  const container = document.getElementById('coach-messages');
  if (!container) return;

  const div = document.createElement('div');
  div.className = `coach-message ${role}`;
  div.innerHTML = `
    <div class="coach-message-role">${role === 'user' ? 'Du' : 'Coach'}</div>
    <div class="coach-message-bubble">${text}</div>
  `;
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
}

function getSportLabel() {
  const map = {
    Run: 'Laufen',
    Ride: 'Radfahren',
    Ski: 'Ski Skating',
    Mixed: 'Mixed Sports'
  };
  return map[app.userData.sport] || app.userData.sport;
}

function getDaysToGoal() {
  if (!app.userData.goalDate) return null;
  const today = new Date();
  const goalDate = new Date(app.userData.goalDate);
  const ms = goalDate - today;
  return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
}

function getRecoveryTone() {
  const r = app.metrics.recovery;
  const s = app.metrics.sleep;
  const strain = getDayStrain();

  if (r >= 80 && s >= 80 && strain < 65) return 'frisch';
  if (r >= 65 && s >= 70) return 'solide';
  if (r >= 50) return 'vorsichtig';
  return 'müde';
}

function buildGoalSpecificAdvice() {
  const goal = app.userData.goal;
  const sport = app.userData.sport;
  const days = app.userData.days;
  const daysToGoal = getDaysToGoal();

  if (goal === 'Halbmarathon') {
    return `Für dein Ziel Halbmarathon sind ein längerer ruhiger Lauf, ein gezielter Temporeiz und mehrere lockere Einheiten pro Woche sinnvoll. Mit ${days} Trainingstagen ist Regelmäßigkeit wichtiger als einzelne harte Tage.`;
  }

  if (goal === 'Marathon') {
    return `Für dein Marathonziel zählen vor allem ruhiger Umfang, gute Verträglichkeit und ein sauberer Longrun-Aufbau. Mit ${days} Trainingstagen sollte der Wochenrhythmus stabil und nicht zu aggressiv sein.`;
  }

  if (goal === '10 km' || goal === '5 km') {
    return `Für ${goal} brauchst du vor allem Tempoverträglichkeit, aber nur auf einem soliden lockeren Fundament. Kurze schnelle Reize bringen nur etwas, wenn die lockeren Tage wirklich locker bleiben.`;
  }

  if (goal === 'Radrennen' || goal === 'Gran Fondo' || sport === 'Ride') {
    return `Für dein Radziel brauchst du vor allem stabile Grundlagentage, einen klaren Qualitätsreiz pro Woche und genug Erholung zwischen intensiven Belastungen.`;
  }

  if (sport === 'Ski') {
    return `Für Ski Skating sind ruhige Ausdauer, Technikqualität und gezielte intensive Blöcke wichtig. Die Gesamtbelastung sollte aber sauber verteilt werden.`;
  }

  if (daysToGoal !== null) {
    return `Bis zu deinem Ziel sind es noch etwa ${daysToGoal} Tage. Gerade jetzt bringt dir ein ruhiger, konstanter Aufbau mehr als zu viele harte Spitzen.`;
  }

  return `Für dein Ziel ist ein ruhiger, klar strukturierter Aufbau sinnvoll. Der größte Hebel ist Konstanz über mehrere Wochen.`;
}

function buildWeeklyVolumeAdvice() {
  const goal = app.userData.goal;
  const sport = app.userData.sport;
  const days = app.userData.days;

  if (sport === 'Ride' || goal === 'Radrennen' || goal === 'Gran Fondo') {
    if (days <= 3) return `Mit ${days} Trainingstagen pro Woche solltest du einen längeren Grundlagenreiz, einen gezielten Qualitätsreiz und einen lockeren Ergänzungstag setzen.`;
    if (days <= 5) return `Mit ${days} Trainingstagen pro Woche passt meist 1 intensiver Tag, 1 längerer Grundlagenblock und mehrere ruhige Einheiten sehr gut.`;
    return `Mit ${days} Trainingstagen pro Woche musst du besonders auf die Verteilung achten. Nicht zu viele mittlere Tage hintereinander.`;
  }

  if (goal === 'Halbmarathon' || goal === 'Marathon' || sport === 'Run') {
    if (days <= 3) return `Mit ${days} Lauftagen pro Woche sollte jede Einheit einen klaren Zweck haben: locker, Qualität, länger.`;
    if (days <= 5) return `Mit ${days} Lauftagen pro Woche ist ein stabiler Mix aus locker, einem Reiz und einem längeren Lauf meist ideal.`;
    return `Mit ${days} Lauftagen pro Woche ist die Verteilung entscheidend. Wirklich lockere Tage machen den Unterschied.`;
  }

  return `Mit ${days} Trainingstagen pro Woche ist ein klarer Rhythmus besser als tägliches Draufpacken.`;
}

function buildIntervalsAdvice() {
  const tone = getRecoveryTone();
  const recovery = app.metrics.recovery;
  const sleep = app.metrics.sleep;
  const strain = getDayStrain();
  const goal = app.userData.goal;

  if (tone === 'frisch') {
    return `Heute sind Intervalle eher möglich. Erholung ${recovery}, Schlaf ${sleep} und Tagesbelastung ${strain} sprechen dafür, dass du einen kontrollierten Qualitätsreiz setzen kannst. Für dein Ziel ${goal} würde ich die Einheit eher sauber als maximal laufen oder fahren.`;
  }

  if (tone === 'solide') {
    return `Intervalle gehen heute grundsätzlich, aber eher kontrolliert. Kein All-out, sondern sauberer Reiz mit Reserve. Gerade bei Erholung ${recovery} bringt dir Qualität mit Kontrolle mehr als Härte.`;
  }

  if (tone === 'vorsichtig') {
    return `Heute wäre ich mit Intervallen zurückhaltend. Deine aktuelle Frische ist nicht schlecht, aber auch nicht ideal für harte Qualität. Eher moderat statt maximal.`;
  }

  return `Heute eher keine harten Intervalle. Deine aktuelle Kombination aus Erholung, Schlaf und Tagesbelastung spricht mehr für locker, Technik oder ruhige Grundlage.`;
}

function buildTodayTrainingAnswer() {
  const recommendation = getTodayRecommendation();
  const planned = getPlannedSession();
  const options = getTrainingOptions();
  const latest = getLatestActivity();
  const latestText = latest
    ? `Die letzte Einheit war "${latest.name}" mit ${latest.distanceKm.toFixed(1)} km in ${latest.movingTimeMin} min.`
    : `Es ist noch keine letzte Strava-Aktivität geladen.`;

  return [
    `Heute würde ich dir Folgendes empfehlen: ${recommendation.title}.`,
    `Geplante Richtung: ${planned.title}. ${planned.text}`,
    `Option A: ${options.a.title}. ${options.a.text}`,
    `Option B: ${options.b.title}. ${options.b.text}`,
    latestText
  ].join('<br><br>');
}

function buildRecoveryAnswer() {
  const tone = getRecoveryTone();
  const recovery = app.metrics.recovery;
  const sleep = app.metrics.sleep;
  const hrv = app.metrics.hrv;
  const rhr = app.metrics.rhr;

  if (tone === 'frisch') {
    return `Du wirkst heute recht frisch. Erholung ${recovery}, Schlaf ${sleep}, HRV ${hrv} ms und Ruhepuls ${rhr} sprechen eher dafür, dass dein System auf Belastung vorbereitet ist. Ein guter Tag für Qualität mit Kontrolle.`;
  }

  if (tone === 'solide') {
    return `Du bist heute ordentlich belastbar, aber nicht maximal frisch. Erholung ${recovery} und Schlaf ${sleep} sind okay. Das passt gut für locker bis moderat oder für einen sauber dosierten Reiz.`;
  }

  if (tone === 'vorsichtig') {
    return `Deine Erholung ist heute eher mittel. Ich würde die Belastung bewusst steuern und lieber sauber trainieren als hart. Das schützt die nächsten Tage.`;
  }

  return `Heute steht Regeneration im Vordergrund. Deine Erholung ist zu niedrig, um harte Qualität sinnvoll unterzubringen. Locker, kurz oder Pause wäre die bessere Entscheidung.`;
}

function buildGoalAnswer() {
  const goalAdvice = buildGoalSpecificAdvice();
  const daysToGoal = getDaysToGoal();

  if (daysToGoal !== null) {
    return `${goalAdvice}<br><br>Bis zum Ziel sind es noch ungefähr ${daysToGoal} Tage. Je näher du an den Wettkampf kommst, desto wichtiger werden Rhythmus, Frische und saubere Prioritäten.`;
  }

  return goalAdvice;
}

function buildWeeklyPlanAnswer() {
  const goal = app.userData.goal;
  const days = app.userData.days;
  const sport = getSportLabel();

  return [
    `Für ${sport} mit dem Ziel ${goal} und ${days} Trainingstagen pro Woche würde ich grob so denken:`,
    `1 klarer Qualitätsreiz pro Woche.`,
    `1 längere oder umfangsorientierte Einheit.`,
    `Die restlichen Tage überwiegend locker oder regenerativ.`,
    `Nicht mehrere fordernde Tage direkt hintereinander.`,
    buildWeeklyVolumeAdvice()
  ].join('<br><br>');
}

function buildVo2Answer() {
  const sport = app.userData.sport;

  if (sport === 'Ride') {
    return `Wenn du deine VO2max verbessern willst, brauchst du nicht ständig hart zu fahren. Meist reichen 1 bis 2 gezielte Reize pro Woche, eingebettet in genug ruhige Grundlage. Zu viele harte Tage drücken oft eher die Qualität.`;
  }

  return `Wenn du deine VO2max verbessern willst, sind gezielte intensive Reize sinnvoll, aber nur auf einer guten lockeren Basis. Meist bringt dir 1 sauberer Qualitätsreiz pro Woche mehr als mehrfach halb-harte Einheiten.`;
}

function buildLongRunAnswer() {
  if (app.userData.goal === 'Marathon') {
    return `Für dein Marathonziel ist der Longrun einer der wichtigsten Bausteine. Er sollte überwiegend ruhig sein, gut verträglich bleiben und dich nicht so leer machen, dass die Folgetage leiden.`;
  }

  if (app.userData.goal === 'Halbmarathon') {
    return `Für den Halbmarathon ist der längere ruhige Lauf wichtig, aber nicht so dominant wie beim Marathon. Entscheidend ist, dass er regelmäßig kommt und dich nicht für die Qualitätstage zerstört.`;
  }

  return `Längere Einheiten sind wertvoll, wenn sie sauber dosiert sind. Sie sollen Stabilität aufbauen, nicht dich komplett leeren.`;
}

function buildRaceReadinessAnswer() {
  const tone = getRecoveryTone();
  const daysToGoal = getDaysToGoal();

  if (daysToGoal !== null && daysToGoal <= 10) {
    return `Wenn dein Wettkampf nah ist, zählt jetzt Frische mehr als zusätzliche Härte. Du wirst eher durch gute Beine am Start schneller als durch noch einen extra harten Reiz.`;
  }

  if (tone === 'frisch') {
    return `Du wirkst aktuell in einer guten Richtung. Wenn du diesen Rhythmus hältst, bist du auf einem ordentlichen Weg Richtung Wettkampf.`;
  }

  if (tone === 'solide') {
    return `Du bist auf Kurs, aber du profitierst jetzt eher von Konstanz als von Eskalation. Ein sauberer Aufbau ist aktuell wichtiger als maximale Härte.`;
  }

  return `Im Moment würde ich zuerst die Frische stabilisieren. Wettkampfform entsteht nicht nur durch Belastung, sondern auch dadurch, dass du den Reiz überhaupt gut verarbeiten kannst.`;
}

function buildFallbackCoachAnswer() {
  return [
    `Aus deiner aktuellen Lage würde ich so denken:`,
    buildRecoveryAnswer(),
    buildGoalSpecificAdvice(),
    `Heute zählt vor allem, dass dein Training zu deiner momentanen Frische passt und nicht nur zu deinem Ehrgeiz.`
  ].join('<br><br>');
}

function buildCoachAnswer(question) {
  const q = question.toLowerCase();

  if (q.includes('heute') || q.includes('trainieren heute') || q.includes('was soll ich heute')) {
    return buildTodayTrainingAnswer();
  }

  if (q.includes('intervall') || q.includes('intervalle') || q.includes('tempo')) {
    return buildIntervalsAdvice();
  }

  if (q.includes('erholung') || q.includes('regeneration') || q.includes('fit') || q.includes('frisch')) {
    return buildRecoveryAnswer();
  }

  if (q.includes('wochenplan') || q.includes('woche')) {
    return buildWeeklyPlanAnswer();
  }

  if (q.includes('wie viel') || q.includes('umfang') || q.includes('pro woche')) {
    return buildWeeklyVolumeAdvice();
  }

  if (q.includes('ziel') || q.includes('wettkampf') || q.includes('halbmarathon') || q.includes('marathon') || q.includes('radrennen') || q.includes('gran fondo')) {
    return buildGoalAnswer();
  }

  if (q.includes('vo2') || q.includes('vo2max')) {
    return buildVo2Answer();
  }

  if (q.includes('longrun') || q.includes('langer lauf')) {
    return buildLongRunAnswer();
  }

  if (q.includes('bereit') || q.includes('wettkampfform') || q.includes('rennen')) {
    return buildRaceReadinessAnswer();
  }

  return buildFallbackCoachAnswer();
}

function askCoach() {
  const input = document.getElementById('coach-input');
  if (!input) return;

  const question = input.value.trim();
  if (!question) return;

  input.value = '';
  addCoachMessage('user', question);
  addCoachMessage('assistant', buildCoachAnswer(question));
}

function dashboardItems() {
  return [
    { key: 'HRV', label: 'HRV', value: `${app.metrics.hrv} ms`, sub: 'Herzfrequenzvariabilität' },
    { key: 'Ruhepuls', label: 'Ruhepuls', value: `${app.metrics.rhr}`, sub: 'bpm' },
    { key: 'Schritte', label: 'Schritte', value: `${app.metrics.steps}`, sub: 'heute' },
    { key: 'VO2max', label: 'VO2max', value: `${app.metrics.vo2max}`, sub: 'ml/kg/min' },
    { key: 'Kalorien', label: 'Kalorien', value: `${app.metrics.calories}`, sub: 'gesamt' },
    { key: 'Atemfrequenz', label: 'Atemfrequenz', value: `${app.metrics.respiration}`, sub: 'pro Minute' },
    { key: 'Durchschnittspuls', label: 'Durchschn. Puls', value: `${app.metrics.avgHr}`, sub: 'bpm' },
    { key: 'Geschlafene Stunden', label: 'Geschlafen', value: `${app.metrics.sleepHours} h`, sub: 'gesamt' },
    { key: 'Tagesbelastung', label: 'Tagesbelastung', value: `${getDayStrain()}`, sub: '1–100' }
  ];
}

function metricSeries(metric, range) {
  const suffix = range === '7d' ? '7d' : range === '1m' ? '1m' : range === '6m' ? '6m' : '12m';

  const map = {
    HRV: app.history[`hrv${suffix}`],
    Ruhepuls: app.history[`rhr${suffix}`],
    VO2max: app.history[`vo2max${suffix}`],
    Schritte: app.history[`steps${suffix}`],
    Kalorien: app.history[`calories${suffix}`],
    Atemfrequenz: app.history[`respiration${suffix}`],
    Durchschnittspuls: app.history[`avgHr${suffix}`],
    'Geschlafene Stunden': app.history[`sleepHours${suffix}`],
    Tagesbelastung: (app.history[`activity${suffix}`] && app.history[`stress${suffix}`])
      ? app.history[`activity${suffix}`].map((v, i) => Math.max(1, Math.min(100, Math.round(v * 0.65 + app.history[`stress${suffix}`][i] * 0.35))))
      : [40, 52, 48, 61, 57, 63, 61]
  };

  return map[metric] || [10, 20, 30, 25, 35, 40, 38];
}

function drawDetailChart(svgId, values) {
  const svg = document.getElementById(svgId);
  if (!svg) return;

  const width = 360;
  const height = 180;
  const padding = 16;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const points = values.map((v, i) => {
    const x = padding + (i * (width - padding * 2)) / (values.length - 1);
    const y = height - padding - ((v - min) / range) * (height - padding * 2);
    return { x, y };
  });

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`;

  const gridLines = [0.25, 0.5, 0.75].map(f => {
    const y = padding + (height - padding * 2) * f;
    return `<line x1="${padding}" y1="${y}" x2="${width - padding}" y2="${y}" stroke="rgba(255,255,255,0.08)" stroke-width="1"></line>`;
  }).join('');

  svg.innerHTML = `
    <defs>
      <linearGradient id="${svgId}-fill" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#6c63ff" stop-opacity="0.28"></stop>
        <stop offset="100%" stop-color="#6c63ff" stop-opacity="0"></stop>
      </linearGradient>
    </defs>
    ${gridLines}
    <path d="${areaPath}" fill="url(#${svgId}-fill)"></path>
    <path d="${linePath}" fill="none" stroke="#6c63ff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"></path>
    ${points.map(p => `<circle cx="${p.x}" cy="${p.y}" r="2.5" fill="#6c63ff"></circle>`).join('')}
  `;
}

function toggleDashboardDetail(metric) {
  app.dashboardOpenMetric = app.dashboardOpenMetric === metric ? null : metric;
  app.dashboardMetric = metric;
  renderDashboard();
}

function closeInlineDetail() {
  app.dashboardOpenMetric = null;
  renderDashboard();
}

function setDashboardRange(range) {
  app.dashboardRange = range;
  renderDashboard();
}

function renderDashboard() {
  const container = document.getElementById('dashboard-container');
  if (!container) return;

  const items = dashboardItems();

  container.innerHTML = items.map(item => {
    const isOpen = app.dashboardOpenMetric === item.key;
    const safeKey = item.key.replace(/\s+/g, '-');

    return `
      <div class="dashboard-item">
        <div class="dashboard-row" onclick="toggleDashboardDetail('${item.key}')">
          <div class="dashboard-row-left">
            <div class="dashboard-row-label">${item.label}</div>
            <div class="dashboard-row-sub">${item.sub}</div>
          </div>
          <div class="dashboard-row-right">
            <div class="dashboard-row-value">${item.value}</div>
          </div>
        </div>

        ${isOpen ? `
          <div class="dashboard-inline-detail">
            <div class="dashboard-inline-header">
              <div>
                <div class="dashboard-inline-title">${item.label}</div>
                <div class="dashboard-inline-sub">Trend über ${app.dashboardRange.toUpperCase()}</div>
              </div>
              <button class="inline-close" onclick="event.stopPropagation(); closeInlineDetail()">×</button>
            </div>

            <div class="range-tabs">
              <button class="range-tab ${app.dashboardRange === '7d' ? 'active' : ''}" onclick="event.stopPropagation(); setDashboardRange('7d')">7D</button>
              <button class="range-tab ${app.dashboardRange === '1m' ? 'active' : ''}" onclick="event.stopPropagation(); setDashboardRange('1m')">1M</button>
              <button class="range-tab ${app.dashboardRange === '6m' ? 'active' : ''}" onclick="event.stopPropagation(); setDashboardRange('6m')">6M</button>
              <button class="range-tab ${app.dashboardRange === '12m' ? 'active' : ''}" onclick="event.stopPropagation(); setDashboardRange('12m')">12M</button>
            </div>

            <svg id="detail-chart-${safeKey}" class="detail-chart" viewBox="0 0 360 180" preserveAspectRatio="none"></svg>
          </div>
        ` : ''}
      </div>
    `;
  }).join('');

  items.forEach(item => {
    if (app.dashboardOpenMetric === item.key) {
      const chartId = `detail-chart-${item.key.replace(/\s+/g, '-')}`;
      drawDetailChart(chartId, metricSeries(item.key, app.dashboardRange));
    }
  });
}
