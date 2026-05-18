# Quran Backend API

Node.js + Hono + PostgreSQL backend for the Quran Web Application.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js v20+ |
| Framework | Hono v4 |
| Database | PostgreSQL |
| Language | TypeScript |
| Dev runner | tsx (hot reload) |

---

## Setup

### 1. Install dependencies
```bash
npm install
```

### 2. PostgreSQL database Create
```sql
CREATE DATABASE quran_db;
```

### 3. .env file Create
```bash
cp .env.example .env
```

`.env` Enter your info at:
```env
DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/quran_db
PORT=3001
FRONTEND_URL=http://localhost:3000
```

### 4. Tables Create
```bash
npm run db:migrate
```

### 5. Data seed Do (only needed once)
```bash
npm run db:seed
```
> Fetch all 6236 verses from AlQuran.cloud and insert them into PostgreSQL. It will take ~60 seconds.

### 6. Start the server
```bash
# Development (hot reload)
npm run dev

# Production build
npm run build
npm start
```

Server: `http://localhost:3001`

---

## API Endpoints

### Health
```
GET /          → API info + endpoint list
GET /health    → status check
```

### Surahs
```
GET /api/surahs                  → সব ১১৪ সুরা
GET /api/surahs/:number          → একটা সুরার info
GET /api/surahs/:number/ayahs    → সুরার সব আয়াত + Arabic + Translation
```

### Search
```
GET /api/search?q=mercy&limit=20&offset=0
```
PostgreSQL full-text search — Arabic বা English উভয়ে কাজ করে।

### Audio
```
GET /api/audio/reciters                          → available reciters list
GET /api/audio/:surah?reciter=abdul_basit        → full surah playlist
GET /api/audio/:surah/:ayah?reciter=mishary      → single ayah URL
```

Available reciters: `abdul_basit`, `mishary`, `sudais`

### Bookmarks (X-User-Id header required)
```
GET    /api/bookmarks            → user এর সব bookmark
POST   /api/bookmarks            → bookmark add
DELETE /api/bookmarks/:s/:a      → bookmark remove
```

POST body:
```json
{
  "surah_number": 2,
  "ayah_number_in_surah": 255,
  "note": "Ayat ul Kursi"
}
```

### Settings (X-User-Id header required)
```
GET /api/settings    → user settings load
PUT /api/settings    → user settings save
```

PUT body:
```json
{
  "arabic_font": "KFGQ",
  "arabic_font_size": 40,
  "translation_font_size": 18,
  "show_translation": true,
  "show_transliteration": false,
  "reading_mode": "translation"
}
```

---

## Project Structure

```
src/
├── index.ts              # Hono app + Node.js server
├── db/
│   ├── client.ts         # pg Pool + query helpers
│   └── queries.ts        # সব SQL queries
├── routes/
│   ├── surah.ts
│   ├── search.ts
│   ├── audio.ts
│   ├── bookmark.ts
│   └── settings.ts
├── middleware/
│   └── index.ts          # CORS, logger, error, userId
└── types/
    └── index.ts

scripts/
├── migrate.ts            # Table তৈরি
└── seed.ts               # Data insert
```

## Deploy (Railway / Render)

1. GitHub push
2. Railway/Render connect
3. Environment variables set:
   - `DATABASE_URL` (platform will provide)
   - `PORT=3001`
   - `FRONTEND_URL=https://quran-app-flax-nu.vercel.app`
4. Build: `npm install && npm run build`
5. Start: `npm start`
6. First deploy এর পর: `npm run db:migrate && npm run db:seed`

