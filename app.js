const state = {
  dashboardRange: "7d",
  dashboardMetric: "HRV",
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
    hrv7d: [54, 56, 58, 55, 59, 61, 62],
    rhr7d: [53, 52, 51, 52, 50, 50, 49],
    vo2max7d: [55, 55, 55, 56, 56, 56, 56],
    steps7d: [10200, 11040, 9700, 12100, 13200, 14080, 12480],
    calories7d: [2500, 2620, 2400, 2760, 2880, 2970, 2860],
    respiration7d: [15.4, 15.1, 15.2, 15.0, 14.9, 14.8, 14.8],
    avgHr7d: [69, 68, 70, 68, 67, 66, 67],
    restorativePercent7d: [33, 35, 37, 34, 38, 39, 40],
    restorativeHours7d: [2.5, 2.7, 2.8, 2.6, 2.9, 3.0, 3.1],
    sleepHours7d: [7.1, 7.3, 7.5, 7.2, 7.6, 7.7, 7.8],
    needHours7d: [8.6, 8.6, 8.5, 8.5, 8.4, 8.4, 8.4],
    debtHours7d: [1.0, 0.9, 0.8, 0.9, 0.7, 0.6, 0.6],
    efficiency7d: [86, 88, 89, 87, 89, 90, 91],
    performance7d: [80, 82, 83, 81, 84, 86, 87],
    consistency7d: [78, 79, 80, 80, 82, 83, 84],
    timeInBed7d: [8.2, 8.3, 8.3, 8.2, 8.4, 8.5, 8.5],
    awakeTimeMin7d: [48, 46, 41, 43, 38, 35, 34],

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

function getTargetStrain() {
  const recovery = state.garmin.recovery;
  const sleep = state.sleep.score;

  if (recovery >= 80 && sleep >= 80) return 74;
  if (recovery >= 65 && sleep >= 75) return 62;
  if (recovery >= 50 && sleep >= 65) return 48;
  return 32;
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
  if (score >= 75) return "gut";
  if (score >= 50) return "moderat";
  return "niedrig";
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

function setRingProgress(circleId, score) {
  const circle = document.getElementById(circleId);
  if (!circle) return;
  const circumference = 364.4;
  const offset = circumference - (score / 100) * circumference;
  circle.style.strokeDashoffset = offset;
}

function polarPosition(score) {
  const angle = (-90 + (score / 100) * 360) * (Math.PI / 180);
  const r = 58;
  const cx = 80;
  const cy = 80;
  return {
    x: cx + r * Math.cos(angle),
    y: cy + r * Math.sin(angle)
  };
}

function placeMarker(id, score) {
  const marker = document.getElementById(id);
  if (!marker) return;
  const pos = polarPosition(score);
  marker.setAttribute("cx", pos.x.toFixed(2));
  marker.setAttribute("cy", pos.y.toFixed(2));
}

function renderToday() {
  const recommendation = getTodayRecommendation();
  const planned = getPlannedSession();
  const options = getOptionCards();
  const recoveryScore = state.garmin.recovery;
  const sleepScore = state.sleep.score;
  const strainScore = calculateDayStrain();
  const activityScore = normalize(calculateActivityLoadToday(), 0, 140);
  const stressScore = Math.round(state.garmin.stress);
  const targetScore = getTargetStrain();

  document.getElementById("recovery-value").textContent = recoveryScore;
  document.getElementById("day-strain-value").textContent = strainScore;
  document.getElementById("sleep-score-value").textContent = sleepScore;

  document.getElementById("recovery-badge").textContent = labelForScore(recoveryScore);
  document.getElementById("strain-badge").textContent = labelForScore(strainScore);
  document.getElementById("sleep-badge").textContent = labelForScore(sleepScore);

  setRingProgress("recovery-ring-progress", recoveryScore);
  setRingProgress("strain-ring-progress", strainScore);
  setRingProgress("sleep-ring-progress", sleepScore);

  placeMarker("strain-marker-activity", activityScore);
  placeMarker("strain-marker-stress", stressScore);
  placeMarker("strain-marker-target", targetScore);

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
    { key: "HRV", label: "HRV", value: `${state.garmin.hrv} ms`, sub: `Herzfrequenzvariabilität · ${valueRating("HRV", state.garmin.hrv)}` },
    { key: "Ruhepuls", label: "Ruhepuls", value: `${state.garmin.restingHr}`, sub: `bpm · ${valueRating("Ruhepuls", state.garmin.restingHr)}` },
    { key: "Schritte", label: "Schritte", value: `${state.garmin.steps}`, sub: "heute" },
    { key: "VO2max", label: "VO2max", value: `${state.garmin.vo2max}`, sub: `${valueRating("VO2max", state.garmin.vo2max)} · ml/kg/min` },
    { key: "Kalorien", label: "Kalorien", value: `${state.garmin.calories}`, sub: "gesamt" },
    { key: "Atemfrequenz", label: "Atemfrequenz", value: `${state.garmin.respiration}`, sub: "pro Minute" },
    { key: "Durchschnittspuls", label: "Durchschn. Puls", value: `${state.garmin.avgHr}`, sub: "bpm" },
    { key: "Erholsamer Schlaf %", label: "Erholsamer Schlaf", value: `${state.sleep.restorativePercent}%`, sub: `${state.sleep.restorativeHours} h` },
    { key: "Geschlafene Stunden", label: "Geschlafen", value: `${state.sleep.hours} h`, sub: "gesamt" },
    { key: "Schlafbedarf", label: "Schlafbedarf", value: `${state.sleep.needHours} h`, sub: "empfohlen" },
    { key: "Schlafdefizit", label: "Schlafdefizit", value: `${state.sleep.debtHours} h`, sub: "offen" },
    { key: "Schlafeffizienz", label: "Schlafeffizienz", value: `${state.sleep.efficiency}%`, sub: valueRating("Schlafeffizienz", state.sleep.efficiency) },
    { key: "Schlafleistung", label: "Schlafleistung", value: `${state.sleep.performance}%`, sub: valueRating("Schlafleistung", state.sleep.performance) },
    { key: "Schlafregelmäßigkeit", label: "Schlafregelmäßigkeit", value: `${state.sleep.consistency}%`, sub: valueRating("Schlafregelmäßigkeit", state.sleep.consistency) },
    { key: "Zeit im Bett", label: "Zeit im Bett", value: `${state.sleep.timeInBed} h`, sub: "gesamt" },
    { key: "Wachzeit", label: "Wachzeit", value: `${state.sleep.awakeTimeMin} min`, sub: "nachts wach" },
    { key: "Deep Sleep", label: "Deep Sleep", value: `${state.sleep.deepSleepHours} h`, sub: "Tiefschlaf" },
    { key: "REM Sleep", label: "REM Sleep", value: `${state.sleep.remSleepHours} h`, sub: "REM" },
    { key: "Leichtschlaf", label: "Leichtschlaf", value: `${state.sleep.lightSleepHours} h`, sub: "Leichtschlaf" },
    { key: "Tagesbelastung", label: "Tagesbelastung", value: `${strain}`, sub: valueRating("Tagesbelastung", strain) },
    { key: "Zone 1", label: "Zone 1", value: `${state.heartRateZones.zone1} min`, sub: "Herzfrequenzzone" },
    { key: "Zone 2", label: "Zone 2", value: `${state.heartRateZones.zone2} min`, sub: "Herzfrequenzzone" },
    { key: "Zone 3", label: "Zone 3", value: `${state.heartRateZones.zone3} min`, sub: "Herzfrequenzzone" },
    { key: "Zone 4", label: "Zone 4", value: `${state.heartRateZones.zone4} min`, sub: "Herzfrequenzzone" },
    { key: "Zone 5", label: "Zone 5", value: `${state.heartRateZones.zone5} min`, sub: "Herzfrequenzzone" }
  ];
}

function metricSeries(metric, range) {
  const suffix = range === "7d" ? "7d" : range === "1m" ? "1m" : range === "6m" ? "6m" : "12m";

  const map = {
    "HRV": state.history[`hrv${suffix}`],
    "Ruhepuls": state.history[`rhr${suffix}`],
    "VO2max": state.history[`vo2max${suffix}`],
    "Schritte": state.history[`steps${suffix}`],
    "Kalorien": state.history[`calories${suffix}`],
    "Atemfrequenz": state.history[`respiration${suffix}`],
    "Durchschnittspuls": state.history[`avgHr${suffix}`],
    "Erholsamer Schlaf %": state.history[`restorativePercent${suffix}`],
    "Geschlafene Stunden": state.history[`sleepHours${suffix}`],
    "Schlafbedarf": state.history[`needHours${suffix}`],
    "Schlafdefizit": state.history[`debtHours${suffix}`],
    "Schlafeffizienz": state.history[`efficiency${suffix}`],
    "Schlafleistung": state.history[`performance${suffix}`],
    "Schlafregelmäßigkeit": state.history[`consistency${suffix}`],
    "Zeit im Bett": state.history[`timeInBed${suffix}`],
    "Wachzeit": state.history[`awakeTimeMin${suffix}`],
    "Tagesbelastung": state.history[`activity${suffix}`].map((v, i) => Math.max(1, Math.min(100, Math.round(v * 0.65 + state.history[`stress${suffix}`][i] * 0.35))))
  };

  return map[metric] || [10, 20, 30, 25, 35, 40, 38];
}

function drawDetailChart(values) {
  const svg = document.getElementById("dashboard-detail-chart");
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

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`;

  const gridLines = [0.25, 0.5, 0.75].map(f => {
    const y = padding + (height - padding * 2) * f;
    return `<line x1="${padding}" y1="${y}" x2="${width - padding}" y2="${y}" stroke="rgba(255,255,255,0.08)" stroke-width="1"></line>`;
  }).join("");

  svg.innerHTML = `
    <defs>
      <linearGradient id="detail-fill" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#6c63ff" stop-opacity="0.28"></stop>
        <stop offset="100%" stop-color="#6c63ff" stop-opacity="0"></stop>
      </linearGradient>
    </defs>
    ${gridLines}
    <path d="${areaPath}" fill="url(#detail-fill)"></path>
    <path d="${linePath}" fill="none" stroke="#6c63ff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"></path>
    ${points.map(p => `<circle cx="${p.x}" cy="${p.y}" r="2.5" fill="#6c63ff"></circle>`).join("")}
  `;
}

function openDashboardDetail(metric) {
  state.dashboardMetric = metric;
  document.getElementById("dashboard-detail-card").classList.remove("hidden");
  document.getElementById("dashboard-detail-title").textContent = metric;
  document.getElementById("dashboard-detail-sub").textContent = `Trend über ${state.dashboardRange.toUpperCase()}`;
  drawDetailChart(metricSeries(metric, state.dashboardRange));
}

function closeDashboardDetail() {
  document.getElementById("dashboard-detail-card").classList.add("hidden");
}

function setDashboardRange(range, btn) {
  state.dashboardRange = range;
  document.querySelectorAll(".range-tab").forEach(tab => tab.classList.remove("active"));
  btn.classList.add("active");
  openDashboardDetail(state.dashboardMetric);
}

function renderDashboard() {
  const list = document.getElementById("dashboard-list");
  list.innerHTML = dashboardItems().map(item => `
    <div class="dashboard-row" onclick="openDashboardDetail('${item.key.replace(/'/g, "\\'")}')">
      <div>
        <div class="dashboard-row-label">${item.label}</div>
        <div class="dashboard-row-sub">${item.sub}</div>
      </div>
      <div class="dashboard-row-right">
        <div class="dashboard-row-value">${item.value}</div>
      </div>
    </div>
  `).join("");
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
