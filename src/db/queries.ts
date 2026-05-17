
import { query } from "./client";

// ─── Surah ──

export async function getAllSurahs() {
  return query(
    `SELECT number, name, english_name, english_name_translation,
            number_of_ayahs, revelation_type
     FROM surahs ORDER BY number`,
  );
}


