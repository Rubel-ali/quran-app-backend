import { Hono } from "hono";
import { getAllSurahs, getSurahByNumber, getAyahsBySurah } from "../db/queries";

const router = new Hono();

// GET /api/surahs
router.get("/", async (c) => {
  const surahs = await getAllSurahs();
  return c.json({
    success: true,
    data: surahs,
    meta: { total: surahs.length },
  });
});

// GET /api/surahs/:number
router.get("/:number", async (c) => {
  const number = Number(c.req.param("number"));
  if (isNaN(number) || number < 1 || number > 114) {
    return c.json(
      { success: false, error: "Invalid surah number (1–114)" },
      400,
    );
  }
  const surah = await getSurahByNumber(number);
  if (!surah) return c.json({ success: false, error: "Surah not found" }, 404);
  return c.json({ success: true, data: surah });
});

// GET /api/surahs/:number/ayahs
router.get("/:number/ayahs", async (c) => {
  const number = Number(c.req.param("number"));
  if (isNaN(number) || number < 1 || number > 114) {
    return c.json(
      { success: false, error: "Invalid surah number (1–114)" },
      400,
    );
  }
  const surah = await getSurahByNumber(number);
  if (!surah) return c.json({ success: false, error: "Surah not found" }, 404);
  const ayahs = await getAyahsBySurah(number);
  return c.json({
    success: true,
    data: { surah, ayahs },
    meta: { total: ayahs.length },
  });
});

export default router;
