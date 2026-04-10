const state = {
  recovery: {
    readiness: 78,
    hrv: 62,
    sleep: 78,
    bodyBattery: 90,
    stress: 31
  },
  training: {
    activities: [
      {
        type: "Run",
        name: "Locker Dauerlauf",
        distanceKm: 8.4,
        movingTimeMin: 46,
        load: 42
      },
      {
        type: "Ride",
        name: "GA1 Ausfahrt",
        distanceKm: 36.2,
        movingTimeMin: 92,
        load: 58
      },
      {
        type: "Strength",
        name: "Kraft Oberkörper",
        distanceKm: 0,
        movingTimeMin: 35,
        load: 28
      }
    ]
  }
};

function showScreen(name, btn) {
  document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
  document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("active"));

  document.getElementById("screen-" + name).classList.add("active");
  btn.classList.add("active");
}

function calculateLoadToday() {
  return state.training.activities.reduce((sum, activity) => sum + activity.load, 0);
}

function getTodayRecommendation() {
  const { readiness, sleep, bodyBattery } = state.recovery;
  const load = calculateLoadToday();

  if (readiness < 45 || sleep < 55 || bodyBattery < 35) {
    return {
      title: "Pause oder ganz locker",
      text: "Heute lieber kurz und ruhig. Dein Körper wirkt nicht ideal bereit für harte Reize."
    };
  }

  if (readiness >= 70 && load < 60) {
    return {
      title: "Qualität möglich",
      text: "Du wirkst heute recht frisch. Eine zügige oder strukturierte Einheit passt gut."
    };
  }

  return {
    title: "45–60 min locker",
    text: "Schlaf okay, Belastung moderat. Heute passt eine lockere Einheit besser als voll hart."
  };
}

function renderToday() {
  const recommendation = getTodayRecommendation();
  const loadToday = calculateLoadToday();

  document.getElementById("readiness-score").textContent = state.recovery.readiness;
  document.getElementById("hrv-val").textContent = state.recovery.hrv;
  document.getElementById("sleep-val").textContent = state.recovery.sleep;
  document.getElementById("bb-val").textContent = state.recovery.bodyBattery;
  document.getElementById("load-val").textContent = loadToday;
  document.getElementById("today-title").textContent = recommendation.title;
  document.getElementById("today-text").textContent = recommendation.text;

  const ring = document.getElementById("recovery-ring");
  const circumference = 597;
  const offset = circumference - (state.recovery.readiness / 100) * circumference;
  ring.style.strokeDashoffset = offset;
}

function renderActivities() {
  const list = document.getElementById("activities-list");

  list.innerHTML = state.training.activities.map(activity => {
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
  const days = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];
  const tags = ["Locker", "Intervalle", "Ruhe", "GA1", "Kraft", "Long", "Off"];

  week.innerHTML = days.map((day, index) => `
    <div class="day-card">
      <div class="day-name">${day}</div>
      <div class="day-number">${14 + index}</div>
      <div class="day-tag">${tags[index]}</div>
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

function askCoach() {
  const input = document.getElementById("coach-input");
  const question = input.value.trim();
  if (!question) return;

  input.value = "";

  const history = document.getElementById("coach-history");
  const card = document.createElement("div");
  card.className = "ai-card";

  const recommendation = getTodayRecommendation();
  const load = calculateLoadToday();

  let answer = "";

  if (question.toLowerCase().includes("intervall")) {
    answer = state.recovery.readiness >= 70
      ? "Heute empfohlen: Intervalle sind möglich. Warum: Deine Readiness ist gut und die Last ist nicht zu hoch. Alternative: zügiger Tempodauerlauf."
      : "Heute empfohlen: Noch keine Intervalle. Warum: Deine Erholung wirkt nicht stark genug für sehr hart. Alternative: 40 bis 50 Minuten locker.";
  } else if (question.toLowerCase().includes("pause")) {
    answer = state.recovery.readiness < 50
      ? "Heute empfohlen: Pause oder Recovery. Warum: Deine Erholung ist eher niedrig. Alternative: 20 bis 30 Minuten lockere Bewegung."
      : "Heute empfohlen: Keine volle Pause nötig. Warum: Du bist noch ausreichend belastbar. Alternative: eine sehr lockere Einheit.";
  } else if (question.toLowerCase().includes("3 tage")) {
    answer = "Heute locker, morgen etwas Qualität, danach wieder ruhiger. So bleibt die Belastung besser verteilt.";
  } else {
    answer = `Heute empfohlen: ${recommendation.title}. Warum: Readiness ${state.recovery.readiness}, Schlaf ${state.recovery.sleep}, Body Battery ${state.recovery.bodyBattery}, Load ${load}. Alternative: 20 bis 30 Minuten locker oder Mobility.`;
  }

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
renderToday();
renderActivities();
renderCalendar();
