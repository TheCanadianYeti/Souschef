# Mise Backend API

REST API backend for the Mise - AI-Powered Recipe Capture & Cooking Assistant application.

## Tech Stack

- **Runtime:** Node.js 18+
- **Framework:** Express.js
- **Database:** PostgreSQL 14+
- **Cache:** Redis (optional, for rate limiting)
- **Authentication:** JWT (with optional Auth0 integration)

## Quick Start

### Prerequisites

- Node.js 18 or higher
- PostgreSQL 14 or higher
- Redis (optional)

### Installation

1. **Clone and navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Set up PostgreSQL database:**
   ```sql
   CREATE DATABASE mise_db;
   CREATE USER mise_user WITH PASSWORD 'your_secure_password';
   GRANT ALL PRIVILEGES ON DATABASE mise_db TO mise_user;
   ```

5. **Run migrations (automatic on first start):**
   ```bash
   npm start
   ```

### Development

```bash
npm run dev
```

The server will start on `http://localhost:3001` with auto-reload on file changes.

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `3001` |
| `NODE_ENV` | Environment | `development` |
| `DB_HOST` | PostgreSQL host | `localhost` |
| `DB_PORT` | PostgreSQL port | `5432` |
| `DB_NAME` | Database name | `mise_db` |
| `DB_USER` | Database user | `mise_user` |
| `DB_PASSWORD` | Database password | - |
| `JWT_SECRET` | JWT signing secret | - |
| `JWT_EXPIRES_IN` | JWT expiration | `7d` |
| `REDIS_HOST` | Redis host | `localhost` |
| `REDIS_PORT` | Redis port | `6379` |
| `CLAUDE_API_KEY` | Anthropic Claude API key | - |
| `ELEVENLABS_API_KEY` | ElevenLabs API key | - |
| `INSTACART_API_KEY` | Instacart API key | - |

## API Endpoints

### Authentication

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/auth/signup` | Register new user | No |
| POST | `/api/auth/login` | User login | No |
| POST | `/api/auth/refresh` | Refresh JWT token | No |
| GET | `/api/auth/me` | Get current user | Yes |
| PUT | `/api/auth/profile` | Update user profile | Yes |
| DELETE | `/api/auth/account` | Delete user account | Yes |

### Recipes

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/recipes` | Get user's recipes | Yes |
| GET | `/api/recipes/public` | Get public recipes | No |
| GET | `/api/recipes/:id` | Get recipe by ID | No* |
| POST | `/api/recipes` | Create new recipe | Yes |
| PUT | `/api/recipes/:id` | Update recipe | Yes |
| DELETE | `/api/recipes/:id` | Delete recipe | Yes |
| POST | `/api/recipes/:id/fork` | Fork a recipe | Yes |
| POST | `/api/recipes/capture` | Upload video/image for AI parsing | Yes |
| POST | `/api/recipes/from-url` | Extract recipe from URL | Yes |

*Public recipes or owned by authenticated user

### Cooking

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/cook/:recipeId/start` | Start cooking session | Yes |
| GET | `/api/cook/session/:sessionId` | Get session state | Yes |
| PATCH | `/api/cook/session/:sessionId/step` | Update current step | Yes |
| POST | `/api/cook/:recipeId/ask` | Ask AI question during cooking | Yes |
| POST | `/api/cook/session/:sessionId/complete` | Complete cooking session | Yes |
| GET | `/api/cook/history` | Get cooking history | Yes |
| GET | `/api/cook/session/:sessionId/timers` | Get active timers | Yes |

### Grocery

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/grocery/list` | Get grocery list | Yes |
| POST | `/api/grocery/list` | Create grocery list | Yes |
| PUT | `/api/grocery/list/:listId` | Update list name | Yes |
| DELETE | `/api/grocery/list/:listId` | Delete grocery list | Yes |
| POST | `/api/grocery/add-from-recipe` | Add recipe ingredients | Yes |
| POST | `/api/grocery/list/:listId/items` | Add custom item | Yes |
| PATCH | `/api/grocery/items/:itemId` | Update item | Yes |
| DELETE | `/api/grocery/items/:itemId` | Remove item | Yes |
| POST | `/api/grocery/clear-checked` | Clear checked items | Yes |
| POST | `/api/grocery/checkout` | Generate Instacart link | Yes |
| GET | `/api/grocery/instacart/products` | Search Instacart products | Yes |

## Database Schema

### Tables

- **users** - User accounts and profiles
- **refresh_tokens** - JWT refresh tokens
- **recipes** - Recipe metadata
- **ingredients** - Recipe ingredients
- **cooking_steps** - Recipe cooking steps
- **recipe_collections** - User recipe collections
- **recipe_collection_items** - Collection-recipe associations
- **recipe_ratings** - User recipe ratings
- **cooking_sessions** - Active/completed cooking sessions
- **grocery_lists** - User grocery lists
- **grocery_list_items** - Grocery list items
- **recipe_version_history** - Recipe change history

## AI Integration (Pending)

The following endpoints are prepared for AI integration:

### Claude API (Recipe Parsing)
- `POST /api/recipes/capture` - Parse video/image uploads
- `POST /api/recipes/from-url` - Extract recipes from URLs
- `POST /api/cook/:recipeId/ask` - AI-powered cooking Q&A

### ElevenLabs API (Voice)
- Voice narration for cooking steps
- Text-to-speech for AI responses

### Instacart API (Grocery)
- `POST /api/grocery/checkout` - Pre-filled cart generation
- `GET /api/grocery/instacart/products` - Product search

## License

MIT