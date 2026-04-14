# Athlete OS

Trainings- und Coaching-App mit Garmin/Strava-Anbindung und AI-Coach Vincent.

## Tech Stack
- **Frontend**: React 18, React Router, Axios, Lucide Icons, Recharts
- **Backend**: Python FastAPI, MongoDB (Motor async)
- **AI**: Gemini 2.5 Flash (via Emergent LLM Key oder eigener Google API Key)
- **Integrationen**: Strava OAuth, Garmin Connect, ICS Kalender-Export

## Projektstruktur
```
athlete-os/
├── backend/
│   ├── server.py          # FastAPI Server (alle Endpoints)
│   ├── requirements.txt   # Python Dependencies
│   └── .env               # Backend Umgebungsvariablen
├── frontend/
│   ├── package.json       # Node Dependencies
│   ├── .env               # Frontend Umgebungsvariablen
│   ├── public/
│   │   └── index.html
│   └── src/
│       ├── index.js       # React Entry
│       ├── index.css      # Globale Styles
│       ├── App.js         # Routing
│       ├── App.css        # App Styles
│       ├── contexts/
│       │   └── AuthContext.js
│       ├── utils/
│       │   └── api.js
│       ├── components/
│       │   ├── Layout.js
│       │   └── MetricRing.js
│       └── pages/
│           ├── LoginPage.js
│           ├── TodayPage.js
│           ├── ActivitiesPage.js
│           ├── CoachPage.js
│           ├── CalendarPage.js
│           ├── StatsPage.js
│           └── SettingsPage.js
└── README.md
```

## Lokales Setup

### 1. MongoDB installieren und starten
```bash
# macOS
brew install mongodb-community
brew services start mongodb-community

# Ubuntu
sudo apt install mongodb
sudo systemctl start mongod

# Docker
docker run -d -p 27017:27017 --name mongo mongo:7
```

### 2. Backend starten
```bash
cd backend

# Virtual Environment (empfohlen)
python3 -m venv venv
source venv/bin/activate  # macOS/Linux
# venv\Scripts\activate   # Windows

# Dependencies installieren
pip install -r requirements.txt

# .env anlegen (siehe .env.example unten)
cp .env.example .env
# Werte in .env anpassen!

# Server starten
uvicorn server:app --host 0.0.0.0 --port 8001 --reload
```

### 3. Frontend starten
```bash
cd frontend

# Dependencies installieren
yarn install
# oder: npm install

# .env anlegen
cp .env.example .env

# Dev Server starten
yarn start
# oder: npm start
```

App oeffnet sich unter http://localhost:3000

### 4. Erster Login
Nach dem Start wird automatisch ein Admin-User erstellt:
- **E-Mail**: admin@athleteos.com (oder was in ADMIN_EMAIL steht)
- **Passwort**: AthleteOS2026! (oder was in ADMIN_PASSWORD steht)

## Environment Variables

### backend/.env
```env
MONGO_URL=mongodb://localhost:27017
DB_NAME=athlete_os
JWT_SECRET=dein-geheimer-jwt-schluessel-mindestens-32-zeichen-lang
ADMIN_EMAIL=admin@athleteos.com
ADMIN_PASSWORD=AthleteOS2026!
EMERGENT_LLM_KEY=dein-emergent-key
STRAVA_CLIENT_ID=deine-strava-client-id
STRAVA_CLIENT_SECRET=dein-strava-client-secret
STRAVA_REDIRECT_URI=http://localhost:8001/api/strava/callback
FRONTEND_URL=http://localhost:3000
```

### frontend/.env
```env
REACT_APP_BACKEND_URL=http://localhost:8001
```

## Strava einrichten
1. Gehe zu https://www.strava.com/settings/api
2. Erstelle eine neue App
3. Trage `localhost` als Authorization Callback Domain ein
4. Kopiere Client ID und Client Secret in die backend/.env

## Garmin verbinden
1. In der App unter Setup > Integrationen > Garmin > Verbinden
2. Deine normalen Garmin Connect Login-Daten eingeben
3. Die App zieht dann HRV, Schlaf, Stress, Body Battery etc.

## AI-Coach Vincent
Nutzt Gemini 2.5 Flash. Du brauchst einen Emergent LLM Key oder eigenen Google AI Key.
- Emergent Key: In der App unter Profile > Universal Key
- Eigener Key: GEMINI_API_KEY in .env setzen

## Features
- 3 Metriken-Ringe (Erholung, Belastung, Schlaf)
- 12 Garmin-Datenkacheln mit Vergleich zu gestern
- KI-Morgenreport
- Schlafphasen-Analyse
- Trainingsbereitschafts-Score
- AI-Coach Vincent mit Gedaechtnis
- Interaktiver Wochenplaner (editierbar pro Tag)
- Coach-Vorschlaege direkt in Kalender uebernehmen
- ICS-Export fuer iCloud/Google Kalender
- Workout-Push an Garmin-Uhr
- Athletik-Profil mit Bestzeiten (VDOT)
- Wissenschaftliche Formeln transparent dargestellt
