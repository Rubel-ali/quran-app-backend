import { query, queryOne } from "./client";

// ─── Surah ───

export async function getAllSurahs() {
  return query(
    `SELECT 
        number,
        name,
        english_name AS "englishName",
        english_name_translation AS "englishNameTranslation",
        number_of_ayahs AS "numberOfAyahs",
        revelation_type AS "revelationType"
     FROM surahs
     ORDER BY number`,
  );
}

export async function getSurahByNumber(number: number) {
  return queryOne(
    `SELECT 
        number,
        name,
        english_name AS "englishName",
        english_name_translation AS "englishNameTranslation",
        number_of_ayahs AS "numberOfAyahs",
        revelation_type AS "revelationType"
     FROM surahs
     WHERE number = $1`,
    [number],
  );
}

// ─── Ayah ───

export async function getAyahsBySurah(surahNumber: number) {
  return query(
    `SELECT 
        a.id,
        a.number,
        a.number_in_surah AS "numberInSurah",
        a.arabic_text AS "arabicText",
        a.translation_text AS "translationText",
        a.surah_number AS "surahNumber",
        a.juz,
        a.page,
        a.ruku,

        s.name AS "surahName",
        s.english_name AS "surahEnglishName"

     FROM ayahs a
     JOIN surahs s ON s.number = a.surah_number
     WHERE a.surah_number = $1
     ORDER BY a.number_in_surah`,
    [surahNumber],
  );
}

// ─── Search ──

export async function searchAyahs(q: string, limit: number, offset: number) {
  return query(
    `SELECT
        a.id,
        a.number,
        a.number_in_surah AS "numberInSurah",
        a.arabic_text AS "arabicText",
        a.translation_text AS "translationText",
        a.surah_number AS "surahNumber",
        a.juz,
        a.page,
        a.ruku,

        s.name AS "surahName",
        s.english_name AS "surahEnglishName",
        s.number_of_ayahs AS "numberOfAyahs",
        s.revelation_type AS "revelationType",

        ts_rank(
          to_tsvector('english', a.translation_text),
          plainto_tsquery('english', $1)
        ) AS rank

     FROM ayahs a
     JOIN surahs s ON s.number = a.surah_number

     WHERE
       to_tsvector('english', a.translation_text)
       @@ plainto_tsquery('english', $1)

       OR a.arabic_text ILIKE $2

     ORDER BY rank DESC, a.number
     LIMIT $3 OFFSET $4`,
    [q, `%${q}%`, limit, offset],
  );
}

export async function countSearchAyahs(q: string): Promise<number> {
  const row = await queryOne<{ count: string }>(
    `SELECT COUNT(*) AS count
     FROM ayahs a
     WHERE
       to_tsvector('english', a.translation_text)
       @@ plainto_tsquery('english', $1)

       OR a.arabic_text ILIKE $2`,
    [q, `%${q}%`],
  );

  return Number(row?.count ?? 0);
}

// ─── User Settings ───

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
      (
        user_id,
        arabic_font,
        arabic_font_size,
        translation_font_size,
        show_translation,
        show_transliteration,
        reading_mode
      )

     VALUES ($1, $2, $3, $4, $5, $6, $7)

     ON CONFLICT (user_id)
     DO UPDATE SET
       arabic_font = EXCLUDED.arabic_font,
       arabic_font_size = EXCLUDED.arabic_font_size,
       translation_font_size = EXCLUDED.translation_font_size,
       show_translation = EXCLUDED.show_translation,
       show_transliteration = EXCLUDED.show_transliteration,
       reading_mode = EXCLUDED.reading_mode,
       updated_at = NOW()

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

// ─── Bookmark ────

export async function getBookmarks(userId: string) {
  return query(
    `SELECT
       b.id, b.user_id, b.surah_number, b.ayah_number_in_surah,
       b.note, b.created_at,
       a.arabic_text, a.translation_text, a.number,
       s.name AS surah_name, s.english_name AS surah_english_name
     FROM bookmarks b
     JOIN ayahs a
       ON a.surah_number = b.surah_number
      AND a.number_in_surah = b.ayah_number_in_surah
     JOIN surahs s ON s.number = b.surah_number
     WHERE b.user_id = $1
     ORDER BY b.created_at DESC`,
    [userId],
  );
}

export async function addBookmark(
  userId: string,
  surahNumber: number,
  ayahNumber: number,
  note?: string,
) {
  return queryOne(
    `INSERT INTO bookmarks (user_id, surah_number, ayah_number_in_surah, note)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (user_id, surah_number, ayah_number_in_surah) DO NOTHING
     RETURNING *`,
    [userId, surahNumber, ayahNumber, note ?? null],
  );
}

export async function removeBookmark(
  userId: string,
  surahNumber: number,
  ayahNumber: number,
): Promise<boolean> {
  const row = await queryOne(
    `DELETE FROM bookmarks
     WHERE user_id = $1 AND surah_number = $2 AND ayah_number_in_surah = $3
     RETURNING id`,
    [userId, surahNumber, ayahNumber],
  );
  return !!row;
}
