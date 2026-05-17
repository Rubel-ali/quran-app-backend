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
