# Souschef — Backend

Node.js + Express REST API. Runs on port 3001.

## Stack

- Node.js 18+
- Express
- PostgreSQL 15
- Redis (optional, for rate limiting)
- Docker + Docker Compose

## Getting Started

### Option A: Docker (recommended)

Spins up the API, PostgreSQL, and Redis together.

```bash
cd backend
cp envExample.txt .env
# Fill in your API keys in .env
docker-compose up
```

### Option B: Manual

You need a running PostgreSQL instance first.

```bash
cd backend
cp envExample.txt .env
# Fill in your API keys and DB credentials in .env
npm install
npm run migrate
npm run dev
```

The server starts on http://localhost:3001. Migrations run automatically on startup. If the database is unavailable, TTS and assistant routes still work — only DB-backed routes will fail.

## Environment Variables

Copy `envExample.txt` to `.env` and fill in the values.

Required to run:
- `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`
- `JWT_SECRET`, `JWT_REFRESH_SECRET`

Required for recipe capture:
- `GCP_VISION_API_KEY` — extracts text from uploaded photos
- `GEMMA_API_KEY` — parses extracted text into structured recipes

Required for cooking mode audio:
- `ELEVENLABS_API_KEY` — text-to-speech for step readout

## API Routes

**Auth** (`/api/auth`)
- `POST /signup` — create account
- `POST /login` — get JWT
- `POST /refresh` — refresh token
- `GET /me` — current user
- `PUT /profile` — update profile

**Recipes** (`/api/recipes`)
- `GET /` — list user's recipes
- `GET /:id` — get recipe with ingredients and steps
- `POST /from-url` — import recipe from any URL or YouTube link
- `POST /capture` — import recipe from a photo upload
- `DELETE /:id` — delete a recipe

**Cooking** (`/api/cook`)
- `POST /:recipeId/start` — start a cooking session
- `GET /session/:sessionId` — get session state
- `PATCH /session/:sessionId/step` — advance to a step
- `POST /session/:sessionId/complete` — end session with optional rating
- `GET /session/:sessionId/timers` — get timers for current and upcoming steps
- `GET /history` — past cooking sessions

**Voice Assistant** (`/api/assistant`)
- `POST /command` — process a voice command against the current recipe and step

**Text-to-Speech** (`/api/tts`)
- `POST /generate` — convert a step instruction to audio via ElevenLabs

**Health**
- `GET /api/health` — server status

## Database

Migrations run automatically on startup via `npm run migrate`. To seed sample data:

```bash
npm run seed
```

Seeds two demo users and three sample recipes.

## How Recipe Import Works

1. **Photo upload** — image buffer is sent to Google Cloud Vision for text extraction, then the extracted text is parsed into structured JSON by Gemini.
2. **URL import** — the URL is scraped for HTML content. YouTube URLs fetch the video transcript directly. The content is then parsed by Gemini.
3. **Fallback** — if the AI service is unavailable or the API key is missing, a placeholder recipe is returned so the request does not fail silently.

## Voice Command Logic

The assistant route handles voice commands locally using a heuristic engine. It does not make an AI API call for every command. Navigation words ("next", "back", "repeat") are matched directly. Ingredient questions are matched against the recipe's ingredient list. Unknown commands return a prompt telling the user what commands are available.

## Docker Services

| Service | Port | Notes |
|---|---|---|
| API | 3001 | Auto-restarts on file change in dev |
| PostgreSQL | 5432 | Data persisted in Docker volume |
| Redis | 6379 | Optional, used for rate limiting |
