/* Checks src/data/quran.json: 114 surahs, 6236 ayahs, no empty text,
   and the known first and last surahs are correct.

   Usage: npm run quran:check
   Exit code 0 = OK, 1 = problem found.                                         */

const fs = require("fs");
const path = require("path");

const FILE = process.env.QURAN_FILE || path.join(__dirname, "..", "src", "data", "quran.json");
const BISMILLAH_START = "بِسْمِ";
let problems = [];
const bad = (msg) => problems.push(msg);

if (!fs.existsSync(FILE)) {
  console.error(`No Quran file found at ${FILE}.\nRun "npm run quran:download" first (it needs internet once).`);
  process.exit(1);
}

let data;
try {
  data = JSON.parse(fs.readFileSync(FILE, "utf8"));
} catch (err) {
  console.error(`The Quran file is damaged and cannot be read (${err.message}). Run "npm run quran:download" again.`);
  process.exit(1);
}

const surahs = Array.isArray(data.surahs) ? data.surahs : [];
if (surahs.length !== 114) bad(`expected 114 surahs, found ${surahs.length}`);

let ayahs = 0;
surahs.forEach((s, i) => {
  if (s.number !== i + 1) bad(`surah at position ${i + 1} is numbered ${s.number}`);
  if (!s.name || !s.englishName) bad(`surah ${s.number} has no name`);
  if (!Array.isArray(s.ayahs) || s.ayahs.length === 0) { bad(`surah ${s.number} has no ayahs`); return; }
  if (s.numberOfAyahs !== s.ayahs.length) bad(`surah ${s.number}: numberOfAyahs (${s.numberOfAyahs}) does not match ${s.ayahs.length} ayahs`);
  s.ayahs.forEach((a, k) => {
    ayahs++;
    if (a.numberInSurah !== k + 1) bad(`surah ${s.number}: ayah at position ${k + 1} is numbered ${a.numberInSurah}`);
    for (const field of ["ar", "en", "ur"]) {
      if (typeof a[field] !== "string" || a[field].trim() === "") bad(`surah ${s.number}, ayah ${k + 1}: ${field} text is empty`);
    }
  });
});

if (ayahs !== 6236) bad(`expected 6236 ayahs in total, found ${ayahs}`);

const fatiha = surahs[0];
if (fatiha) {
  if (fatiha.ayahs.length !== 7) bad(`Al-Fatiha should have 7 ayahs, found ${fatiha.ayahs.length}`);
  if (!fatiha.ayahs[0].ar.startsWith(BISMILLAH_START)) bad("Al-Fatiha, ayah 1 does not start with the Bismillah");
}
const nas = surahs[113];
if (nas && nas.ayahs.length !== 6) bad(`An-Nas should have 6 ayahs, found ${nas.ayahs.length}`);

if (problems.length) {
  console.error("Quran file has problems:");
  problems.slice(0, 20).forEach((p) => console.error("  - " + p));
  if (problems.length > 20) console.error(`  ...and ${problems.length - 20} more`);
  console.error('Run "npm run quran:download" again to replace the file.');
  process.exit(1);
}

console.log(`OK: ${surahs.length} surahs, ${ayahs} ayahs, Arabic + English + Urdu. Downloaded ${data.meta?.downloadedAt || "(unknown date)"}.`);
