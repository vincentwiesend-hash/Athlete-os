const state = {
  dashboardRange: "7d",
  user: {
    name: "Vincent"
  },
  profile: {
    primarySport: "Run",
    goal: "Halbmarathon",
    goalDate: "2026-09-21",
    focus: "VO2max verbessern",
    availableDays: 5
  },
  garmin: {
    recovery: 78,
    readiness: 78,
    hrv: 62,
    restingHr: 49,
    bodyBattery: 90,
    stress: 34,
    vo2max: 56,
    steps: 12480,
    calories: 2860,
    respiration: 14.8,
    avgHr: 67
  },
  sleep: {
    score: 82,
    hours: 7.8,
    restorativePercent: 40,
    restorativeHours: 3.1,
    efficiency: 91,
    performance: 87,
    consistency: 84,
    needHours: 8.4,
    debtHours: 0.6,
    timeInBed: 8.5,
    awakeTimeMin: 34,
    lightSleepHours: 3.4,
    deepSleepHours: 1.5,
    remSleepHours: 1.6
  },
  heartRateZones: {
    zone1: 520,
    zone2: 110,
    zone3: 35,
    zone4: 12,
    zone5: 4
  },
  history: {
    recovery7d: [63, 67, 70, 72, 69, 75, 78],
    sleep7d: [74, 78, 80, 76, 79, 81, 82],
    stress7d: [42, 39, 48, 51, 44, 36, 34],
    activity7d: [28, 34, 52, 20, 41, 58, 43],

    recovery1m: [58,60,61,63,59,64,66,68,67,69,70,72,68,66,71,73,74,72,75,76,74,77,79,78,76,80,81,79,82,78],
    sleep1m: [71,72,75,74,73,76,78,77,74,75,79,80,78,76,81,79,77,82,83,81,80,78,82,84,83,81,85,84,83,82],
    stress1m: [48,52,49,47,53,51,46,44,50,48,45,43,47,49,46,44,42,41,43,45,44,40,39,38,40,42,41,37,36,34],
    activity1m: [22,28,34,30,18,25,40,42,29,20,38,45,31,24,41,48,37,19,33,46,43,26,18,36,50,44,39,28,35,43],

    recovery6m: [52,55,57,59,61,64],
    sleep6m: [69,71,73,75,78,82],
    stress6m: [55,52,49,46,40,34],
    activity6m: [30,33,35,39,41,43],

    recovery12m: [49,50,52,54,55,57,60,63,66,70,74,78],
    sleep12m: [66,67,68,69,70,72,73,74,76,78,80,82],
    stress12m: [58,57,55,53,52,49,48,45,43,40,37,34],
    activity12m: [24,25,27,29,31,32,34,36,38,40,42,43]
  },
  strava: {
    activities: [
      {
        id: 1,
        type: "Run",
        name: "Locker Dauerlauf",
        distanceKm: 8.4,
        movingTimeMin: 46,
        load: 42
      },
      {
        id: 2,
        type: "Ride",
        name: "GA1 Ausfahrt",
        distanceKm: 36.2,
        movingTimeMin: 92,
        load: 58
      }
    ]
  },
  planner: {
    week: []
  }
};

function showScreen(name, btn) {
  document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
  document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("active"));
  document.getElementById("screen-" + name).classList.add("active");
  btn.classList.add("active");

  if (name === "coach") renderCoachProfile();
  if (name === "dashboard") renderDashboard();
}

function updateProfile() {
  state.profile.primarySport = document.getElementById("sport-select").value;
  state.profile.goal = document.getElementById("goal-select").value;
  state.profile.focus = document.getElementById("focus-select").value;
  state.profile.goalDate = document.getElementById("goal-date-input").value || state.profile.goalDate;
  state.profile.availableDays = Number(document.getElementById("days-input").value || 5);

  generateWeekPlan();
  renderToday();
  renderCalendar();
  renderCoachProfile();
  renderDashboard();
}

function calculateActivityLoadToday() {
  return state.strava.activities.reduce((sum, activity) => sum + activity.load, 0);
}

function normalize(value, min, max) {
  const clamped = Math.max(min, Math.min(max, value));
  return Math.round(((clamped - min) / (max - min)) * 100);
}

function calculateDayStrain() {
  const activityLoad = calculateActivityLoadToday();
  const activityNorm = normalize(activityLoad, 0, 140);
  const stressNorm = Math.round(state.garmin.stress);
  return Math.max(1, Math.min(100, Math.round(activityNorm * 0.65 + stressNorm * 0.35)));
}

function daysUntilGoal() {
  const today = new Date();
  const goalDate = new Date(state.profile.goalDate);
  const diffMs = goalDate - today;
  return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
}

function getPhaseByGoal() {
  const days = daysUntilGoal();
  if (days > 84) return "Basis";
  if (days > 42) return "Aufbau";
  if (days > 14) return "Spezifisch";
  return "Taper";
}

function labelForScore(score) {
  if (score >= 75) return { text: "gut", cls: "pill-good" };
  if (score >= 50) return { text: "moderat", cls: "pill-mid" };
  return { text: "niedrig", cls: "pill-low" };
}

function valueRating(label, value) {
  switch (label) {
    case "HRV":
      return value >= 60 ? "gut" : value >= 45 ? "okay" : "niedrig";
    case "Ruhepuls":
      return value <= 52 ? "gut" : value <= 60 ? "okay" : "erhöht";
    case "VO2max":
      return value >= 55 ? "stark" : value >= 45 ? "okay" : "ausbaufähig";
    case "Schlafeffizienz":
    case "Schlafleistung":
    case "Schlafregelmäßigkeit":
      return value >= 85 ? "gut" : value >= 70 ? "okay" : "niedrig";
    case "Tagesbelastung":
      return value >= 75 ? "hoch" : value >= 50 ? "moderat" : "niedrig";
    default:
      return "";
  }
}

function getWeeklyFocus() {
  const goal = state.profile.goal;
  const phase = getPhaseByGoal();

  if (goal === "Marathon") {
    return {
      title: "Wochenfokus Marathon",
      text: `1 langer Lauf, 1 Schwellenreiz, mehrere lockere Einheiten. Phase: ${phase}.`
    };
  }

  if (goal === "Halbmarathon") {
    return {
      title: "Wochenfokus Halbmarathon",
      text: `1 Tempoeinheit, 1 längerer Lauf, lockere Ergänzungstage. Phase: ${phase}.`
    };
  }

  if (goal === "Ski Marathon Skating") {
    return {
      title: "Wochenfokus Ski",
      text: `1 Schwellenreiz, 1 längere Ausdauereinheit, 1 Kraftblock. Phase: ${phase}.`
    };
  }

  if (goal === "Radrennen" || goal === "Gran Fondo") {
    return {
      title: "Wochenfokus Rad",
      text: `1 Qualitätsfahrt, 1 lange Grundlage, 1 lockere Entlastungseinheit. Phase: ${phase}.`
    };
  }

  return {
    title: `Wochenfokus ${state.profile.focus}`,
    text: `1 Schwerpunktreiz, lockere Ergänzung und gute Erholung.`
  };
}

function getTodayRecommendation() {
  const recovery = state.garmin.recovery;
  const sleepScore = state.sleep.score;
  const dayStrain = calculateDayStrain();

  if (recovery < 45 || sleepScore < 60) {
    return {
      title: "Heute eher regenerativ",
      text: "Deine Erholung oder dein Schlaf sind heute nicht optimal. Ruhig und kontrolliert ist sinnvoller als hart."
    };
  }

  if (recovery >= 70 && dayStrain < 70) {
    return {
      title: "Heute Qualität möglich",
      text: "Du wirkst heute recht frisch. Ein sauber gesetzter Reiz passt gut, wenn du ihn kontrolliert hältst."
    };
  }

  return {
    title: "Heute locker bis moderat",
    text: "Heute passt eher eine ruhige bis moderate Einheit. Damit nimmst du Training mit, ohne unnötig zu drücken."
  };
}

function getPlannedSession() {
  const goal = state.profile.goal;
  const recovery = state.garmin.recovery;

  if (recovery < 45) {
    return {
      title: "30 min Recovery oder Pause",
      text: "Sehr locker bewegen oder bewusst erholen."
    };
  }

  if (goal === "Halbmarathon") {
    return {
      title: "45–60 min locker",
      text: "Ruhig laufen, sauberer Rhythmus, keine harten Spitzen."
    };
  }

  if (goal === "Marathon") {
    return {
      title: "60 min Grundlage",
      text: "Stabil und ruhig, Fokus auf Umfang statt Intensität."
    };
  }

  if (goal === "Ski Marathon Skating") {
    return {
      title: "Technik + Ausdauer",
      text: "Locker bis moderat mit Fokus auf Technik und Ökonomie."
    };
  }

  if (goal === "Radrennen" || goal === "Gran Fondo") {
    return {
      title: "GA1 auf dem Rad",
      text: "Kontrollierte Grundlage, rund treten, nicht überziehen."
    };
  }

  return {
    title: "45 min locker",
    text: "Heute eher kontrolliert statt hart."
  };
}

function getOptionCards() {
  const goal = state.profile.goal;
  const recovery = state.garmin.recovery;

  if (recovery < 45) {
    return {
      aTitle: "Recovery",
      aText: "20–30 min sehr locker oder kompletter Ruhetag.",
      bTitle: "Alternative",
      bText: "Mobility, Spaziergang oder leichtes Stabi-Programm."
    };
  }

  if (goal === "Halbmarathon") {
    return {
      aTitle: "Lockerer Dauerlauf",
      aText: "45–60 min locker in ruhigem Bereich.",
      bTitle: "Alternative",
      bText: "30–40 min locker + 4 kurze Steigerungen."
    };
  }

  if (goal === "Marathon") {
    return {
      aTitle: "Grundlage",
      aText: "60 min locker bis moderat, gleichmäßig und sauber.",
      bTitle: "Alternative",
      bText: "45 min locker plus Mobility."
    };
  }

  if (goal === "Ski Marathon Skating") {
    return {
      aTitle: "Technik-Ausdauer",
      aText: "Lockere Ausdauer mit Fokus auf saubere Technik.",
      bTitle: "Alternative",
      bText: "Kraft Oberkörper + kurze lockere Einheit."
    };
  }

  if (goal === "Radrennen" || goal === "Gran Fondo") {
    return {
      aTitle: "GA1 Ride",
      aText: "Lockere Grundlage mit ruhigem Druck aufs Pedal.",
      bTitle: "Alternative",
      bText: "Recovery Ride oder lockere Rolle."
    };
  }

  return {
    aTitle: "Lockere Einheit",
    aText: "Sauber und ruhig trainieren.",
    bTitle: "Alternative",
    bText: "Sehr locker oder Mobility."
  };
}

function generateWeekPlan() {
  const goal = state.profile.goal;

  if (goal === "Marathon") {
    state.planner.week = [
      { day: "Mo", number: 14, tag: "Locker" },
      { day: "Di", number: 15, tag: "Schwelle" },
      { day: "Mi", number: 16, tag: "Ruhe" },
      { day: "Do", number: 17, tag: "GA1" },
      { day: "Fr", number: 18, tag: "Kraft" },
      { day: "Sa", number: 19, tag: "Long" },
      { day: "So", number: 20, tag: "Easy" }
    ];
    return;
  }

  if (goal === "Halbmarathon") {
    state.planner.week = [
      { day: "Mo", number: 14, tag: "Locker" },
      { day: "Di", number: 15, tag: "Tempo" },
      { day: "Mi", number: 16, tag: "Ruhe" },
      { day: "Do", number: 17, tag: "GA1" },
      { day: "Fr", number: 18, tag: "Kraft" },
      { day: "Sa", number: 19, tag: "Long" },
      { day: "So", number: 20, tag: "Easy" }
    ];
    return;
  }

  state.planner.week = [
    { day: "Mo", number: 14, tag: "Locker" },
    { day: "Di", number: 15, tag: "Qualität" },
    { day: "Mi", number: 16, tag: "Ruhe" },
    { day: "Do", number: 17, tag: "GA1" },
    { day: "Fr", number: 18, tag: "Kraft" },
    { day: "Sa", number: 19, tag: "Lang" },
    { day: "So", number: 20, tag: "Off" }
  ];
}

function drawSparkline(svgId, values, color, fillOpacity = 0.18) {
  const svg = document.getElementById(svgId);
  if (!svg) return;

  const width = 320;
  const height = 90;
  const padding = 8;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const points = values.map((v, i) => {
    const x = padding + (i * (width - padding * 2)) / (values.length - 1);
    const y = height - padding - ((v - min) / range) * (height - padding * 2);
    return { x, y };
  });

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`;

  svg.innerHTML = `
    <defs>
      <linearGradient id="${svgId}-fill" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${color}" stop-opacity="${fillOpacity}"></stop>
        <stop offset="100%" stop-color="${color}" stop-opacity="0"></stop>
      </linearGradient>
    </defs>
    <path d="${areaPath}" fill="url(#${svgId}-fill)"></path>
    <path d="${linePath}" fill="none" stroke="${color}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"></path>
    ${points.map(p => `<circle cx="${p.x}" cy="${p.y}" r="2.4" fill="${color}"></circle>`).join("")}
  `;
}

function drawComboChart() {
  const svg = document.getElementById("dashboard-combo-chart");
  if (!svg) return;

  const range = state.dashboardRange;
  const stress = getHistorySeries("stress", range);
  const activity = getHistorySeries("activity", range);

  const width = 360;
  const height = 180;
  const padding = 16;
  const maxValue = 100;

  const buildPath = (values) => {
    return values.map((v, i) => {
      const x = padding + (i * (width - padding * 2)) / (values.length - 1);
      const y = height - padding - (v / maxValue) * (height - padding * 2);
      return `${i === 0 ? "M" : "L"} ${x} ${y}`;
    }).join(" ");
  };

  const buildPoints = (values) => {
    return values.map((v, i) => {
      const x = padding + (i * (width - padding * 2)) / (values.length - 1);
      const y = height - padding - (v / maxValue) * (height - padding * 2);
      return { x, y };
    });
  };

  const stressPath = buildPath(stress);
  const activityPath = buildPath(activity);
  const stressPts = buildPoints(stress);
  const activityPts = buildPoints(activity);

  const gridLines = [20, 40, 60, 80].map(v => {
    const y = height - padding - (v / maxValue) * (height - padding * 2);
    return `<line x1="${padding}" y1="${y}" x2="${width - padding}" y2="${y}" stroke="rgba(255,255,255,0.08)" stroke-width="1"></line>`;
  }).join("");

  svg.innerHTML = `
    ${gridLines}
    <path d="${stressPath}" fill="none" stroke="#ff4d6d" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"></path>
    <path d="${activityPath}" fill="none" stroke="#57a7ff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"></path>
    ${stressPts.map(p => `<circle cx="${p.x}" cy="${p.y}" r="2.5" fill="#ff4d6d"></circle>`).join("")}
    ${activityPts.map(p => `<circle cx="${p.x}" cy="${p.y}" r="2.5" fill="#57a7ff"></circle>`).join("")}
  `;
}

function getHistorySeries(type, range) {
  if (range === "7d") return state.history[`${type}7d`];
  if (range === "1m") return state.history[`${type}1m`];
  if (range === "6m") return state.history[`${type}6m`];
  return state.history[`${type}12m`];
}

function setDashboardRange(range, btn) {
  state.dashboardRange = range;
  document.querySelectorAll(".range-tab").forEach(tab => tab.classList.remove("active"));
  btn.classList.add("active");
  renderDashboard();
}

function renderToday() {
  const recommendation = getTodayRecommendation();
  const planned = getPlannedSession();
  const options = getOptionCards();
  const recoveryScore = state.garmin.recovery;
  const sleepScore = state.sleep.score;
  const strainScore = calculateDayStrain();

  const recoveryBadge = labelForScore(recoveryScore);
  const sleepBadge = labelForScore(sleepScore);
  const strainBadge = labelForScore(strainScore);

  document.getElementById("recovery-value").textContent = recoveryScore;
  document.getElementById("day-strain-value").textContent = strainScore;
  document.getElementById("sleep-score-value").textContent = sleepScore;

  const recEl = document.getElementById("recovery-badge");
  recEl.textContent = recoveryBadge.text;
  recEl.className = `pill ${recoveryBadge.cls}`;

  const sleepEl = document.getElementById("sleep-badge");
  sleepEl.textContent = sleepBadge.text;
  sleepEl.className = `pill ${sleepBadge.cls}`;

  const strainEl = document.getElementById("strain-badge");
  strainEl.textContent = strainBadge.text;
  strainEl.className = `pill ${strainBadge.cls}`;

  document.getElementById("today-title").textContent = recommendation.title;
  document.getElementById("today-text").textContent = recommendation.text;

  document.getElementById("planned-session-title").textContent = planned.title;
  document.getElementById("planned-session-text").textContent = planned.text;

  document.getElementById("option-a-title").textContent = options.aTitle;
  document.getElementById("option-a-text").textContent = options.aText;
  document.getElementById("option-b-title").textContent = options.bTitle;
  document.getElementById("option-b-text").textContent = options.bText;

  document.getElementById("mini-sleep-hours").textContent = `${state.sleep.hours.toFixed(1)} h`;
  document.getElementById("mini-restorative-sleep").textContent = `${state.sleep.restorativeHours.toFixed(1)} h`;
  document.getElementById("mini-rhr").textContent = state.garmin.restingHr;
  document.getElementById("mini-hrv").textContent = `${state.garmin.hrv} ms`;

  drawSparkline("recovery-chart", state.history.recovery7d, "#3dffc0");
  drawSparkline("strain-chart", state.history.activity7d.map((v, i) => Math.max(1, Math.min(100, Math.round(v * 0.65 + state.history.stress7d[i] * 0.35)))), "#ff8c42");
  drawSparkline("sleep-chart", state.history.sleep7d, "#6c63ff");
}

function renderActivities() {
  const list = document.getElementById("activities-list");

  list.innerHTML = state.strava.activities.map(activity => {
    const iconClass =
      activity.type === "Run" ? "run" :
      activity.type === "Ride" ? "ride" : "strength";

    const icon =
      activity.type === "Run" ? "🏃" :
      activity.type === "Ride" ? "🚴" : "🏋️";

    const distanceText =
      activity.distanceKm > 0 ? `${activity.distanceKm.toFixed(1)} km` : "Indoor";

    return `
      <div class="activity-card">
        <div class="activity-icon ${iconClass}">${icon}</div>
        <div style="flex:1;">
          <div class="activity-name">${activity.name}</div>
          <div class="activity-stats">
            <div class="activity-stat">Load: <span>${activity.load}</span></div>
            <div class="activity-stat">Dist: <span>${distanceText}</span></div>
          </div>
        </div>
        <div class="activity-right">
          <div style="font-size:18px;font-weight:700;">${activity.movingTimeMin}</div>
          <div style="font-size:10px;color:var(--muted)">min</div>
        </div>
      </div>
    `;
  }).join("");
}

function renderCalendar() {
  const week = document.getElementById("calendar-week");
  const summary = getWeeklyFocus();

  document.getElementById("calendar-summary-title").textContent = summary.title;
  document.getElementById("calendar-summary-text").textContent = summary.text;

  week.innerHTML = state.planner.week.map(day => `
    <div class="day-card">
      <div class="day-name">${day.day}</div>
      <div class="day-number">${day.number}</div>
      <div class="day-tag">${day.tag}</div>
    </div>
  `).join("");
}

function renderCoachProfile() {
  const sportLabel = state.profile.primarySport === "Run"
    ? "Laufen"
    : state.profile.primarySport === "Ride"
    ? "Radfahren"
    : state.profile.primarySport;

  document.getElementById("coach-profile-line-1").textContent =
    `${sportLabel} · ${state.profile.goal} · ${state.profile.focus}`;
  document.getElementById("coach-profile-line-2").textContent =
    `Erholung ${state.garmin.recovery} · Schlaf ${state.sleep.score} · Tagesbelastung ${calculateDayStrain()}`;
}

function dashboardItems() {
  const strain = calculateDayStrain();

  return [
    { label: "HRV", value: `${state.garmin.hrv} ms`, raw: state.garmin.hrv, sub: `Herzfrequenzvariabilität · ${valueRating("HRV", state.garmin.hrv)}` },
    { label: "Ruhepuls", value: `${state.garmin.restingHr}`, raw: state.garmin.restingHr, sub: `bpm · ${valueRating("Ruhepuls", state.garmin.restingHr)}` },
    { label: "Schritte", value: `${state.garmin.steps}`, raw: state.garmin.steps, sub: "heute" },
    { label: "VO2max", value: `${state.garmin.vo2max}`, raw: state.garmin.vo2max, sub: `${valueRating("VO2max", state.garmin.vo2max)} · ml/kg/min` },
    { label: "Kalorien", value: `${state.garmin.calories}`, raw: state.garmin.calories, sub: "gesamt" },
    { label: "Atemfrequenz", value: `${state.garmin.respiration}`, raw: state.garmin.respiration, sub: "pro Minute" },
    { label: "Durchschn. Puls", value: `${state.garmin.avgHr}`, raw: state.garmin.avgHr, sub: "bpm" },
    { label: "Erholsamer Schlaf", value: `${state.sleep.restorativePercent}%`, raw: state.sleep.restorativePercent, sub: `${state.sleep.restorativeHours} h` },
    { label: "Geschlafen", value: `${state.sleep.hours} h`, raw: state.sleep.hours, sub: "gesamt" },
    { label: "Schlafbedarf", value: `${state.sleep.needHours} h`, raw: state.sleep.needHours, sub: "empfohlen" },
    { label: "Schlafdefizit", value: `${state.sleep.debtHours} h`, raw: state.sleep.debtHours, sub: "offen" },
    { label: "Schlafeffizienz", value: `${state.sleep.efficiency}%`, raw: state.sleep.efficiency, sub: valueRating("Schlafeffizienz", state.sleep.efficiency) },
    { label: "Schlafleistung", value: `${state.sleep.performance}%`, raw: state.sleep.performance, sub: valueRating("Schlafleistung", state.sleep.performance) },
    { label: "Schlafregelmäßigkeit", value: `${state.sleep.consistency}%`, raw: state.sleep.consistency, sub: valueRating("Schlafregelmäßigkeit", state.sleep.consistency) },
    { label: "Zeit im Bett", value: `${state.sleep.timeInBed} h`, raw: state.sleep.timeInBed, sub: "gesamt" },
    { label: "Wachzeit", value: `${state.sleep.awakeTimeMin} min`, raw: state.sleep.awakeTimeMin, sub: "nachts wach" },
    { label: "Deep Sleep", value: `${state.sleep.deepSleepHours} h`, raw: state.sleep.deepSleepHours, sub: "Tiefschlaf" },
    { label: "REM Sleep", value: `${state.sleep.remSleepHours} h`, raw: state.sleep.remSleepHours, sub: "REM" },
    { label: "Leichtschlaf", value: `${state.sleep.lightSleepHours} h`, raw: state.sleep.lightSleepHours, sub: "Leichtschlaf" },
    { label: "Tagesbelastung", value: `${strain}`, raw: strain, sub: valueRating("Tagesbelastung", strain) },
    { label: "Zone 1", value: `${state.heartRateZones.zone1} min`, raw: state.heartRateZones.zone1, sub: "Herzfrequenzzone" },
    { label: "Zone 2", value: `${state.heartRateZones.zone2} min`, raw: state.heartRateZones.zone2, sub: "Herzfrequenzzone" },
    { label: "Zone 3", value: `${state.heartRateZones.zone3} min`, raw: state.heartRateZones.zone3, sub: "Herzfrequenzzone" },
    { label: "Zone 4", value: `${state.heartRateZones.zone4} min`, raw: state.heartRateZones.zone4, sub: "Herzfrequenzzone" },
    { label: "Zone 5", value: `${state.heartRateZones.zone5} min`, raw: state.heartRateZones.zone5, sub: "Herzfrequenzzone" }
  ];
}

function renderDashboard() {
  const grid = document.getElementById("dashboard-grid");
  grid.innerHTML = dashboardItems().map(item => `
    <div class="dashboard-card">
      <div class="dashboard-label">${item.label}</div>
      <div class="dashboard-value">${item.value}</div>
      <div class="dashboard-sub">${item.sub}</div>
    </div>
  `).join("");

  drawComboChart();
}

function useQuickQuestion(question) {
  showCoachScreen();
  document.getElementById("coach-input").value = question;
  askCoach();
}

function showCoachScreen() {
  document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
  document.getElementById("screen-coach").classList.add("active");
  document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("active"));
  document.querySelectorAll(".nav-btn")[2].classList.add("active");
  renderCoachProfile();
}

function addCoachMessage(role, text) {
  const thread = document.getElementById("coach-thread");
  const wrap = document.createElement("div");
  wrap.className = `message message-${role}`;
  wrap.innerHTML = `
    <div class="message-role">${role === "user" ? "Du" : "Coach"}</div>
    <div class="message-bubble">${text}</div>
  `;
  thread.appendChild(wrap);
  thread.scrollTop = thread.scrollHeight;
  window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
}

function buildCoachAnswer(question) {
  const q = question.toLowerCase();
  const rec = getTodayRecommendation();
  const weekly = getWeeklyFocus();

  if (q.includes("heute")) {
    return `Heute empfohlen: ${rec.title}. Begründung: Erholung ${state.garmin.recovery}, Schlaf ${state.sleep.score} und Tagesbelastung ${calculateDayStrain()}.`;
  }

  if (q.includes("wochenplan") || q.includes("woche")) {
    return `${weekly.title}: ${weekly.text}`;
  }

  if (q.includes("intervall")) {
    return state.garmin.recovery >= 70
      ? "Heute wäre ein kontrollierter Intervallreiz möglich, aber nicht maximal hart."
      : "Heute würde ich eher noch keine harten Intervalle setzen.";
  }

  if (q.includes("wie viel") || q.includes("pro woche")) {
    return `Für dein Ziel ${state.profile.goal} mit ${state.profile.availableDays} Trainingstagen pro Woche ist Konstanz wichtiger als einzelne harte Tage.`;
  }

  return `Heute empfohlen: ${rec.title}. Zusätzlich wichtig: Schlaf ${state.sleep.score}, Erholung ${state.garmin.recovery}, Tagesbelastung ${calculateDayStrain()}.`;
}

function askCoach() {
  const input = document.getElementById("coach-input");
  const question = input.value.trim();
  if (!question) return;

  input.value = "";
  addCoachMessage("user", question);
  const answer = buildCoachAnswer(question);
  addCoachMessage("assistant", answer);
}

function formatGermanDate() {
  return new Date().toLocaleDateString("de-DE", {
    weekday: "long",
    day: "numeric",
    month: "long"
  });
}

document.getElementById("current-date").textContent = formatGermanDate();
document.getElementById("sport-select").value = state.profile.primarySport;
document.getElementById("goal-select").value = state.profile.goal;
document.getElementById("focus-select").value = state.profile.focus;
document.getElementById("goal-date-input").value = state.profile.goalDate;
document.getElementById("days-input").value = state.profile.availableDays;

generateWeekPlan();
renderToday();
renderActivities();
renderCalendar();
renderCoachProfile();
renderDashboard();
