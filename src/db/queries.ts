import { query, queryOne } from "./client";

// ─── Surah ────────────────────────────────────────────────────────────────────

export async function getAllSurahs() {
  return query(
    `SELECT number, name, english_name, english_name_translation,
            number_of_ayahs, revelation_type
     FROM surahs ORDER BY number`,
  );
}

export async function getSurahByNumber(number: number) {
  return queryOne(
    `SELECT number, name, english_name, english_name_translation,
            number_of_ayahs, revelation_type
     FROM surahs WHERE number = $1`,
    [number],
  );
}

// ─── Ayah ─────────────────────────────────────────────────────────────────────

export async function getAyahsBySurah(surahNumber: number) {
  return query(
    `SELECT a.id, a.number, a.number_in_surah, a.arabic_text,
            a.translation_text, a.surah_number, a.juz, a.page, a.ruku,
            s.name AS surah_name, s.english_name AS surah_english_name
     FROM ayahs a
     JOIN surahs s ON s.number = a.surah_number
     WHERE a.surah_number = $1
     ORDER BY a.number_in_surah`,
    [surahNumber],
  );
}

// ─── Search ───────────────────────────────────────────────────────────────────

export async function searchAyahs(q: string, limit: number, offset: number) {
  return query(
    `SELECT
       a.id, a.number, a.number_in_surah, a.arabic_text,
       a.translation_text, a.surah_number, a.juz, a.page,
       s.name AS surah_name, s.english_name AS surah_english_name,
       s.number_of_ayahs, s.revelation_type,
       ts_rank(
         to_tsvector('english', a.translation_text),
         plainto_tsquery('english', $1)
       ) AS rank
     FROM ayahs a
     JOIN surahs s ON s.number = a.surah_number
     WHERE
       to_tsvector('english', a.translation_text) @@ plainto_tsquery('english', $1)
       OR a.arabic_text ILIKE $2
     ORDER BY rank DESC, a.number
     LIMIT $3 OFFSET $4`,
    [q, `%${q}%`, limit, offset],
  );
}

export async function countSearchAyahs(q: string): Promise<number> {
  const row = await queryOne<{ count: string }>(
    `SELECT COUNT(*) AS count FROM ayahs a
     WHERE
       to_tsvector('english', a.translation_text) @@ plainto_tsquery('english', $1)
       OR a.arabic_text ILIKE $2`,
    [q, `%${q}%`],
  );
  return Number(row?.count ?? 0);
}


// ─── User Settings ────────────────────────────────────────────────────────────

export async function getUserSettings(userId: string) {
  return queryOne(`SELECT * FROM user_settings WHERE user_id = $1`, [userId]);
}

export async function upsertUserSettings(
  userId: string,
  s: {
    arabicFont?: string;
    arabicFontSize?: number;
    translationFontSize?: number;
    showTranslation?: boolean;
    showTransliteration?: boolean;
    readingMode?: string;
  },
) {
  return queryOne(
    `INSERT INTO user_settings
       (user_id, arabic_font, arabic_font_size, translation_font_size,
        show_translation, show_transliteration, reading_mode)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT (user_id) DO UPDATE SET
       arabic_font           = EXCLUDED.arabic_font,
       arabic_font_size      = EXCLUDED.arabic_font_size,
       translation_font_size = EXCLUDED.translation_font_size,
       show_translation      = EXCLUDED.show_translation,
       show_transliteration  = EXCLUDED.show_transliteration,
       reading_mode          = EXCLUDED.reading_mode,
       updated_at            = NOW()
     RETURNING *`,
    [
      userId,
      s.arabicFont ?? "KFGQ",
      s.arabicFontSize ?? 40,
      s.translationFontSize ?? 18,
      s.showTranslation ?? true,
      s.showTransliteration ?? false,
      s.readingMode ?? "translation",
    ],
  );
}
