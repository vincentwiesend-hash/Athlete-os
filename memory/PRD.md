# Athlete OS - PRD

## Original Problem Statement
Professionelle Trainings- und Coaching-App mit Garmin/Strava/iCloud-Kalender-Anbindung, AI-Coach "Vincent", Trainingskalender und produktionsreifer UX. Migration von Vanilla JS + Node.js Express zu React + FastAPI.

## Architecture
- **Frontend**: React 18, React Router, Axios, Lucide React Icons, Recharts
- **Backend**: FastAPI (Python), MongoDB (Motor async), emergentintegrations (Gemini 2.5 Flash)
- **Auth**: JWT with httpOnly cookies, bcrypt password hashing
- **AI**: Gemini 2.5 Flash via Emergent LLM Key for Coach Vincent + Morning Report + Calendar Plans
- **Integrations**: Strava OAuth (connected), Garmin (prepared), ICS Calendar Export

## User Persona
- Vincent Wiesend, Muenchen, Laeufer (Halbmarathon-Ziel), Strava Premium, Garmin-Nutzer

## Core Requirements
- [x] 3 Metrik-Ringe nebeneinander (Erholung, Belastung, Schlaf)
- [x] Alle Garmin-Rohdaten als bunte Kacheln mit Vergleich zu gestern
- [x] KI-Morgenreport von Vincent
- [x] Schlafphasen-Aufschluesselung
- [x] Trainingsbereitschaft-Balken
- [x] Wissenschaftliche Formeln (Plews, Edwards TRIMP, VDOT) - nur fuer berechnete Werte
- [x] Athletik-Profil mit Bestzeiten (5k/10k/HM/Marathon), Koerperdaten
- [x] Formel-Transparenz in Settings
- [x] Coach Vincent mit Gedaechtnis
- [x] Trainingskalender mit AI-Generierung + ICS-Export
- [x] Strava vollstaendig integriert
- [x] Garmin vorbereitet
- [x] Changelog + Versionsanzeige
- [x] JWT Auth mit Login/Register

## What's Been Implemented (2026-04-14)
- Full React frontend with 6 screens (Today, Training, Coach, Calendar, Stats, Settings)
- FastAPI backend with 20+ endpoints
- Strava OAuth connected with Vincent's tokens
- AI Coach Vincent (Gemini 2.5 Flash) with memory
- Morning Report AI generation
- Weekly training plan AI generation + ICS export
- Scientific formulas for Recovery, Strain, Readiness (literature-based)
- Athletic profile with race times, body metrics
- Formula transparency page
- 12 colorful Garmin metric tiles with delta comparison
- Sleep phase breakdown visualization
- Changelog with 3 versions

## Backlog
- P0: Garmin Connect API integration (needs credentials)
- P0: Garmin watch workout push
- P1: Real Garmin data sync (currently demo metrics)
- P1: Training plan editing (individual days)
- P2: iCloud CalDAV real-time sync
- P2: Dark/Light mode toggle
- P2: Push notifications
- P3: Social features / Training groups

## Next Tasks
1. Garmin API credentials einrichten und Integration aktivieren
2. Echte Garmin-Daten statt Demo-Metriken verwenden
3. Trainingsplan-Tage einzeln bearbeitbar machen
4. Coach-Antworten direkt in Kalender uebernehmen
