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
    availableDays: 5,
    availableMinutesToday: 60
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
    week: [
      { day: "Mo", number: 14, tag: "Locker" },
      { day: "Di", number: 15, tag: "Intervalle" },
      { day: "Mi", number: 16, tag: "Ruhe" },
      { day: "Do", number: 17, tag: "GA1" },
      { day: "Fr", number: 18, tag: "Kraft" },
      { day: "Sa", number: 19, tag: "Long" },
      { day: "So", number: 20, tag: "Off" }
    ]
  }
};

function showScreen(name, btn) {
  document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
  document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("active"));
  document.getElementById("screen-" + name).classList.add("active");
  btn.classList.add("active");
}

function updateProfile() {
  const sport = document.getElementById("sport-select").value;
  const goal = document.getElementById("goal-select").value;
  const focus = document.getElementById("focus-select").value;
  const goalDate = document.getElementById("goal-date-input").value;
  const minutes = Number(document.getElementById("minutes-input").value || 60);

  state.profile.primarySport = sport;
  state.profile.goal = goal;
  state.profile.focus = focus;
  state.profile.goalDate = goalDate || state.profile.goalDate;
  state.profile.availableMinutesToday = minutes;

  renderToday();
}

function calculateLoadToday() {
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

  return "Wichtig ist eine gute Balance aus Belastung, Erholung und passender Spezifität.";
}

function getTodayRecommendation() {
  const { readiness, sleep, bodyBattery } = state.garmin;
  const load = calculateLoadToday();
  const goal = state.profile.goal;
  const focus = state.profile.focus;
  const minutes = state.profile.availableMinutesToday;
  const phase = getPhaseByGoal();

  if (readiness < 45 || sleep < 55 || bodyBattery < 35) {
    return {
      title: "Pause oder ganz locker",
      text: `Heute lieber ruhig. Für dein Ziel ${goal} bringt dir Erholung heute mehr als Druck. ${minutes >= 30 ? "Maximal 20–30 Minuten sehr locker." : "Am besten Pause."}`
    };
  }

  if (readiness >= 70 && load < 60) {
    if (focus === "VO2max verbessern") {
      return {
        title: "VO2max-Einheit möglich",
        text: `Du wirkst heute frisch. In der ${phase}-Phase passt eine kurze harte Einheit gut, zum Beispiel 5 x 3 Minuten zügig mit lockerer Pause.`
      };
    }

    if (goal === "Marathon") {
      return {
        title: "Marathon-spezifisch trainieren",
        text: "Heute passt entweder ein Tempoblock an der Schwelle oder ein längerer lockerer Lauf mit Endbeschleunigung."
      };
    }

    if (goal === "Halbmarathon") {
      return {
        title: "Schwelle oder zügiger Dauerlauf",
        text: "Heute passt ein kontrollierter Temporeiz gut, zum Beispiel 3 x 10 Minuten zügig, aber nicht all-out."
      };
    }

    if (goal === "Ski Marathon Skating") {
      return {
        title: "Spezifische Ausdauer oder Kraft",
        text: "Heute passt eine längere Ausdauereinheit oder eine Kombination aus Ski-spezifischer Kraft und Intervallen."
      };
    }

    if (goal === "Radrennen" || goal === "Gran Fondo") {
      return {
        title: "Qualität auf dem Rad",
        text: "Heute passt Sweet Spot, Schwelle oder ein längerer Ausdauerblock mit Druck auf dem Pedal."
      };
    }

    return {
      title: "Qualität möglich",
      text: "Du wirkst heute recht frisch. Eine strukturierte Einheit passt gut."
    };
  }

  return {
    title: "Locker und kontrolliert",
    text: `Heute eher locker. Das passt gut, um für dein Ziel ${goal} stabil zu bleiben und trotzdem etwas mitzunehmen.`
  };
}

function renderToday() {
  const recommendation = getTodayRecommendation();
  const loadToday = calculateLoadToday();

  document.getElementById("readiness-score").textContent = state.garmin.readiness;
  document.getElementById("hrv-val").textContent = state.garmin.hrv;
  document.getElementById("sleep-val").textContent = state.garmin.sleep;
  document.getElementById("bb-val").textContent = state.garmin.bodyBattery;
  document.getElementById("load-val").textContent = loadToday;
  document.getElementById("today-title").textContent = recommendation.title;
  document.getElementById("today-text").textContent = recommendation.text;

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

  week.innerHTML = state.planner.week.map(day => `
    <div class="day-card">
      <div class="day-name">${day.day}</div>
      <div class="day-number">${day.number}</div>
      <div class="day-tag">${day.tag}</div>
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
  const minutes = state.profile.availableMinutesToday;

  if (q.includes("heute")) {
    return `Heute empfohlen: ${recommendation.title}. Warum: Readiness ${state.garmin.readiness}, Schlaf ${state.garmin.sleep}, Body Battery ${state.garmin.bodyBattery} und Load ${load}. Für dein Ziel ${goal} in der Phase ${phase} gilt: ${hint}`;
  }

  if (q.includes("intervall")) {
    if (state.garmin.readiness >= 70) {
      return `Ja, Intervalle sind heute möglich. Für dein Ziel ${goal} würde ich heute eher kontrolliert hart statt maximal hart trainieren. Achte darauf, dass die Einheit in deine verfügbaren ${minutes} Minuten passt. ${hint}`;
    }
    return `Heute noch keine harten Intervalle. Deine Frische wirkt dafür nicht ideal. Besser locker trainieren und morgen neu schauen.`;
  }

  if (q.includes("pause")) {
    if (state.garmin.readiness < 50) {
      return `Heute ist Pause oder sehr lockere Bewegung sinnvoll. Das hilft deinem Ziel ${goal} mehr als ein erzwungener harter Reiz.`;
    }
    return `Du brauchst heute nicht zwingend Pause, aber es sollte eher kontrolliert bleiben.`;
  }

  if (q.includes("vo2") || q.includes("vo2max")) {
    return `Für VO2max passen 1 bis 2 harte Einheiten pro Woche, aber nur bei guter Frische. Heute würde ich auf Basis deiner Daten ${state.garmin.readiness >= 70 ? "eine kurze harte Einheit erlauben" : "noch locker bleiben"}.`;
  }

  if (q.includes("marathon")) {
    return `Für Marathon mit noch ${days} Tagen bis zum Ziel sollte der Fokus aktuell auf ${phase} liegen. Wichtig sind Long Run, Schwelle und verträgliche Wochenumfänge. ${recommendation.text}`;
  }

  if (q.includes("halbmarathon")) {
    return `Für Halbmarathon mit noch ${days} Tagen bis zum Ziel sind Schwelle, Tempodauerlauf und spezifische lockere Kilometer wichtig. ${recommendation.text}`;
  }

  if (q.includes("ski")) {
    return `Für Ski Marathon Skating solltest du lange Ausdauer, Oberkörperkraft und Technik unter Belastung kombinieren. Heute gilt: ${recommendation.text}`;
  }

  if (q.includes("rad") || q.includes("cycling")) {
    return `Für Radfahren zählen stabile Grundlage, Sweet Spot und längere spezifische Belastungen. Heute gilt: ${recommendation.text}`;
  }

  if (q.includes("3 tage") || q.includes("drei tage")) {
    return `Plan für 3 Tage: Tag 1 ${state.garmin.readiness >= 70 ? "Qualität" : "locker"}, Tag 2 locker oder Kraft, Tag 3 je nach Frische länger und ruhig. So bleibt dein Aufbau für ${goal} stabil.`;
  }

  if (q.includes("woche") || q.includes("wochenplan")) {
    return `Für dein Ziel ${goal} würde ich diese Woche 1 Qualitätsreiz, 1 längere Einheit, 1 Kraftblock und 2 lockere Einheiten planen. Schwerpunkt: ${focus}.`;
  }

  return `Heute empfohlen: ${recommendation.title}. Ziel: ${goal}. Fokus: ${focus}. Phase: ${phase}. Noch ${days} Tage bis zum Ziel. ${hint}`;
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
document.getElementById("minutes-input").value = state.profile.availableMinutesToday;

renderToday();
renderActivities();
renderCalendar();
