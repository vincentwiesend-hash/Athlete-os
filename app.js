const state = {
  user: {
    name: "Vincent"
  },
  profile: {
    primarySport: "Run",
    goal: "Halbmarathon",
    goalDate: "2026-09-21",
    focus: "VO2max verbessern",
    experience: "Fortgeschritten",
    availableDays: 5
  },
  garmin: {
    connected: false,
    readiness: 78,
    hrv: 62,
    sleep: 78,
    bodyBattery: 90,
    stress: 31,
    restingHr: 49,
    vo2max: 56
  },
  strava: {
    connected: false,
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
      },
      {
        id: 3,
        type: "Strength",
        name: "Kraft Oberkörper",
        distanceKm: 0,
        movingTimeMin: 35,
        load: 28
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

  if (name === "coach") {
    renderCoachProfile();
  }
}

function updateProfile() {
  const sport = document.getElementById("sport-select").value;
  const goal = document.getElementById("goal-select").value;
  const focus = document.getElementById("focus-select").value;
  const goalDate = document.getElementById("goal-date-input").value;
  const days = Number(document.getElementById("days-input").value || 5);

  state.profile.primarySport = sport;
  state.profile.goal = goal;
  state.profile.focus = focus;
  state.profile.goalDate = goalDate || state.profile.goalDate;
  state.profile.availableDays = days;

  generateWeekPlan();
  renderToday();
  renderCalendar();
  renderCoachProfile();
}

function calculateLoadToday() {
  return state.strava.activities.reduce((sum, activity) => sum + activity.load, 0);
}

function calculateLoadWeek() {
  return state.strava.activities.reduce((sum, activity) => sum + activity.load, 0);
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

function getSportLabel() {
  const map = {
    Run: "Laufen",
    Ride: "Radfahren",
    Ski: "Ski Skating",
    Mixed: "Mixed"
  };
  return map[state.profile.primarySport] || state.profile.primarySport;
}

function getSportSpecificHint() {
  const goal = state.profile.goal;
  const focus = state.profile.focus;

  if (goal === "Marathon") {
    return "Wichtig sind lange lockere Läufe, Schwellenarbeit und stabile Wochenkilometer.";
  }
  if (goal === "Halbmarathon") {
    return "Wichtig sind Tempodauerlauf, Schwellenarbeit und ein gut verträglicher Long Run.";
  }
  if (goal === "10 km") {
    return "Wichtig sind VO2max-Reize, Schwelle und ökonomisches Laufen bei höherem Tempo.";
  }
  if (goal === "5 km") {
    return "Wichtig sind kurze schnelle Intervalle, Laufökonomie und gute Erholung zwischen harten Tagen.";
  }
  if (goal === "Ski Marathon Skating") {
    return "Wichtig sind lange Ausdauerblöcke, Oberkörperkraft, Schwelle und Technik unter Ermüdung.";
  }
  if (goal === "Radrennen" || goal === "Gran Fondo") {
    return "Wichtig sind hohe Grundlagenausdauer, längere Belastungen knapp unter Schwelle und Fueling im Training.";
  }
  if (focus === "VO2max verbessern") {
    return "Wichtig sind kurze harte Intervalle, aber nur an Tagen mit guter Frische.";
  }
  if (focus === "Grundlagenausdauer verbessern") {
    return "Wichtig sind regelmäßige lockere Einheiten mit kontrollierter Intensität.";
  }
  if (focus === "Schwelle verbessern") {
    return "Wichtig sind kontrollierte längere Belastungen knapp unter oder an der Schwelle.";
  }

  return "Wichtig ist eine gute Balance aus Belastung, Erholung und passender Spezifität.";
}

function getTargetRecommendation() {
  const goal = state.profile.goal;
  const phase = getPhaseByGoal();
  const daysAvailable = state.profile.availableDays;

  if (goal === "Marathon") {
    return {
      title: "5–6 Einheiten pro Woche",
      text: `Für Marathon sind in der Phase ${phase} meist 1 langer Lauf, 1 Qualitätseinheit und mehrere lockere Einheiten sinnvoll. Mit deinen ${daysAvailable} Tagen pro Woche solltest du möglichst konstant trainieren.`
    };
  }

  if (goal === "Halbmarathon") {
    return {
      title: "4–5 Einheiten pro Woche",
      text: `Für Halbmarathon sind in der Phase ${phase} meist 1 Tempoeinheit, 1 längerer Lauf und 2–3 lockere Einheiten sinnvoll. Deine ${daysAvailable} Tage pro Woche passen gut dafür.`
    };
  }

  if (goal === "10 km") {
    return {
      title: "4–5 Einheiten pro Woche",
      text: `Für 10 km sind meist 1 VO2max-Reiz, 1 Schwellenreiz und lockere Umfangstage sinnvoll. Wichtig ist, die harten Tage gut zu vertragen.`
    };
  }

  if (goal === "5 km") {
    return {
      title: "3–5 Einheiten pro Woche",
      text: `Für 5 km zählen Qualität und Erholung besonders. Meist reichen 1–2 harte Reize pro Woche plus lockere Grundlage.`
    };
  }

  if (goal === "Ski Marathon Skating") {
    return {
      title: "4–6 Einheiten pro Woche",
      text: `Für Ski Marathon Skating sind lange Ausdauer, Oberkörperkraft und spezifische Schwellenreize wichtig. Deine Wochenstruktur sollte auch Kraft enthalten.`
    };
  }

  if (goal === "Radrennen" || goal === "Gran Fondo") {
    return {
      title: "4–6 Einheiten pro Woche",
      text: `Für Radrennen oder Gran Fondo sind 1 Qualitätsfahrt, 1 längere Grundlage und mehrere lockere Tage sinnvoll. Konstanz ist wichtiger als einzelne heroische Tage.`
    };
  }

  if (goal === "VO2max verbessern") {
    return {
      title: "3–5 Einheiten pro Woche",
      text: `Für eine bessere VO2max reichen meist 1–2 harte Reize pro Woche plus lockere Einheiten zur Absicherung der Erholung.`
    };
  }

  return {
    title: "3–5 Einheiten pro Woche",
    text: `Für dein aktuelles Ziel ist eine konstante Woche mit 1 Schwerpunktreiz, lockeren Einheiten und guter Erholung sinnvoll.`
  };
}

function getOptionCards() {
  const goal = state.profile.goal;
  const focus = state.profile.focus;
  const readiness = state.garmin.readiness;

  if (readiness < 45) {
    return {
      aTitle: "Recovery",
      aText: "20–30 min sehr locker oder kompletter Ruhetag.",
      bTitle: "Alternative",
      bText: "Mobility, Spaziergang oder leichtes Stabi-Programm."
    };
  }

  if (goal === "Marathon") {
    return {
      aTitle: "Marathon-Reiz",
      aText: "Tempoblock an der Schwelle oder längerer Lauf mit etwas Druck am Ende.",
      bTitle: "Alternative",
      bText: "Lockerer Dauerlauf plus kurze Lauftechnik."
    };
  }

  if (goal === "Halbmarathon") {
    return {
      aTitle: "Schlüsseleinheit",
      aText: "3 x 10 min zügig oder kontrollierter Tempodauerlauf.",
      bTitle: "Alternative",
      bText: "45 min locker + 4 Steigerungen."
    };
  }

  if (goal === "Ski Marathon Skating") {
    return {
      aTitle: "Ski-spezifisch",
      aText: "Längerer Ausdauerblock oder Schwellenarbeit mit Technikfokus.",
      bTitle: "Alternative",
      bText: "Kraft Oberkörper + lockere Ausdauer."
    };
  }

  if (goal === "Radrennen" || goal === "Gran Fondo") {
    return {
      aTitle: "Bike Qualität",
      aText: "Sweet Spot oder Schwellenblock, heute eher kontrolliert als maximal.",
      bTitle: "Alternative",
      bText: "Lockere Grundlage mit hoher Trittfrequenz."
    };
  }

  if (focus === "VO2max verbessern") {
    return {
      aTitle: "VO2max",
      aText: readiness >= 70 ? "5 x 3 min zügig mit lockerer Pause." : "Heute nur kurz anschärfen, nicht voll hart.",
      bTitle: "Alternative",
      bText: "40–50 min locker + 4 kurze Steigerungen."
    };
  }

  return {
    aTitle: "Kontrolliert trainieren",
    aText: "Eine saubere, nicht zu harte Einheit passt heute gut.",
    bTitle: "Alternative",
    bText: "Locker bewegen und morgen neu bewerten."
  };
}

function getTodayRecommendation() {
  const { readiness, sleep, bodyBattery } = state.garmin;
  const load = calculateLoadToday();
  const goal = state.profile.goal;
  const phase = getPhaseByGoal();

  if (readiness < 45 || sleep < 55 || bodyBattery < 35) {
    return {
      title: "Pause oder ganz locker",
      text: `Heute lieber ruhig. Für dein Ziel ${goal} bringt dir Erholung heute mehr als Druck. Maximal sehr locker bewegen.`
    };
  }

  if (readiness >= 70 && load < 60) {
    return {
      title: "Guter Tag für Qualität",
      text: `Du wirkst heute frisch. In der Phase ${phase} passt ein gezielter Reiz gut, wenn er kontrolliert bleibt.`
    };
  }

  return {
    title: "Locker und kontrolliert",
    text: `Heute eher locker. Das passt gut, um für dein Ziel ${goal} stabil zu bleiben und trotzdem etwas mitzunehmen.`
  };
}

function getWeeklyFocus() {
  const goal = state.profile.goal;
  const focus = state.profile.focus;
  const phase = getPhaseByGoal();

  if (goal === "Marathon") {
    return {
      title: "Wochenfokus Marathon",
      text: `1 langer Lauf, 1 Schwellenreiz, 2–3 lockere Tage. Phase: ${phase}.`
    };
  }

  if (goal === "Halbmarathon") {
    return {
      title: "Wochenfokus Halbmarathon",
      text: `1 Tempoeinheit, 1 längerer lockerer Lauf, 2–3 lockere oder regenerative Tage. Phase: ${phase}.`
    };
  }

  if (goal === "Ski Marathon Skating") {
    return {
      title: "Wochenfokus Ski",
      text: `1 Schwellenreiz, 1 längere spezifische Ausdauereinheit, 1 Kraftblock. Phase: ${phase}.`
    };
  }

  if (goal === "Radrennen" || goal === "Gran Fondo") {
    return {
      title: "Wochenfokus Rad",
      text: `1 Qualitätsfahrt, 1 längere Grundlageneinheit, 1 lockere Entlastungseinheit. Phase: ${phase}.`
    };
  }

  return {
    title: `Wochenfokus ${focus}`,
    text: `1 Schwerpunktreiz, 1 längere Einheit, mehrere lockere Tage zur Absicherung der Erholung.`
  };
}

function generateWeekPlan() {
  const goal = state.profile.goal;
  const readiness = state.garmin.readiness;

  if (goal === "Marathon") {
    state.planner.week = [
      { day: "Mo", number: 14, tag: "Locker" },
      { day: "Di", number: 15, tag: "Schwelle" },
      { day: "Mi", number: 16, tag: "Ruhe" },
      { day: "Do", number: 17, tag: "GA1" },
      { day: "Fr", number: 18, tag: "Kraft" },
      { day: "Sa", number: 19, tag: "Long" },
      { day: "So", number: 20, tag: readiness >= 70 ? "Easy" : "Off" }
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

  if (goal === "Ski Marathon Skating") {
    state.planner.week = [
      { day: "Mo", number: 14, tag: "Locker" },
      { day: "Di", number: 15, tag: "Schwelle" },
      { day: "Mi", number: 16, tag: "Kraft" },
      { day: "Do", number: 17, tag: "Technik" },
      { day: "Fr", number: 18, tag: "Ruhe" },
      { day: "Sa", number: 19, tag: "Long" },
      { day: "So", number: 20, tag: "GA1" }
    ];
    return;
  }

  if (goal === "Radrennen" || goal === "Gran Fondo") {
    state.planner.week = [
      { day: "Mo", number: 14, tag: "Easy" },
      { day: "Di", number: 15, tag: "SweetSpot" },
      { day: "Mi", number: 16, tag: "Ruhe" },
      { day: "Do", number: 17, tag: "GA1" },
      { day: "Fr", number: 18, tag: "Kraft" },
      { day: "Sa", number: 19, tag: "LongRide" },
      { day: "So", number: 20, tag: "Locker" }
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
  const loadToday = calculateLoadToday();
  const optionCards = getOptionCards();
  const phase = getPhaseByGoal();
  const days = daysUntilGoal();
  const target = getTargetRecommendation();

  document.getElementById("readiness-score").textContent = state.garmin.readiness;
  document.getElementById("hrv-val").textContent = state.garmin.hrv;
  document.getElementById("sleep-val").textContent = state.garmin.sleep;
  document.getElementById("bb-val").textContent = state.garmin.bodyBattery;
  document.getElementById("load-val").textContent = loadToday;
  document.getElementById("today-title").textContent = recommendation.title;
  document.getElementById("today-text").textContent = recommendation.text;

  document.getElementById("focus-line").textContent = `${state.profile.goal} · ${state.profile.focus}`;
  document.getElementById("phase-line").textContent = `Phase: ${phase} · ${days} Tage bis Ziel`;

  document.getElementById("weekly-target-title").textContent = target.title;
  document.getElementById("weekly-target-text").textContent = target.text;

  document.getElementById("option-a-title").textContent = optionCards.aTitle;
  document.getElementById("option-a-text").textContent = optionCards.aText;
  document.getElementById("option-b-title").textContent = optionCards.bTitle;
  document.getElementById("option-b-text").textContent = optionCards.bText;

  const ring = document.getElementById("recovery-ring");
  const circumference = 597;
  const offset = circumference - (state.garmin.readiness / 100) * circumference;
  ring.style.strokeDashoffset = offset;
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
  const loadWeek = calculateLoadWeek();
  document.getElementById("coach-profile-line-1").textContent =
    `${getSportLabel()} · ${state.profile.goal} · ${state.profile.focus}`;
  document.getElementById("coach-profile-line-2").textContent =
    `Readiness ${state.garmin.readiness} · Schlaf ${state.garmin.sleep} · Load ${loadWeek}`;
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
  const recommendation = getTodayRecommendation();
  const load = calculateLoadToday();
  const phase = getPhaseByGoal();
  const goal = state.profile.goal;
  const focus = state.profile.focus;
  const days = daysUntilGoal();
  const hint = getSportSpecificHint();
  const readiness = state.garmin.readiness;
  const sleep = state.garmin.sleep;
  const bb = state.garmin.bodyBattery;
  const target = getTargetRecommendation();
  const weekly = getWeeklyFocus();

  if (q.includes("wie viel") || q.includes("wochenumfang") || q.includes("pro woche")) {
    return `${target.title}. ${target.text} Zusätzlich gilt aktuell: ${weekly.text}`;
  }

  if (q.includes("heute")) {
    return `Heute empfohlen: ${recommendation.title}. Begründung: Readiness ${readiness}, Schlaf ${sleep}, Body Battery ${bb} und Load ${load}. Für dein Ziel ${goal} in der Phase ${phase} ist heute wichtig: ${hint}`;
  }

  if (q.includes("intervall")) {
    if (readiness >= 70) {
      return `Ja, heute ist ein guter Tag für Intervalle. Für dein Ziel ${goal} würde ich kontrolliert hart trainieren, nicht blind maximal. ${hint}`;
    }
    return `Heute würde ich noch keine harten Intervalle setzen. Deine Frische wirkt dafür nicht stark genug. Besser locker bleiben und morgen neu bewerten.`;
  }

  if (q.includes("pause")) {
    if (readiness < 50 || bb < 40) {
      return `Heute ist Pause oder sehr lockere Bewegung sinnvoll. Das hilft deinem Ziel ${goal} mehr als ein harter Reiz gegen die Müdigkeit.`;
    }
    return `Du brauchst heute nicht zwingend Pause, aber es sollte eher kontrolliert und nicht maximal sein.`;
  }

  if (q.includes("wochenplan") || q.includes("woche")) {
    return `${weekly.title}: ${weekly.text} Zusätzlich gilt für dein Ziel ${goal}: ${hint}`;
  }

  if (q.includes("vo2") || q.includes("vo2max")) {
    return `Für VO2max passen meist 1 bis 2 harte Reize pro Woche. Mehr ist oft nicht besser. Der Rest sollte locker genug sein, damit du die Qualität wirklich verträgst.`;
  }

  if (q.includes("marathon")) {
    return `Für Marathon mit noch ${days} Tagen bis zum Ziel sollte der Fokus aktuell auf ${phase} liegen. ${getTargetRecommendation().text}`;
  }

  if (q.includes("halbmarathon")) {
    return `Für Halbmarathon mit noch ${days} Tagen bis zum Ziel sind Schwelle, Tempodauerlauf und gut verträgliche Umfangstage wichtig. ${getTargetRecommendation().text}`;
  }

  if (q.includes("ski")) {
    return `Für Ski Marathon Skating solltest du lange Ausdauer, Oberkörperkraft und Technik unter Belastung verbinden. ${getTargetRecommendation().text}`;
  }

  if (q.includes("rad") || q.includes("cycling")) {
    return `Für Radrennen oder Gran Fondo zählen stabile Grundlage, Sweet Spot und längere spezifische Belastungen. ${getTargetRecommendation().text}`;
  }

  if (q.includes("3 tage") || q.includes("drei tage")) {
    return `Plan für 3 Tage: Tag 1 ${readiness >= 70 ? "Qualität" : "locker"}, Tag 2 locker oder Kraft, Tag 3 länger und ruhig. So bleibt dein Aufbau für ${goal} stabil und gut verträglich.`;
  }

  return `${target.title}. Ziel: ${goal}. Fokus: ${focus}. Phase: ${phase}. Noch ${days} Tage bis zum Ziel. ${hint}`;
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
