import { Hono } from "hono";
import { getSurahByNumber } from "../db/queries";

const router = new Hono();

const RECITERS = {
  abdul_basit: {
    id: "abdul_basit",
    name: "Abdul Basit Murattal",
    baseUrl: "https://everyayah.com/data/Abdul_Basit_Murattal_64kbps",
    bitrate: "64kbps",
  },
  mishary: {
    id: "mishary",
    name: "Mishary Rashid Alafasy",
    baseUrl: "https://everyayah.com/data/Mishary_Rashid_Alafasy_128kbps",
    bitrate: "128kbps",
  },
  sudais: {
    id: "sudais",
    name: "Abdurrahman As-Sudais",
    baseUrl: "https://everyayah.com/data/Abdurrahmaan_As-Sudais_192kbps",
    bitrate: "192kbps",
  },
} as const;

type ReciterId = keyof typeof RECITERS;

function buildUrl(reciterId: ReciterId, surah: number, ayah: number) {
  const s = String(surah).padStart(3, "0");
  const a = String(ayah).padStart(3, "0");
  return `${RECITERS[reciterId].baseUrl}/${s}${a}.mp3`;
}

// GET /api/audio/reciters
router.get("/reciters", (c) => {
  return c.json({ success: true, data: Object.values(RECITERS) });
});

// GET /api/audio/:surah  → full surah playlist
router.get("/:surah", async (c) => {
  const surahNumber = Number(c.req.param("surah"));
  const reciterId = (c.req.query("reciter") ?? "abdul_basit") as ReciterId;

  if (isNaN(surahNumber) || surahNumber < 1 || surahNumber > 114) {
    return c.json({ success: false, error: "Invalid surah number" }, 400);
  }
  if (!RECITERS[reciterId]) {
    return c.json(
      {
        success: false,
        error: `Invalid reciter. Options: ${Object.keys(RECITERS).join(", ")}`,
      },
      400,
    );
  }

  const surah = await getSurahByNumber(surahNumber);
  if (!surah) return c.json({ success: false, error: "Surah not found" }, 404);

  const playlist = Array.from({ length: surah.number_of_ayahs }, (_, i) => ({
    ayah_number: i + 1,
    url: buildUrl(reciterId, surahNumber, i + 1),
  }));

  return c.json({
    success: true,
    data: {
      surah_number: surahNumber,
      surah_name: surah.english_name,
      reciter: RECITERS[reciterId],
      playlist,
    },
    meta: { total: playlist.length },
  });
});

// GET /api/audio/:surah/:ayah  → single ayah audio URL
router.get("/:surah/:ayah", async (c) => {
  const surahNumber = Number(c.req.param("surah"));
  const ayahNumber = Number(c.req.param("ayah"));
  const reciterId = (c.req.query("reciter") ?? "abdul_basit") as ReciterId;

  if (isNaN(surahNumber) || surahNumber < 1 || surahNumber > 114) {
    return c.json({ success: false, error: "Invalid surah number" }, 400);
  }
  if (isNaN(ayahNumber) || ayahNumber < 1) {
    return c.json({ success: false, error: "Invalid ayah number" }, 400);
  }
  if (!RECITERS[reciterId]) {
    return c.json({ success: false, error: "Invalid reciter" }, 400);
  }

  const surah = await getSurahByNumber(surahNumber);
  if (!surah) return c.json({ success: false, error: "Surah not found" }, 404);

  if (ayahNumber > surah.number_of_ayahs) {
    return c.json(
      {
        success: false,
        error: `Ayah ${ayahNumber} out of range. Surah has ${surah.number_of_ayahs} ayahs.`,
      },
      400,
    );
  }

  return c.json({
    success: true,
    data: {
      url: buildUrl(reciterId, surahNumber, ayahNumber),
      surah_number: surahNumber,
      ayah_number: ayahNumber,
      reciter: RECITERS[reciterId],
    },
  });
});

export default router;
