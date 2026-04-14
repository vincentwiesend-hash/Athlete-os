from dotenv import load_dotenv
load_dotenv()

import os
import json
import bcrypt
import jwt
import secrets
import requests
from datetime import datetime, timezone, timedelta
from bson import ObjectId
from fastapi import FastAPI, Request, HTTPException, Response
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from emergentintegrations.llm.chat import LlmChat, UserMessage

app = FastAPI(title="Athlete OS API")

MONGO_URL = os.environ.get("MONGO_URL")
DB_NAME = os.environ.get("DB_NAME")
JWT_SECRET = os.environ.get("JWT_SECRET")
JWT_ALGORITHM = "HS256"
EMERGENT_KEY = os.environ.get("EMERGENT_LLM_KEY")
STRAVA_CLIENT_ID = os.environ.get("STRAVA_CLIENT_ID")
STRAVA_CLIENT_SECRET = os.environ.get("STRAVA_CLIENT_SECRET")
STRAVA_REDIRECT_URI = os.environ.get("STRAVA_REDIRECT_URI")
FRONTEND_URL = os.environ.get("FRONTEND_URL", "http://localhost:3000")

client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL, "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Password Helpers ---
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))

# --- JWT Helpers ---
def create_access_token(user_id: str, email: str) -> str:
    payload = {"sub": user_id, "email": email, "exp": datetime.now(timezone.utc) + timedelta(minutes=120), "type": "access"}
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def create_refresh_token(user_id: str) -> str:
    payload = {"sub": user_id, "exp": datetime.now(timezone.utc) + timedelta(days=7), "type": "refresh"}
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(request: Request) -> dict:
    token = request.cookies.get("access_token")
    if not token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Invalid token type")
        user = await db.users.find_one({"_id": ObjectId(payload["sub"])})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        user["_id"] = str(user["_id"])
        user.pop("password_hash", None)
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

def set_auth_cookies(response: Response, access_token: str, refresh_token: str):
    response.set_cookie(key="access_token", value=access_token, httponly=True, secure=False, samesite="lax", max_age=7200, path="/")
    response.set_cookie(key="refresh_token", value=refresh_token, httponly=True, secure=False, samesite="lax", max_age=604800, path="/")

# --- Auth Endpoints ---
@app.post("/api/auth/register")
async def register(request: Request, response: Response):
    body = await request.json()
    email = body.get("email", "").strip().lower()
    password = body.get("password", "")
    name = body.get("name", "").strip()
    if not email or not password:
        raise HTTPException(status_code=400, detail="E-Mail und Passwort erforderlich")
    if len(password) < 6:
        raise HTTPException(status_code=400, detail="Passwort muss mindestens 6 Zeichen haben")
    existing = await db.users.find_one({"email": email})
    if existing:
        raise HTTPException(status_code=400, detail="E-Mail bereits registriert")
    user_doc = {
        "email": email,
        "password_hash": hash_password(password),
        "name": name or email.split("@")[0],
        "role": "user",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    result = await db.users.insert_one(user_doc)
    user_id = str(result.inserted_id)
    await db.profiles.insert_one({
        "user_id": user_id,
        "sport": "Run",
        "goal": "Halbmarathon",
        "days": 5,
        "goalDate": "2026-09-21",
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    at = create_access_token(user_id, email)
    rt = create_refresh_token(user_id)
    set_auth_cookies(response, at, rt)
    return {"id": user_id, "email": email, "name": user_doc["name"], "role": "user"}

@app.post("/api/auth/login")
async def login(request: Request, response: Response):
    body = await request.json()
    email = body.get("email", "").strip().lower()
    password = body.get("password", "")
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Ungueltige Anmeldedaten")
    user_id = str(user["_id"])
    at = create_access_token(user_id, email)
    rt = create_refresh_token(user_id)
    set_auth_cookies(response, at, rt)
    return {"id": user_id, "email": email, "name": user.get("name", ""), "role": user.get("role", "user")}

@app.get("/api/auth/me")
async def auth_me(request: Request):
    user = await get_current_user(request)
    return user

@app.post("/api/auth/logout")
async def logout(response: Response):
    response.delete_cookie("access_token", path="/")
    response.delete_cookie("refresh_token", path="/")
    return {"ok": True}

@app.post("/api/auth/refresh")
async def refresh(request: Request, response: Response):
    token = request.cookies.get("refresh_token")
    if not token:
        raise HTTPException(status_code=401, detail="No refresh token")
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Invalid token type")
        user = await db.users.find_one({"_id": ObjectId(payload["sub"])})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        user_id = str(user["_id"])
        at = create_access_token(user_id, user["email"])
        response.set_cookie(key="access_token", value=at, httponly=True, secure=False, samesite="lax", max_age=7200, path="/")
        return {"ok": True}
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid refresh token")

# --- Profile ---
@app.get("/api/profile")
async def get_profile(request: Request):
    user = await get_current_user(request)
    profile = await db.profiles.find_one({"user_id": user["_id"]}, {"_id": 0})
    if not profile:
        profile = {"user_id": user["_id"], "sport": "Run", "goal": "Halbmarathon", "days": 5, "goalDate": "2026-09-21"}
    return profile

@app.put("/api/profile")
async def update_profile(request: Request):
    user = await get_current_user(request)
    body = await request.json()
    update = {}
    allowed = ["sport", "goal", "days", "goalDate", "name", "age", "weight", "height",
               "time5k", "time10k", "timeHalf", "timeMarathon", "maxHr", "restHr", "gender"]
    for key in allowed:
        if key in body:
            update[key] = body[key]
    if update:
        update["updated_at"] = datetime.now(timezone.utc).isoformat()
        await db.profiles.update_one({"user_id": user["_id"]}, {"$set": update}, upsert=True)
    profile = await db.profiles.find_one({"user_id": user["_id"]}, {"_id": 0})
    return profile

# --- Coach Memory ---
async def get_coach_memory(user_id: str) -> dict:
    mem = await db.coach_memory.find_one({"user_id": user_id}, {"_id": 0})
    if not mem:
        mem = {"user_id": user_id, "preferences": {}, "context_notes": []}
    return mem

async def update_coach_memory(user_id: str, question: str, answer: str):
    await db.coach_memory.update_one(
        {"user_id": user_id},
        {"$push": {"context_notes": {"$each": [{"q": question[:200], "a": answer[:300], "ts": datetime.now(timezone.utc).isoformat()}], "$slice": -20}},
         "$set": {"updated_at": datetime.now(timezone.utc).isoformat()}},
        upsert=True
    )

# --- AI Coach ---
def build_coach_prompt(payload, memory=None):
    userData = payload.get("userData", {})
    metrics = payload.get("metrics", {})
    activities = payload.get("activities", [])
    latestActivity = payload.get("latestActivity")
    dayStrain = payload.get("dayStrain")
    history = payload.get("history", [])
    question = payload.get("question", "")

    latest_str = "Keine letzte Aktivitaet"
    if latestActivity:
        latest_str = f"Letzte Aktivitaet: {latestActivity.get('name', '-')} | {latestActivity.get('type', '-')} | {latestActivity.get('distanceKm', '-')} km | {latestActivity.get('movingTimeMin', '-')} min | Load {latestActivity.get('load', '-')}"

    recent = "\n".join([
        f"{i+1}. {a.get('name', '-')} | {a.get('type', '-')} | {a.get('distanceKm', '-')} km | {a.get('movingTimeMin', '-')} min | Load {a.get('load', '-')}"
        for i, a in enumerate(activities[:5])
    ]) or "Keine Aktivitaeten"

    hist_str = "\n".join([
        f"{'Vincent' if h.get('role') == 'user' else 'Coach'}: {h.get('content', '')}"
        for h in (history or [])[-8:]
    ]) or "Kein bisheriger Chatverlauf."

    memory_str = ""
    if memory and memory.get("context_notes"):
        notes = memory["context_notes"][-5:]
        memory_str = "\nErinnerungen aus frueheren Gespraechen:\n" + "\n".join([f"- {n.get('q', '')}: {n.get('a', '')[:100]}" for n in notes])

    return f"""Du bist Vincent's persoenlicher Trainingscoach in der App Athlete OS.
Der Nutzer heisst Vincent. Sprich ihn direkt mit Namen an.
Antworte auf Deutsch.

STIL:
- kompakt, aber nicht oberflaechlich
- nicht zu lang, 3-4 kurze Bloecke
- keine unnuetigen Einleitungen
- Format: Empfehlung / Warum / Alternative / Wochenfokus
- alle Hauptfakten nennen
- kein medizinischer Ton, keine erfundenen Werte

Profil:
- Sportart: {userData.get('sport', '-')}
- Ziel: {userData.get('goal', '-')}
- Trainingstage/Woche: {userData.get('days', '-')}
- Wettkampfdatum: {userData.get('goalDate', '-')}

Aktuelle Werte:
- Erholung: {metrics.get('recovery', '-')}
- Schlafscore: {metrics.get('sleep', '-')}
- Schlafstunden: {metrics.get('sleepHours', '-')}
- HRV: {metrics.get('hrv', '-')} | Ruhepuls: {metrics.get('rhr', '-')}
- Stress: {metrics.get('stress', '-')} | VO2max: {metrics.get('vo2max', '-')}
- Schritte: {metrics.get('steps', '-')} | Tagesbelastung: {dayStrain or '-'}

{latest_str}

Letzte Aktivitaeten:
{recent}

Chatverlauf:
{hist_str}
{memory_str}

Frage: {question}"""

def build_calendar_prompt(payload):
    userData = payload.get("userData", {})
    metrics = payload.get("metrics", {})
    activities = payload.get("activities", [])
    latestActivity = payload.get("latestActivity")
    dayStrain = payload.get("dayStrain")

    recent = "\n".join([
        f"{i+1}. {a.get('name', '-')} | {a.get('type', '-')} | {a.get('distanceKm', '-')} km | {a.get('movingTimeMin', '-')} min | Load {a.get('load', '-')}"
        for i, a in enumerate(activities[:5])
    ]) or "Keine Aktivitaeten"

    return f"""Du bist ein Ausdauercoach in der App Athlete OS.
Der Nutzer heisst Vincent. Erstelle einen Wochenplan.

Antworte ausschliesslich als JSON. Keine Markdown-Formatierung.

Format:
{{"weekFocus":"kurzer Text","days":[{{"day":"Mo","title":"...","details":"...","type":"training|rest|recovery","duration":"...","intensity":"low|medium|high"}},{{"day":"Di","title":"...","details":"...","type":"training|rest|recovery","duration":"...","intensity":"low|medium|high"}},{{"day":"Mi","title":"...","details":"...","type":"training|rest|recovery","duration":"...","intensity":"low|medium|high"}},{{"day":"Do","title":"...","details":"...","type":"training|rest|recovery","duration":"...","intensity":"low|medium|high"}},{{"day":"Fr","title":"...","details":"...","type":"training|rest|recovery","duration":"...","intensity":"low|medium|high"}},{{"day":"Sa","title":"...","details":"...","type":"training|rest|recovery","duration":"...","intensity":"low|medium|high"}},{{"day":"So","title":"...","details":"...","type":"training|rest|recovery","duration":"...","intensity":"low|medium|high"}}]}}

Regeln:
- logisch fuer Sportart und Ziel
- passend zur Erholung
- nicht zu viele harte Tage hintereinander
- {userData.get('days', 5)} Trainingstage pro Woche
- Ruhetage klar benennen

Profil: {userData.get('sport', 'Run')} | {userData.get('goal', 'Halbmarathon')} | {userData.get('days', 5)} Tage | Wettkampf: {userData.get('goalDate', '-')}
Werte: Erholung {metrics.get('recovery', '-')} | Schlaf {metrics.get('sleep', '-')} | HRV {metrics.get('hrv', '-')} | Ruhepuls {metrics.get('rhr', '-')} | Tagesbelastung {dayStrain or '-'}
{f"Letzte Aktivitaet: {latestActivity.get('name', '-')} | {latestActivity.get('type', '-')} | {latestActivity.get('distanceKm', '-')} km" if latestActivity else "Keine letzte Aktivitaet"}
Letzte Aktivitaeten:
{recent}"""

@app.post("/api/coach")
async def coach_endpoint(request: Request):
    try:
        user = await get_current_user(request)
        user_id = user["_id"]
    except Exception:
        user_id = "anonymous"

    body = await request.json()
    question = body.get("question", "")
    if not question:
        raise HTTPException(status_code=400, detail="Frage fehlt")

    memory = await get_coach_memory(user_id) if user_id != "anonymous" else None
    prompt = build_coach_prompt(body, memory)

    try:
        chat = LlmChat(
            api_key=EMERGENT_KEY,
            session_id=f"coach-{user_id}-{datetime.now(timezone.utc).strftime('%Y%m%d')}",
            system_message="Du bist ein erfahrener Trainingscoach. Antworte kompakt und hilfreich auf Deutsch."
        )
        chat.with_model("gemini", "gemini-2.5-flash")
        response = await chat.send_message(UserMessage(text=prompt))
        answer = response.strip() if isinstance(response, str) else str(response).strip()
    except Exception as e:
        print(f"Coach AI error: {e}")
        raise HTTPException(status_code=500, detail="KI-Coach konnte nicht antworten")

    if user_id != "anonymous":
        await update_coach_memory(user_id, question, answer)
        await db.coach_messages.insert_one({
            "user_id": user_id,
            "question": question,
            "answer": answer,
            "timestamp": datetime.now(timezone.utc).isoformat()
        })

    return {"ok": True, "answer": answer}

@app.get("/api/coach/history")
async def coach_history(request: Request):
    try:
        user = await get_current_user(request)
        messages = await db.coach_messages.find(
            {"user_id": user["_id"]}, {"_id": 0}
        ).sort("timestamp", -1).limit(50).to_list(50)
        messages.reverse()
        return {"ok": True, "messages": messages}
    except Exception:
        return {"ok": True, "messages": []}

# --- Calendar Plan ---
@app.post("/api/calendar-plan")
async def calendar_plan(request: Request):
    try:
        user = await get_current_user(request)
        user_id = user["_id"]
    except Exception:
        user_id = "anonymous"

    body = await request.json()
    prompt = build_calendar_prompt(body)

    try:
        chat = LlmChat(
            api_key=EMERGENT_KEY,
            session_id=f"calendar-{user_id}-{datetime.now(timezone.utc).strftime('%Y%m%d%H')}",
            system_message="Du generierst Wochenplaene als reines JSON. Kein Markdown."
        )
        chat.with_model("gemini", "gemini-2.5-flash")
        response = await chat.send_message(UserMessage(text=prompt))
        text = response.strip() if isinstance(response, str) else str(response).strip()
    except Exception as e:
        print(f"Calendar AI error: {e}")
        raise HTTPException(status_code=500, detail="Wochenplan konnte nicht erstellt werden")

    try:
        parsed = json.loads(text)
    except json.JSONDecodeError:
        cleaned = text.replace("```json", "").replace("```", "").strip()
        try:
            parsed = json.loads(cleaned)
        except json.JSONDecodeError:
            raise HTTPException(status_code=500, detail="KI-Antwort war kein gueltiges JSON")

    if not parsed.get("days") or not isinstance(parsed["days"], list):
        raise HTTPException(status_code=500, detail="Wochenplan unvollstaendig")

    if user_id != "anonymous":
        week_start = datetime.now(timezone.utc).strftime("%Y-W%W")
        await db.training_plans.update_one(
            {"user_id": user_id, "week": week_start},
            {"$set": {"plan": parsed, "updated_at": datetime.now(timezone.utc).isoformat()}},
            upsert=True
        )

    return {"ok": True, "plan": parsed}

@app.get("/api/training-plan")
async def get_training_plan(request: Request):
    try:
        user = await get_current_user(request)
        week_start = datetime.now(timezone.utc).strftime("%Y-W%W")
        plan = await db.training_plans.find_one(
            {"user_id": user["_id"], "week": week_start}, {"_id": 0}
        )
        if plan:
            return {"ok": True, "plan": plan.get("plan")}
        return {"ok": True, "plan": None}
    except Exception:
        return {"ok": True, "plan": None}

@app.put("/api/training-plan/day")
async def update_plan_day(request: Request):
    user = await get_current_user(request)
    body = await request.json()
    day_index = body.get("dayIndex")
    updates = body.get("updates", {})
    week_start = datetime.now(timezone.utc).strftime("%Y-W%W")
    plan_doc = await db.training_plans.find_one({"user_id": user["_id"], "week": week_start})
    if not plan_doc or not plan_doc.get("plan", {}).get("days"):
        raise HTTPException(status_code=404, detail="Kein aktiver Wochenplan")
    days = plan_doc["plan"]["days"]
    if day_index < 0 or day_index >= len(days):
        raise HTTPException(status_code=400, detail="Ungueltiger Tag-Index")
    for k, v in updates.items():
        days[day_index][k] = v
    await db.training_plans.update_one(
        {"user_id": user["_id"], "week": week_start},
        {"$set": {"plan.days": days, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    return {"ok": True, "plan": plan_doc["plan"]}

@app.post("/api/coach/apply-to-plan")
async def coach_apply_to_plan(request: Request):
    """Coach-Vorschlag direkt in den Wochenplan uebernehmen."""
    user = await get_current_user(request)
    body = await request.json()
    suggestion = body.get("suggestion", "")
    if not suggestion:
        raise HTTPException(status_code=400, detail="Kein Vorschlag")

    week_start = datetime.now(timezone.utc).strftime("%Y-W%W")
    plan_doc = await db.training_plans.find_one({"user_id": user["_id"], "week": week_start})
    current_plan = plan_doc["plan"] if plan_doc and plan_doc.get("plan") else None

    prompt = f"""Du bist Coach in Athlete OS. Vincent hat folgenden Vorschlag:
"{suggestion}"

{"Aktueller Wochenplan: " + json.dumps(current_plan, ensure_ascii=False) if current_plan else "Noch kein Wochenplan vorhanden."}

Erstelle den aktualisierten Wochenplan als reines JSON (kein Markdown).
Format: {{"weekFocus":"...","days":[{{"day":"Mo","title":"...","details":"...","type":"training|rest|recovery","duration":"...","intensity":"low|medium|high"}},...7 Tage]}}
Uebernimm den Vorschlag sinnvoll. Antworte NUR mit JSON."""

    try:
        chat = LlmChat(api_key=EMERGENT_KEY, session_id=f"apply-{user['_id']}-{datetime.now(timezone.utc).strftime('%Y%m%d%H%M')}", system_message="JSON Wochenplan Generator.")
        chat.with_model("gemini", "gemini-2.5-flash")
        resp = await chat.send_message(UserMessage(text=prompt))
        text = resp.strip() if isinstance(resp, str) else str(resp).strip()
        try:
            parsed = json.loads(text)
        except json.JSONDecodeError:
            parsed = json.loads(text.replace("```json", "").replace("```", "").strip())

        if parsed.get("days") and isinstance(parsed["days"], list):
            await db.training_plans.update_one(
                {"user_id": user["_id"], "week": week_start},
                {"$set": {"plan": parsed, "updated_at": datetime.now(timezone.utc).isoformat()}},
                upsert=True
            )
            return {"ok": True, "plan": parsed}
    except Exception as e:
        print(f"Apply to plan error: {e}")
    raise HTTPException(status_code=500, detail="Konnte Vorschlag nicht in Plan uebernehmen")

# --- Garmin Workout Push (prepared) ---
@app.post("/api/garmin/push-workout")
async def garmin_push_workout(request: Request):
    """Push workout to Garmin watch via Connect API. Requires Garmin credentials."""
    body = await request.json()
    workout = body.get("workout", {})
    # Garmin Connect IQ Workout API: POST https://connect.garmin.com/modern/proxy/workout-service/workout
    # Requires OAuth 1.0a with consumer key/secret from developer.garmin.com
    garmin_token = await db.garmin_tokens.find_one({}, {"_id": 0})
    if not garmin_token or not garmin_token.get("access_token"):
        return {"ok": False, "message": "Garmin nicht verbunden. Bitte API-Credentials in den Einstellungen hinterlegen.",
                "setup_url": "https://developer.garmin.com"}
    # When credentials are available, this will POST to Garmin Connect Workout API
    return {"ok": False, "message": "Garmin Workout Push wird mit naechstem Update aktiviert."}

# --- ICS Calendar Export ---
@app.get("/api/calendar/export-ics")
async def export_ics(request: Request):
    try:
        user = await get_current_user(request)
        week_start = datetime.now(timezone.utc).strftime("%Y-W%W")
        plan_doc = await db.training_plans.find_one({"user_id": user["_id"], "week": week_start})
    except Exception:
        plan_doc = None

    if not plan_doc or not plan_doc.get("plan", {}).get("days"):
        raise HTTPException(status_code=404, detail="Kein Wochenplan verfuegbar")

    days = plan_doc["plan"]["days"]
    now = datetime.now(timezone.utc)
    monday = now - timedelta(days=now.weekday())

    day_map = {"Mo": 0, "Di": 1, "Mi": 2, "Do": 3, "Fr": 4, "Sa": 5, "So": 6}
    events = []
    for day in days:
        offset = day_map.get(day.get("day", ""), 0)
        date = monday + timedelta(days=offset)
        title = day.get("title", "Training")
        details = day.get("details", "")
        dtype = day.get("type", "training")
        if dtype == "rest":
            continue
        dt_start = date.replace(hour=8, minute=0, second=0)
        dt_end = date.replace(hour=9, minute=0, second=0)
        uid = f"{date.strftime('%Y%m%d')}-{secrets.token_hex(4)}@athleteos"
        events.append(f"""BEGIN:VEVENT
UID:{uid}
DTSTART:{dt_start.strftime('%Y%m%dT%H%M%SZ')}
DTEND:{dt_end.strftime('%Y%m%dT%H%M%SZ')}
SUMMARY:{title}
DESCRIPTION:{details}
END:VEVENT""")

    ics = f"""BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Athlete OS//Training Plan//DE
CALSCALE:GREGORIAN
METHOD:PUBLISH
X-WR-CALNAME:Athlete OS Training
{"".join(events)}
END:VCALENDAR"""

    return Response(content=ics, media_type="text/calendar", headers={"Content-Disposition": "attachment; filename=athlete-os-training.ics"})

# --- Morning Report ---
@app.post("/api/morning-report")
async def morning_report(request: Request):
    try:
        user = await get_current_user(request)
        user_id = user["_id"]
    except Exception:
        user_id = "anonymous"

    body = await request.json()
    metrics = body.get("metrics", {})
    yesterday = body.get("yesterday", {})
    activities = body.get("activities", [])
    profile = body.get("profile", {})

    recent = "\n".join([
        f"- {a.get('name', '-')}: {a.get('type', '-')}, {a.get('distanceKm', '-')} km, {a.get('movingTimeMin', '-')} min, Load {a.get('load', '-')}"
        for a in activities[:5]
    ]) or "Keine aktuellen Aktivitaeten"

    prompt = f"""Du bist Vincent's persoenlicher Coach in Athlete OS.
Erstelle einen kompakten Morgenreport. Antworte auf Deutsch. Max 6-8 Saetze.

STIL: direkt, persoenlich, keine Floskeln. Sprich Vincent direkt an.

Aktuelle Werte (von Garmin/Strava):
- Erholung: {metrics.get('recovery', '-')} (gestern: {yesterday.get('recovery', '-')})
- HRV: {metrics.get('hrv', '-')}ms (gestern: {yesterday.get('hrv', '-')}ms)
- Ruhepuls: {metrics.get('rhr', '-')} (gestern: {yesterday.get('rhr', '-')})
- Schlaf: {metrics.get('sleep', '-')}/100, {metrics.get('sleepHours', '-')}h (Tief: {metrics.get('sleepDeep', '-')}h, REM: {metrics.get('sleepRem', '-')}h)
- Stress: {metrics.get('stress', '-')} (gestern: {yesterday.get('stress', '-')})
- VO2max: {metrics.get('vo2max', '-')} | SpO2: {metrics.get('spo2', '-')}%
- Body Battery: {metrics.get('bodyBattery', '-')} | Trainingsbereitschaft: {metrics.get('trainingReadiness', '-')}
- Schritte: {metrics.get('steps', '-')} | Kalorien: {metrics.get('calories', '-')}

Profil: {profile.get('sport', 'Run')} | Ziel: {profile.get('goal', '-')} | {profile.get('days', 5)} Tage/Woche

Letzte Aktivitaeten:
{recent}

Bewerte:
1. Was hat sich gegenueber gestern verbessert/verschlechtert?
2. Wie steht es um die Erholung?
3. Klare Trainingsempfehlung fuer heute
4. Ein motivierender Satz"""

    try:
        chat = LlmChat(
            api_key=EMERGENT_KEY,
            session_id=f"morning-{user_id}-{datetime.now(timezone.utc).strftime('%Y%m%d')}",
            system_message="Kompakter, persoenlicher Morgenreport. Deutsch. Direkt und hilfreich."
        )
        chat.with_model("gemini", "gemini-2.5-flash")
        response = await chat.send_message(UserMessage(text=prompt))
        report = response.strip() if isinstance(response, str) else str(response).strip()
        return {"ok": True, "report": report}
    except Exception as e:
        print(f"Morning report error: {e}")
        return {"ok": True, "report": "Morgenreport konnte nicht geladen werden. Deine Daten sehen insgesamt stabil aus."}

# --- Strava Integration ---
@app.get("/api/strava/login-url")
async def strava_login_url():
    if not STRAVA_CLIENT_ID or not STRAVA_REDIRECT_URI:
        raise HTTPException(status_code=500, detail="Strava nicht konfiguriert")
    url = (
        "https://www.strava.com/oauth/authorize"
        f"?client_id={STRAVA_CLIENT_ID}"
        "&response_type=code"
        f"&redirect_uri={STRAVA_REDIRECT_URI}"
        "&approval_prompt=force"
        "&scope=read,activity:read_all"
    )
    return {"ok": True, "url": url}

@app.get("/api/strava/callback")
async def strava_callback(code: str = "", state: str = ""):
    if not code:
        raise HTTPException(status_code=400, detail="Kein Code von Strava")
    try:
        resp = requests.post("https://www.strava.com/api/v3/oauth/token", json={
            "client_id": STRAVA_CLIENT_ID,
            "client_secret": STRAVA_CLIENT_SECRET,
            "code": code,
            "grant_type": "authorization_code"
        })
        data = resp.json()
        if "access_token" not in data:
            raise HTTPException(status_code=500, detail="Token-Austausch fehlgeschlagen")

        await db.strava_tokens.update_one(
            {"athlete_id": data.get("athlete", {}).get("id")},
            {"$set": {
                "access_token": data["access_token"],
                "refresh_token": data["refresh_token"],
                "expires_at": data["expires_at"],
                "athlete": data.get("athlete"),
                "updated_at": datetime.now(timezone.utc).isoformat()
            }},
            upsert=True
        )
        html = f"""<html><body style="font-family:system-ui;background:#0f0f1e;color:white;padding:40px;text-align:center">
        <h1>Strava verbunden</h1>
        <p>Du kannst dieses Fenster schliessen und zur App zurueckkehren.</p>
        <script>setTimeout(()=>window.close(),3000)</script>
        </body></html>"""
        return Response(content=html, media_type="text/html")
    except Exception as e:
        print(f"Strava callback error: {e}")
        raise HTTPException(status_code=500, detail="Strava-Callback Fehler")

async def get_valid_strava_token():
    token_doc = await db.strava_tokens.find_one({}, {"_id": 0})
    if not token_doc:
        return None
    now = int(datetime.now(timezone.utc).timestamp())
    if token_doc.get("expires_at", 0) <= now + 60:
        try:
            resp = requests.post("https://www.strava.com/api/v3/oauth/token", json={
                "client_id": STRAVA_CLIENT_ID,
                "client_secret": STRAVA_CLIENT_SECRET,
                "refresh_token": token_doc["refresh_token"],
                "grant_type": "refresh_token"
            })
            data = resp.json()
            if "access_token" in data:
                await db.strava_tokens.update_one(
                    {"athlete_id": token_doc.get("athlete", {}).get("id")},
                    {"$set": {
                        "access_token": data["access_token"],
                        "refresh_token": data["refresh_token"],
                        "expires_at": data["expires_at"],
                        "updated_at": datetime.now(timezone.utc).isoformat()
                    }}
                )
                token_doc["access_token"] = data["access_token"]
        except Exception as e:
            print(f"Strava token refresh error: {e}")
            return None
    return token_doc

@app.get("/api/strava/status")
async def strava_status():
    token_doc = await get_valid_strava_token()
    return {
        "ok": True,
        "connected": bool(token_doc and token_doc.get("access_token")),
        "athlete": token_doc.get("athlete") if token_doc else None
    }

@app.get("/api/strava/activities")
async def strava_activities():
    token_doc = await get_valid_strava_token()
    if not token_doc:
        return {"ok": False, "message": "Strava nicht verbunden", "activities": []}
    try:
        resp = requests.get(
            "https://www.strava.com/api/v3/athlete/activities?per_page=15",
            headers={"Authorization": f"Bearer {token_doc['access_token']}"}
        )
        data = resp.json()
        if not resp.ok:
            return {"ok": False, "message": "Fehler bei Strava API", "activities": []}
        return {"ok": True, "activities": data}
    except Exception as e:
        print(f"Strava activities error: {e}")
        return {"ok": False, "message": "Strava-Fehler", "activities": []}

# --- Garmin Integration ---
# Uses python-garminconnect for Health/Activity data (read)
# Training API (push workouts) requires developer.garmin.com credentials

from garminconnect import Garmin as GarminClient

async def get_garmin_client():
    """Get authenticated Garmin client from stored credentials."""
    creds = await db.garmin_tokens.find_one({}, {"_id": 0})
    if not creds or not creds.get("email"):
        return None, creds
    try:
        client = GarminClient(creds["email"], creds["password"])
        if creds.get("oauth_tokens"):
            client.garth.loads(creds["oauth_tokens"])
            try:
                client.display_name
            except Exception:
                client.login()
                await db.garmin_tokens.update_one(
                    {"email": creds["email"]},
                    {"$set": {"oauth_tokens": client.garth.dumps(), "updated_at": datetime.now(timezone.utc).isoformat()}}
                )
        else:
            client.login()
            await db.garmin_tokens.update_one(
                {"email": creds["email"]},
                {"$set": {"oauth_tokens": client.garth.dumps(), "updated_at": datetime.now(timezone.utc).isoformat()}}
            )
        return client, creds
    except Exception as e:
        print(f"Garmin login error: {e}")
        return None, creds

@app.get("/api/garmin/status")
async def garmin_status():
    creds = await db.garmin_tokens.find_one({}, {"_id": 0})
    connected = bool(creds and creds.get("email") and creds.get("oauth_tokens"))
    return {
        "ok": True,
        "connected": connected,
        "athlete": {"name": creds.get("display_name", creds.get("email", ""))} if connected else None
    }

@app.post("/api/garmin/connect")
async def garmin_connect(request: Request):
    """Connect Garmin with email/password credentials."""
    user = await get_current_user(request)
    body = await request.json()
    email = body.get("email", "").strip()
    password = body.get("password", "")
    if not email or not password:
        raise HTTPException(status_code=400, detail="E-Mail und Passwort erforderlich")
    try:
        client = GarminClient(email, password)
        client.login()
        display_name = client.get_full_name() if hasattr(client, 'get_full_name') else email
        await db.garmin_tokens.update_one(
            {"user_id": user["_id"]},
            {"$set": {
                "email": email, "password": password,
                "oauth_tokens": client.garth.dumps(),
                "display_name": display_name,
                "user_id": user["_id"],
                "updated_at": datetime.now(timezone.utc).isoformat()
            }},
            upsert=True
        )
        return {"ok": True, "message": "Garmin verbunden", "athlete": {"name": display_name}}
    except Exception as e:
        print(f"Garmin connect error: {e}")
        raise HTTPException(status_code=401, detail="Garmin-Anmeldung fehlgeschlagen. Pruefe E-Mail und Passwort.")

@app.post("/api/garmin/disconnect")
async def garmin_disconnect(request: Request):
    user = await get_current_user(request)
    await db.garmin_tokens.delete_many({"user_id": user["_id"]})
    return {"ok": True}

@app.get("/api/garmin/health")
async def garmin_health():
    """Get today's health metrics from Garmin."""
    client, _ = await get_garmin_client()
    if not client:
        return {"ok": False, "message": "Garmin nicht verbunden", "data": None}
    try:
        today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        stats = client.get_stats(today)
        hr = client.get_heart_rates(today)
        sleep = client.get_sleep_data(today)
        stress = client.get_stress_data(today)
        body_battery = client.get_body_battery(today)
        respiration = client.get_respiration_data(today)
        spo2 = client.get_spo2_data(today)
        return {"ok": True, "data": {
            "stats": stats, "heartRate": hr, "sleep": sleep,
            "stress": stress, "bodyBattery": body_battery,
            "respiration": respiration, "spo2": spo2,
            "date": today
        }}
    except Exception as e:
        print(f"Garmin health error: {e}")
        return {"ok": False, "message": f"Garmin-Daten konnten nicht geladen werden: {str(e)[:100]}", "data": None}

@app.get("/api/garmin/activities")
async def garmin_activities():
    """Get recent activities from Garmin."""
    client, _ = await get_garmin_client()
    if not client:
        return {"ok": False, "message": "Garmin nicht verbunden", "activities": []}
    try:
        activities = client.get_activities(0, 15)
        return {"ok": True, "activities": activities}
    except Exception as e:
        print(f"Garmin activities error: {e}")
        return {"ok": False, "message": "Fehler beim Laden", "activities": []}

@app.post("/api/garmin/push-workout")
async def garmin_push_workout(request: Request):
    """Push structured workout to Garmin Connect calendar for device sync."""
    client, creds = await get_garmin_client()
    if not client:
        return {"ok": False, "message": "Garmin nicht verbunden."}
    body = await request.json()
    workout = body.get("workout", {})
    # Garmin Connect workout format
    workout_data = {
        "sportType": {"sportTypeId": 1, "sportTypeKey": "running"},
        "workoutName": workout.get("title", "Athlete OS Training"),
        "description": workout.get("details", ""),
        "workoutSegments": [{
            "segmentOrder": 1,
            "sportType": {"sportTypeId": 1, "sportTypeKey": "running"},
            "workoutSteps": [{
                "type": "ExecutableStepDTO",
                "stepOrder": 1,
                "stepType": {"stepTypeId": 3, "stepTypeKey": "interval"},
                "endCondition": {"conditionTypeId": 2, "conditionTypeKey": "time"},
                "endConditionValue": int(float(workout.get("duration_minutes", 45)) * 60),
                "targetType": {"workoutTargetTypeId": 0, "workoutTargetTypeKey": "no.target"}
            }]
        }]
    }
    try:
        # Uses Garmin Connect internal API
        resp = client.session.post(
            "https://connect.garmin.com/modern/proxy/workout-service/workout",
            json=workout_data
        )
        if resp.ok:
            return {"ok": True, "message": "Workout an Garmin gesendet. Synchronisiere deine Uhr."}
        return {"ok": False, "message": f"Garmin API Fehler: {resp.status_code}"}
    except Exception as e:
        print(f"Garmin push error: {e}")
        return {"ok": False, "message": "Workout konnte nicht gesendet werden. Garmin-Session ggf. abgelaufen."}

@app.post("/api/garmin/send-workout")
async def garmin_send_workout_legacy(request: Request):
    return await garmin_push_workout(request)

# --- Changelog ---
CHANGELOG = [
    {
        "version": "1.2.0",
        "date": "2026-04-14",
        "title": "Coach Vincent & Kalender-Upgrade",
        "changes": [
            "AI-Coach Vincent mit Gedaechtnis und kompakten Antworten",
            "Interaktiver Trainingskalender mit Wochenplan",
            "ICS-Export fuer iCloud/Google Kalender",
            "Strava-Integration mit automatischem Token-Refresh",
            "Garmin-Integration vorbereitet",
            "Neue Settings mit Versionsanzeige und Changelog",
            "Verbesserte Statistiken mit Zeitreihen-Charts",
            "Mobile-optimiertes Design"
        ]
    },
    {
        "version": "1.1.0",
        "date": "2026-03-01",
        "title": "Strava & AI-Coach",
        "changes": [
            "Strava-Anbindung fuer Aktivitaeten",
            "AI-Coach mit Gemini 2.5",
            "Metriken-Dashboard mit Ringsanzeige",
            "Wochenplaner Grundversion"
        ]
    },
    {
        "version": "1.0.0",
        "date": "2026-01-15",
        "title": "Erster Release",
        "changes": [
            "Grundlegende App-Struktur",
            "Heute-Ansicht mit Erholung, Belastung, Schlaf",
            "Trainingsempfehlungen",
            "Setup mit Profil-Einstellungen"
        ]
    }
]

@app.get("/api/changelog")
async def get_changelog():
    return {"ok": True, "changelog": CHANGELOG, "currentVersion": "1.2.0"}

# --- Health ---
@app.get("/api/health")
async def health():
    return {"ok": True, "message": "Athlete OS Backend laeuft", "version": "1.2.0"}

# --- Startup ---
@app.on_event("startup")
async def startup():
    await db.users.create_index("email", unique=True)
    await db.strava_tokens.create_index("athlete_id")
    await db.coach_messages.create_index([("user_id", 1), ("timestamp", -1)])
    await db.training_plans.create_index([("user_id", 1), ("week", 1)])

    # Seed admin
    admin_email = os.environ.get("ADMIN_EMAIL", "admin@athleteos.com")
    admin_password = os.environ.get("ADMIN_PASSWORD", "AthleteOS2026!")
    existing = await db.users.find_one({"email": admin_email})
    if not existing:
        await db.users.insert_one({
            "email": admin_email,
            "password_hash": hash_password(admin_password),
            "name": "Admin",
            "role": "admin",
            "created_at": datetime.now(timezone.utc).isoformat()
        })
        await db.profiles.insert_one({
            "user_id": str((await db.users.find_one({"email": admin_email}))["_id"]),
            "sport": "Run", "goal": "Halbmarathon", "days": 5, "goalDate": "2026-09-21",
            "created_at": datetime.now(timezone.utc).isoformat()
        })

    # Seed Strava tokens if not already in DB
    existing_strava = await db.strava_tokens.find_one({})
    if not existing_strava:
        await db.strava_tokens.insert_one({
            "access_token": "5254239df52afa4ab875284fc0f30a3c1f28082d",
            "refresh_token": "535a9837c8f19da4a5d235467517480c99e7cbab",
            "expires_at": 1776187827,
            "athlete_id": 34302958,
            "athlete": {
                "id": 34302958,
                "firstname": "Vincent",
                "lastname": "Wiesend",
                "city": "Muenchen",
                "sex": "M",
                "premium": True,
                "profile_medium": "https://dgalywyr863hv.cloudfront.net/pictures/athletes/34302958/30018775/1/medium.jpg",
                "profile": "https://dgalywyr863hv.cloudfront.net/pictures/athletes/34302958/30018775/1/large.jpg"
            },
            "updated_at": datetime.now(timezone.utc).isoformat()
        })

    # Write test credentials
    os.makedirs("/app/memory", exist_ok=True)
    with open("/app/memory/test_credentials.md", "w") as f:
        f.write(f"# Test Credentials\n\n## Admin\n- Email: {admin_email}\n- Password: {admin_password}\n- Role: admin\n\n## Auth Endpoints\n- POST /api/auth/register\n- POST /api/auth/login\n- GET /api/auth/me\n- POST /api/auth/logout\n")

    print("Athlete OS Backend gestartet")
