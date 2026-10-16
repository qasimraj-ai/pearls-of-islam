/* Quran data for the Quran page.
   1. If src/data/quran.json exists (made by "npm run quran:download"), it is used. No internet is needed for text.
   2. Otherwise the text is downloaded from the internet, as before.
   Audio (recitation) always needs the internet. */
import { QURAN_API } from "./constants";

// empty object if the file has not been downloaded yet; the build still works
const bundled = import.meta.glob("../data/quran.json");

let localPromise = null;
function loadLocalQuran() {
  if (!localPromise) {
    const loader = bundled["../data/quran.json"];
    localPromise = loader ? loader().then((m) => m.default).catch(() => null) : Promise.resolve(null);
  }
  return localPromise;
}

const fromNetwork = (url) => fetch(url).then((r) => r.json());

/* same shape as the online API: { data: [...] } */
export async function fetchSurahList() {
  const local = await loadLocalQuran();
  if (!local) return fromNetwork(`${QURAN_API}/surah`);
  return {
    code: 200,
    data: local.surahs.map((s) => ({
      number: s.number, name: s.name, englishName: s.englishName, englishNameTranslation: s.englishNameTranslation,
      numberOfAyahs: s.numberOfAyahs, revelationType: s.revelationType,
    })),
  };
}

/* same shape as the online API: { data: [arabicEdition, englishEdition] } */
export async function fetchSurahText(n) {
  const local = await loadLocalQuran();
  if (!local) return fromNetwork(`${QURAN_API}/surah/${n}/editions/quran-uthmani,en.sahih`);
  const s = local.surahs[n - 1];
  if (!s) throw new Error(`Surah ${n} is missing from the downloaded Quran`);
  const meta = { name: s.name, englishName: s.englishName, englishNameTranslation: s.englishNameTranslation, revelationType: s.revelationType, numberOfAyahs: s.numberOfAyahs };
  return {
    code: 200,
    data: [
      { ...meta, ayahs: s.ayahs.map((a) => ({ numberInSurah: a.numberInSurah, text: a.ar })) },
      { ...meta, ayahs: s.ayahs.map((a) => ({ numberInSurah: a.numberInSurah, text: a.en })) },
    ],
  };
}

/* same shape as the online API: { data: { ayahs: [{ text }] } } */
export async function fetchUrdu(n, edition) {
  const local = await loadLocalQuran();
  if (!local || edition !== "ur.jalandhry") return fromNetwork(`${QURAN_API}/surah/${n}/${edition}`);
  const s = local.surahs[n - 1];
  if (!s) throw new Error(`Surah ${n} is missing from the downloaded Quran`);
  return { code: 200, data: { ayahs: s.ayahs.map((a) => ({ text: a.ur })) } };
}

/* Where each of the 30 juz (para) begins: [surah, ayah]. Standard Madani mushaf. */
export const JUZ_STARTS = [
  [1, 1], [2, 142], [2, 253], [3, 93], [4, 24], [4, 148], [5, 82], [6, 111], [7, 88], [8, 41],
  [9, 93], [11, 6], [12, 53], [15, 1], [17, 1], [18, 75], [21, 1], [23, 1], [25, 21], [27, 56],
  [29, 46], [33, 31], [36, 28], [39, 32], [41, 47], [46, 1], [51, 31], [58, 1], [67, 1], [78, 1],
];

/* Splits the Quran into juz. Returns [{ juz, parts: [{ surah, from, to }] }] using the surah list (needs numberOfAyahs). */
export function buildJuz(surahs) {
  if (!surahs.length) return [];
  const count = (n) => surahs[n - 1]?.numberOfAyahs || 0;
  return JUZ_STARTS.map(([s0, a0], i) => {
    const next = JUZ_STARTS[i + 1]; // undefined for juz 30
    const [s1, a1] = next || [114, count(114) + 1]; // the next juz begins here, so this one ends just before it
    const parts = [];
    for (let sn = s0; sn <= s1; sn++) {
      const from = sn === s0 ? a0 : 1;
      const to = sn === s1 ? a1 - 1 : count(sn);
      if (to >= from) parts.push({ surah: sn, from, to });
    }
    return { juz: i + 1, parts };
  });
}
