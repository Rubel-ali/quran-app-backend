export interface Surah {
  number: number;
  name: string;
  english_name: string;
  english_name_translation: string;
  number_of_ayahs: number;
  revelation_type: "Meccan" | "Medinan";
}

export interface Ayah {
  id: number;
  number: number;
  number_in_surah: number;
  arabic_text: string;
  translation_text: string;
  surah_number: number;
  surah_name: string;
  surah_english_name: string;
  juz: number;
  page: number;
  ruku: number;
}

