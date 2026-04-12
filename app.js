// State Management
const app = {
  currentScreen: 'today',
  userData: {
    sport: 'Run',
    goal: 'Halbmarathon',
    days: 5,
    goalDate: '2026-09-21'
  },
  metrics: {
    recovery: 78,
    strain: 61,
    sleep: 82,
    sleepHours: 7.8,
    rhr: 49,
    hrv: 62,
    steps: 12480
  }
};

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
  setupNavigation();
  renderToday();
  setupFormHandlers();
  updateDate();
});

// Navigation
function setupNavigation() {
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => {
      const screen = item.dataset.screen;
      switchScreen(screen);
    });
  });
}

function switchScreen(screenName) {
  // Hide all screens
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  
  // Remove active from nav items
  document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
  
  // Show selected screen
  document.getElementById(`screen-${screenName}`).classList.add('active');
  
  // Set active nav item
  document.querySelector(`[data-screen="${screenName}"]`).classList.add('active');
  
  app.currentScreen = screenName;
}

// Today Screen
function renderToday() {
  updateMetricRings();
  updateQuickStats();
}

function updateMetricRings() {
  const metrics = [
    { id: 'recovery', value: app.metrics.recovery },
    { id: 'strain', value: app.metrics.strain },
    { id: 'sleep', value: app.metrics.sleep }
  ];

  metrics.forEach(({ id, value }) => {
    const circle = document.querySelector(`#${id}-ring`);
    if (circle) {
      const circumference = 339.3;
      const offset = circumference - (value / 100) * circumference;
      circle.style.strokeDashoffset = offset;
      
      const statusEl = document.getElementById(`${id}-status`);
      statusEl.textContent = getStatus(value);
    }
  });
}

function getStatus(value) {
  if (value >= 75) return 'Gut';
  if (value >= 50) return 'Moderat';
  return 'Niedrig';
}

function updateQuickStats() {
  document.getElementById('stat-sleep').textContent = `${app.metrics.sleepHours}h`;
  document.getElementById('stat-rhr').textContent = `${app.metrics.rhr}`;
  document.getElementById('stat-hrv').textContent = `${app.metrics.hrv}ms`;
  document.getElementById('stat-steps').textContent = `${(app.metrics.steps / 1000).toFixed(1)}k`;
}

// Form Handlers
function setupFormHandlers() {
  document.getElementById('profile-form')?.addEventListener('change', updateProfile);
}

function updateProfile() {
  app.userData.sport = document.getElementById('sport-select')?.value;
  app.userData.goal = document.getElementById('goal-select')?.value;
  app.userData.days = parseInt(document.getElementById('days-input')?.value) || 5;
  app.userData.goalDate = document.getElementById('goal-date')?.value;
  
  renderToday();
}

// Date Formatting
function updateDate() {
  const date = new Date();
  const options = { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' };
  const formatted = date.toLocaleDateString('de-DE', options);
  document.getElementById('current-date').textContent = formatted;
}

// Utility: Auto-fill form with current data
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

// Call initialization
document.addEventListener('DOMContentLoaded', initializeForm);
