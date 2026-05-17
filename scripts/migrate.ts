import "dotenv/config";
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function migrate() {
  console.log("🔄 Running migrations...");
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Surahs
    await client.query(`
      CREATE TABLE IF NOT EXISTS surahs (
        number                   INTEGER PRIMARY KEY CHECK (number BETWEEN 1 AND 114),
        name                     TEXT NOT NULL,
        english_name             TEXT NOT NULL,
        english_name_translation TEXT NOT NULL,
        number_of_ayahs          INTEGER NOT NULL,
        revelation_type          TEXT NOT NULL CHECK (revelation_type IN ('Meccan','Medinan')),
        created_at               TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    console.log("  ✅ surahs table ready");

    // Ayahs
    await client.query(`
      CREATE TABLE IF NOT EXISTS ayahs (
        id               SERIAL PRIMARY KEY,
        number           INTEGER NOT NULL UNIQUE,
        number_in_surah  INTEGER NOT NULL,
        surah_number     INTEGER NOT NULL REFERENCES surahs(number),
        arabic_text      TEXT NOT NULL,
        translation_text TEXT NOT NULL,
        juz              INTEGER NOT NULL,
        page             INTEGER NOT NULL,
        ruku             INTEGER NOT NULL,
        created_at       TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_ayahs_surah ON ayahs(surah_number)
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_ayahs_fts
      ON ayahs USING gin(to_tsvector('english', translation_text))
    `);
    console.log("  ✅ ayahs table ready");

    // Bookmarks
    await client.query(`
      CREATE TABLE IF NOT EXISTS bookmarks (
        id                   SERIAL PRIMARY KEY,
        user_id              TEXT NOT NULL,
        surah_number         INTEGER NOT NULL REFERENCES surahs(number),
        ayah_number_in_surah INTEGER NOT NULL,
        note                 TEXT,
        created_at           TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(user_id, surah_number, ayah_number_in_surah)
      )
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_bookmarks_user ON bookmarks(user_id)
    `);
    console.log("  ✅ bookmarks table ready");

    // User Settings
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_settings (
        user_id               TEXT PRIMARY KEY,
        arabic_font           TEXT NOT NULL DEFAULT 'KFGQ',
        arabic_font_size      INTEGER NOT NULL DEFAULT 40 CHECK (arabic_font_size BETWEEN 16 AND 80),
        translation_font_size INTEGER NOT NULL DEFAULT 18 CHECK (translation_font_size BETWEEN 12 AND 32),
        show_translation      BOOLEAN NOT NULL DEFAULT TRUE,
        show_transliteration  BOOLEAN NOT NULL DEFAULT FALSE,
        reading_mode          TEXT NOT NULL DEFAULT 'translation'
                                CHECK (reading_mode IN ('translation','reading')),
        updated_at            TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    console.log("  ✅ user_settings table ready");

    await client.query("COMMIT");
    console.log("\n🎉 Migration complete!");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("❌ Migration failed:", err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
