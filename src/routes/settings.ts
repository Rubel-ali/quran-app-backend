import { Hono } from "hono";
import { userIdMiddleware } from "../middleware/index";
import { getUserSettings, upsertUserSettings } from "../db/queries";


type Variables = {
  userId: string;
};

const router = new Hono<{ Variables: Variables }>();

router.use("/*", userIdMiddleware);

// ─── GET /api/settings ─────────────────────────────
router.get("/", async (c) => {
  const userId = c.get("userId");

  const settings = await getUserSettings(userId);

  if (!settings) {
    return c.json({
      success: true,
      data: {
        user_id: userId,
        arabic_font: "KFGQ",
        arabic_font_size: 40,
        translation_font_size: 18,
        show_translation: true,
        show_transliteration: false,
        reading_mode: "translation",
        updated_at: null,
      },
    });
  }

  return c.json({ success: true, data: settings });
});

// ─── PUT /api/settings ─────────────────────────────
router.put("/", async (c) => {
  const userId = c.get("userId");

  let body: {
    arabic_font?: string;
    arabic_font_size?: number;
    translation_font_size?: number;
    show_translation?: boolean;
    show_transliteration?: boolean;
    reading_mode?: string;
  };

  try {
    body = await c.req.json();
  } catch {
    return c.json({ success: false, error: "Invalid JSON body" }, 400);
  }

  // ─── Validation ─────────────────────────────
  const validFonts = ["KFGQ", "Amiri", "Scheherazade"] as const;

  if (body.arabic_font && !validFonts.includes(body.arabic_font as any)) {
    return c.json(
      {
        success: false,
        error: `arabic_font must be one of: ${validFonts.join(", ")}`,
      },
      400
    );
  }

  if (
    body.arabic_font_size !== undefined &&
    (body.arabic_font_size < 16 || body.arabic_font_size > 80)
  ) {
    return c.json(
      { success: false, error: "arabic_font_size must be between 16 and 80" },
      400
    );
  }

  if (
    body.translation_font_size !== undefined &&
    (body.translation_font_size < 12 || body.translation_font_size > 32)
  ) {
    return c.json(
      {
        success: false,
        error: "translation_font_size must be between 12 and 32",
      },
      400
    );
  }

  const validModes = ["translation", "reading"] as const;

  if (body.reading_mode && !validModes.includes(body.reading_mode as any)) {
    return c.json(
      {
        success: false,
        error: `reading_mode must be one of: ${validModes.join(", ")}`,
      },
      400
    );
  }

  // ─── DB Update ─────────────────────────────
  const settings = await upsertUserSettings(userId, {
    arabicFont: body.arabic_font,
    arabicFontSize: body.arabic_font_size,
    translationFontSize: body.translation_font_size,
    showTranslation: body.show_translation,
    showTransliteration: body.show_transliteration,
    readingMode: body.reading_mode,
  });

  return c.json({ success: true, data: settings });
});

export default router;