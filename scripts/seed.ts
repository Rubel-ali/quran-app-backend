import "dotenv/config";
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const API = "https://api.alquran.cloud/v1";

async function fetchWithRetry(url: string, retries = 3): Promise<any> {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      if (i === retries - 1) throw err;
      console.log(`  Retry ${i + 1}/${retries}...`);
      await new Promise((r) => setTimeout(r, 1500 * (i + 1)));
    }
  }
}

async function seed() {
  console.log("🌱 Seeding database...\n");
  const client = await pool.connect();

  try {
    // ── Surahs ──────────────────────────────────────────────────────────────
    console.log("📚 Fetching 114 surahs...");
    const surahData = await fetchWithRetry(`${API}/surah`);

    for (const s of surahData.data) {
      await client.query(
        `INSERT INTO surahs
           (number, name, english_name, english_name_translation, number_of_ayahs, revelation_type)
         VALUES ($1,$2,$3,$4,$5,$6)
         ON CONFLICT (number) DO NOTHING`,
        [
          s.number,
          s.name,
          s.englishName,
          s.englishNameTranslation,
          s.numberOfAyahs,
          s.revelationType === "Meccan" ? "Meccan" : "Medinan",
        ]
      );
    }
    console.log(`  ✅ ${surahData.data.length} surahs inserted\n`);

    // ── Ayahs ────────────────────────────────────────────────────────────────
    console.log("📖 Fetching all ayahs (Arabic + Translation)...");
    console.log("   This takes ~60 seconds, please wait...\n");

    const [arabicData, translationData] = await Promise.all([
      fetchWithRetry(`${API}/quran/quran-uthmani`),
      fetchWithRetry(`${API}/quran/en.sahih`),
    ]);

    const arabicSurahs = arabicData.data.surahs;
    const translationSurahs = translationData.data.surahs;
    let totalAyahs = 0;

    for (let i = 0; i < arabicSurahs.length; i++) {
      const ar = arabicSurahs[i];
      const tr = translationSurahs[i];

      process.stdout.write(
        `  Surah ${String(ar.number).padStart(3, " ")} ${ar.englishName.padEnd(25)} `
      );

      for (let j = 0; j < ar.ayahs.length; j++) {
        const ayah = ar.ayahs[j];
        await client.query(
          `INSERT INTO ayahs
             (number, number_in_surah, surah_number, arabic_text,
              translation_text, juz, page, ruku)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
           ON CONFLICT (number) DO NOTHING`,
          [
            ayah.number,
            ayah.numberInSurah,
            ar.number,
            ayah.text,
            tr.ayahs[j]?.text ?? "",
            ayah.juz,
            ayah.page,
            ayah.ruku,
          ]
        );
      }

      totalAyahs += ar.ayahs.length;
      process.stdout.write(`${ar.ayahs.length} ayahs ✓\n`);
    }

    console.log(`\n✅ ${totalAyahs} ayahs seeded across 114 surahs`);
    console.log("🎉 Database seeding complete!\n");
  } catch (err) {
    console.error("❌ Seeding failed:", err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
