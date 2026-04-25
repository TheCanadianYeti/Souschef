# Souschef

> Work in progress. Built for the [Bear Hacks 2026](https://bearhacks.com) hackathon.

A recipe management app built with Next.js. Souschef lets you capture, organize, and cook through recipes with AI-powered parsing and step-by-step guidance.

---

## What It Does

- Capture recipes from a URL or by uploading a video/image
- Parse raw content into structured recipes using the Claude API
- Step through cooking instructions with a guided cook mode
- Ask questions mid-cook and get AI-powered answers
- Add recipe ingredients directly to an Instacart cart

---

## Tech Stack

- Next.js 14
- React 18
- Tailwind CSS 4
- TypeScript
- lucide-react (icons)

---

## Getting Started

**Prerequisites:** Node.js 18+

```bash
git clone https://github.com/TheCanadianYeti/Souschef.git
cd Souschef
npm install
npm run dev
```

Open `http://localhost:3000` in your browser.

---

## Project Structure

```
src/          # Next.js app source
public/fonts/ # Local font files
.next/        # Next.js build output (generated)
```

---

## Current State

The frontend is a working prototype with mock data. Backend integration is not yet implemented. All API calls currently use simulated `setTimeout` responses.

Look for `// TODO: BACKEND INTEGRATION` comments throughout the React source to find every integration point.

---

## Backend (Not Yet Implemented)

See `backend_implementation_guide.txt` for the full spec. The planned backend requires:

**Database (PostgreSQL)**
- Users, Recipes, Ingredients, CookingSteps tables

**Auth**
- Auth0 + JWT for protected routes

**API (Node.js + Express)**
- `GET /recipes` — fetch user's recipe library
- `GET /recipes/:id` — fetch recipe with ingredients and steps
- `PUT /recipes/:id` — update a recipe
- `DELETE /recipes/:id` — delete a recipe
- `POST /recipes/capture` — upload video/image, parse with Claude API
- `POST /recipes/from-url` — scrape URL, parse with Claude API
- `POST /cook/:recipe_id/ask` — mid-cook Q&A via Claude API
- `POST /grocery/checkout` — generate Instacart cart link

**External Services**
- Claude API — recipe parsing and cook-mode Q&A
- ElevenLabs API — text-to-speech for cooking steps (planned upgrade from Web Speech API)
- Instacart API — grocery cart deep linking
- Redis — rate limiting and caching for AI endpoints

---

## Development Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |

---

## Contributing

1. Fork the repo
2. Create a feature branch
3. Submit a pull request

For bugs and feature requests, open an issue.
