# Souschef

Your recipe library, standardized. Your kitchen, hands-free.

Recipes come from everywhere: YouTube videos, food blogs, handwritten cards, screenshots, your aunt's email. They all look different, use different units, and live in different places. Souschef pulls them into one consistent format so you can actually cook from them.

## Features

### One format for everything

Every recipe you add, regardless of source, gets structured the same way: a clean ingredient list with standardized units, numbered steps, prep time, cook time, serving size, and difficulty. No more hunting through a blog post for the actual instructions. No more decoding someone else's shorthand.

### Hands-free cooking mode

When your hands are covered in flour or raw chicken, touching your phone is not an option. Souschef reads each cooking step aloud so you can keep your hands where they belong. Use voice commands to advance steps, repeat instructions, or pause a timer without touching anything.

### Built-in timers per step

Each cooking step with a time component has its own timer. You do not need to juggle a separate timer app or try to remember how long something has been on the heat.

### Add recipes from anywhere

- Paste a URL from any recipe site
- Upload a photo of a recipe card or cookbook page
- Record a cooking video and Souschef extracts the recipe from it
- Type or paste raw text

Whatever format it starts in, it ends up in the same clean structure.

## Tech Stack

- Next.js 14
- React 18
- Tailwind CSS v4
- TypeScript

The current version is a frontend prototype. All recipe data is mocked and API calls are simulated with `setTimeout`. Backend integration points are marked throughout the source with `// TODO: BACKEND INTEGRATION`.

## Getting Started

```bash
git clone https://github.com/TheCanadianYeti/Souschef.git
cd Souschef
npm install
npm run dev
```

Open http://localhost:3000.

## Project Structure

```
src/          React components and pages
public/fonts/ Custom fonts
extract.py    Content extraction utility
```

## Backend

The backend is implemented separately. See [`/backend`](./backend) for its own README and setup instructions.
