# Souschef

> Built for [Bear Hacks 2026](https://bearhacks.com)

Your recipe library, standardized. Your kitchen, hands-free.

Recipes come from everywhere: YouTube videos, food blogs, handwritten cards, screenshots, your aunt's email. They all look different, use different units, and live in different places. Souschef pulls them into one consistent format so you can actually cook from them.

---

## Features

### One format for everything

Every recipe you add, regardless of source, gets structured the same way: a clean ingredient list with standardized units, numbered steps, prep time, cook time, serving size, and difficulty.

### Hands-free cooking mode

When your hands are covered in flour or raw chicken, touching your phone is not an option. Souschef reads each cooking step aloud using ElevenLabs text-to-speech. Use voice commands to advance steps, repeat instructions, or pause a timer without touching anything.

### Built-in timers per step

Each cooking step with a time component has its own timer. No juggling a separate timer app.

### AI-powered recipe capture

Paste a URL, upload a photo, record a video, or paste raw text. Gemma parses the content and returns a structured recipe every time.

---

## Tech Stack

**Frontend**
- Next.js 14
- React 18
- TypeScript
- JavaScript
- Tailwind CSS v4
- Lucide React
- PostCSS

**Backend**
- Node.js + Express
- PostgreSQL
- Redis
- Python

**APIs**
- Gemma API (recipe parsing, hosted by Google)
- ElevenLabs API (text-to-speech for cooking steps)
- Pexels API (recipe imagery)
- Web Speech API (voice commands)

**Infrastructure**
- Vercel

---

## Getting Started

```bash
git clone https://github.com/TheCanadianYeti/Souschef.git
cd Souschef
npm install
npm run dev
```

Open http://localhost:3000.

### Environment Variables

Create a `.env.local` file in the root with the following:

```
GEMMA_API_KEY=
ELEVENLABS_API_KEY=
PEXELS_API_KEY=
DATABASE_URL=
REDIS_URL=
```

---

## Project Structure

```
src/          React components and pages
public/fonts/ Custom fonts
extract.py    Content extraction utility
```

---

## Backend

Backend integration points are marked throughout the source with `// TODO: BACKEND INTEGRATION`. See `backend_implementation_guide.txt` for the full API spec and database schema.
