import "dotenv/config";
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { corsMiddleware, loggerMiddleware, errorHandler } from "./middleware/index";
import surahRouter from "./routes/surah";

const app = new Hono();

// ── Global middleware ───
app.use("*", corsMiddleware);
app.use("*", loggerMiddleware);
app.use("*", errorHandler);

// ── Health check ────
app.get("/", (c) =>
  c.json({
    name: "Quran API",
    version: "1.0.0",
    status: "ok",
    endpoints: [
      "GET  /api/surahs"
    ],
  })
);

app.get("/health", (c) =>
  c.json({ status: "ok", timestamp: new Date().toISOString() })
);

// ── Routes ─────
app.route("/api/surahs", surahRouter);

// ── 404 ──────
app.notFound((c) =>
  c.json({ success: false, error: "Route not found" }, 404)
);

// ── Start ────
const PORT = Number(process.env.PORT ?? 3001);

serve({ fetch: app.fetch, port: PORT }, () => {
  console.log(`🕌 Quran API running → http://localhost:${PORT}`);
});
