import "dotenv/config";
import { serve } from "@hono/node-server";
import { Hono } from "hono";

import {
  corsMiddleware,
  loggerMiddleware,
  errorHandler,
} from "./middleware/index";

import surahRouter from "./routes/surah";
import searchRouter from "./routes/search";
import audioRouter from "./routes/audio";
import bookmarkRouter from "./routes/bookmark";
import settingsRouter from "./routes/settings";

const app = new Hono();

// ── Global middleware ──
app.use("*", corsMiddleware);
app.use("*", loggerMiddleware);
app.use("*", errorHandler);

// ── Health check ───
app.get("/", (c) =>
  c.json({
    name: "Quran API",
    version: "1.0.0",
    status: "ok",
    endpoints: [
      "GET  /api/surahs",
      "GET  /api/surahs/:number",
      "GET  /api/surahs/:number/ayahs",
      "GET  /api/search?q=:query&limit=20&offset=0",
      "GET  /api/audio/reciters",
      "GET  /api/audio/:surah",
      "GET  /api/audio/:surah/:ayah?reciter=abdul_basit",
      "GET  /api/bookmarks        [X-User-Id required]",
      "POST /api/bookmarks        [X-User-Id required]",
      "DEL  /api/bookmarks/:s/:a  [X-User-Id required]",
      "GET  /api/settings         [X-User-Id required]",
      "PUT  /api/settings         [X-User-Id required]",
    ],
  }),
);

app.get("/health", (c) =>
  c.json({
    status: "ok",
    timestamp: new Date().toISOString(),
  }),
);

// ── Routes ───
app.route("/api/surahs", surahRouter);
app.route("/api/search", searchRouter);
app.route("/api/audio", audioRouter);
app.route("/api/bookmarks", bookmarkRouter);
app.route("/api/settings", settingsRouter);

// ── 404 ──
app.notFound((c) =>
  c.json(
    {
      success: false,
      error: "Route not found",
    },
    404,
  ),
);

if (process.env.NODE_ENV !== "production") {
  const PORT = Number(process.env.PORT ?? 3001);

  serve(
    {
      fetch: app.fetch,
      port: PORT,
    },
    () => {
      console.log(`Quran API running → http://localhost:${PORT}`);
    },
  );
}

export default app;
