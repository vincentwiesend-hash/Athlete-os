const state = {
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

function calculateDayStrain() {
  const activityLoad = calculateActivityLoadToday();
  const stressLoad = Math.round(state.garmin.stress * 0.6);
  return activityLoad + stressLoad;
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

function renderToday() {
  const recommendation = getTodayRecommendation();
  const planned = getPlannedSession();
  const options = getOptionCards();

  document.getElementById("recovery-value").textContent = state.garmin.recovery;
  document.getElementById("day-strain-value").textContent = calculateDayStrain();
  document.getElementById("sleep-score-value").textContent = state.sleep.score;

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
  document.getElementById("coach-profile-line-1").textContent =
    `${state.profile.primarySport === "Run" ? "Laufen" : state.profile.primarySport} · ${state.profile.goal} · ${state.profile.focus}`;
  document.getElementById("coach-profile-line-2").textContent =
    `Erholung ${state.garmin.recovery} · Schlaf ${state.sleep.score} · Tagesbelastung ${calculateDayStrain()}`;
}

function dashboardItems() {
  return [
    { label: "HRV", value: `${state.garmin.hrv} ms`, sub: "Herzfrequenzvariabilität" },
    { label: "Ruhepuls", value: `${state.garmin.restingHr}`, sub: "bpm" },
    { label: "Schritte", value: `${state.garmin.steps}`, sub: "heute" },
    { label: "VO2max", value: `${state.garmin.vo2max}`, sub: "ml/kg/min" },
    { label: "Kalorien", value: `${state.garmin.calories}`, sub: "gesamt" },
    { label: "Atemfrequenz", value: `${state.garmin.respiration}`, sub: "pro Minute" },
    { label: "Durchschn. Puls", value: `${state.garmin.avgHr}`, sub: "bpm" },
    { label: "Erholsamer Schlaf", value: `${state.sleep.restorativePercent}%`, sub: `${state.sleep.restorativeHours} h` },
    { label: "Geschlafen", value: `${state.sleep.hours} h`, sub: "gesamt" },
    { label: "Schlafbedarf", value: `${state.sleep.needHours} h`, sub: "empfohlen" },
    { label: "Schlafdefizit", value: `${state.sleep.debtHours} h`, sub: "offen" },
    { label: "Schlafeffizienz", value: `${state.sleep.efficiency}%`, sub: "Effizienz" },
    { label: "Schlafleistung", value: `${state.sleep.performance}%`, sub: "Performance" },
    { label: "Schlafregelmäßigkeit", value: `${state.sleep.consistency}%`, sub: "Regelmäßigkeit" },
    { label: "Zeit im Bett", value: `${state.sleep.timeInBed} h`, sub: "gesamt" },
    { label: "Wachzeit", value: `${state.sleep.awakeTimeMin} min`, sub: "nachts wach" },
    { label: "Deep Sleep", value: `${state.sleep.deepSleepHours} h`, sub: "Tiefschlaf" },
    { label: "REM Sleep", value: `${state.sleep.remSleepHours} h`, sub: "REM" },
    { label: "Leichtschlaf", value: `${state.sleep.lightSleepHours} h`, sub: "Leichtschlaf" },
    { label: "Tagesbelastung", value: `${calculateDayStrain()}`, sub: "Aktivität + Stress" },
    { label: "Zone 1", value: `${state.heartRateZones.zone1} min`, sub: "Herzfrequenzzone" },
    { label: "Zone 2", value: `${state.heartRateZones.zone2} min`, sub: "Herzfrequenzzone" },
    { label: "Zone 3", value: `${state.heartRateZones.zone3} min`, sub: "Herzfrequenzzone" },
    { label: "Zone 4", value: `${state.heartRateZones.zone4} min`, sub: "Herzfrequenzzone" },
    { label: "Zone 5", value: `${state.heartRateZones.zone5} min`, sub: "Herzfrequenzzone" }
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
  const history = document.getElementById("coach-history");
  const card = document.createElement("div");
  card.className = "ai-card";
  const answer = buildCoachAnswer(question);
  card.innerHTML = `<div class="ai-message">${answer}</div>`;
  history.prepend(card);
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
