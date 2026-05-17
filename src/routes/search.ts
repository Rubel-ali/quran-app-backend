import { Hono } from "hono";
import { searchAyahs, countSearchAyahs } from "../db/queries";

const router = new Hono();

// GET /api/search?q=mercy&limit=20&offset=0
router.get("/", async (c) => {
  const q = c.req.query("q")?.trim() ?? "";
  const limit = Math.min(Number(c.req.query("limit") ?? 20), 50);
  const offset = Number(c.req.query("offset") ?? 0);

  if (!q || q.length < 2) {
    return c.json({ success: false, error: "Query must be at least 2 characters" }, 400);
  }

  const [results, total] = await Promise.all([
    searchAyahs(q, limit, offset),
    countSearchAyahs(q),
  ]);

  return c.json({
    success: true,
    data: results,
    meta: {
      total,
      limit,
      offset,
      query: q,
      hasMore: offset + limit < total,
    },
  });
});

export default router;
