/* Downloads the complete Quran (Arabic, English and Urdu) once, and saves it
   to src/data/quran.json so the Quran page works without internet.

   Usage:   npm run quran:download
   Needs:   Node.js 18 or newer, and an internet connection.
   Source:  alquran.cloud (Tanzil "Uthmani" Arabic text, Sahih International English,
            Jalandhry Urdu translation). Change the editions below if you prefer others.

   Optional environment variables (used for testing):
     QURAN_API_BASE   default https://api.alquran.cloud/v1
     QURAN_OUT        default src/data/quran.json                                        */

const fs = require("fs");
const path = require("path");

const BASE = (process.env.QURAN_API_BASE || "https://api.alquran.cloud/v1").replace(/\/$/, "");
const OUT = process.env.QURAN_OUT || path.join(__dirname, "..", "src", "data", "quran.json");
const EDITIONS = { ar: "quran-uthmani", en: "en.sahih", ur: "ur.jalandhry" };
const TOTAL_SURAHS = 114;
const TOTAL_AYAHS = 6236;

function fail(message) {
  console.error("\nERROR: " + message);
  process.exit(1);
}

if (typeof fetch !== "function") {
  fail(`This script needs Node.js 18 or newer. Your version is ${process.version}. Install the newest LTS version from https://nodejs.org and try again.`);
}

async function getEdition(edition) {
  const url = `${BASE}/quran/${edition}`;
  let lastError = "unknown error";
  for (let attempt = 1; attempt <= 4; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 60000);
    try {
      const res = await fetch(url, { signal: controller.signal, headers: { Accept: "application/json" } });
      if (!res.ok) throw new Error(`the server answered with HTTP ${res.status}`);
      const json = await res.json();
      if (json.code !== 200 || !json.data || !Array.isArray(json.data.surahs)) {
        throw new Error("the server sent an unexpected reply");
      }
      return json.data.surahs;
    } catch (err) {
      lastError = err.name === "AbortError" ? "the download timed out" : err.message;
      console.log(`  attempt ${attempt} failed: ${lastError}`);
      if (attempt < 4) await new Promise((r) => setTimeout(r, 1500 * attempt));
    } finally {
      clearTimeout(timer);
    }
  }
  fail(`could not download "${edition}" (${lastError}). Check your internet connection, then run "npm run quran:download" again.`);
}

function checkTexts(surahs, label) {
  let count = 0;
  for (const s of surahs) {
    for (const a of s.ayahs) {
      if (typeof a.text !== "string" || a.text.trim() === "") {
        fail(`${label}: surah ${s.number}, ayah ${a.numberInSurah} is empty.`);
      }
      count++;
    }
  }
  return count;
}

async function main() {
  console.log(`Downloading the Quran from ${BASE}`);
  const raw = {};
  for (const [lang, edition] of Object.entries(EDITIONS)) {
    console.log(`- ${lang === "ar" ? "Arabic" : lang === "en" ? "English" : "Urdu"} (${edition})`);
    raw[lang] = await getEdition(edition);
  }

  const ar = raw.ar, en = raw.en, ur = raw.ur;
  if (ar.length !== TOTAL_SURAHS) fail(`expected ${TOTAL_SURAHS} surahs, received ${ar.length}.`);
  if (en.length !== TOTAL_SURAHS || ur.length !== TOTAL_SURAHS) fail("the three editions do not have the same number of surahs.");

  // Keep the Arabic exactly as published. The app removes the Bismillah heading when it displays the text.
  const surahs = ar.map((s, i) => {
    const e = en[i], u = ur[i];
    if (s.number !== i + 1 || e.number !== s.number || u.number !== s.number) fail(`surah ${i + 1} is not in the same order in every edition.`);
    if (e.ayahs.length !== s.ayahs.length || u.ayahs.length !== s.ayahs.length) fail(`surah ${s.number} has a different number of ayahs in some editions.`);
    return {
      number: s.number,
      name: s.name,
      englishName: s.englishName,
      englishNameTranslation: s.englishNameTranslation,
      revelationType: s.revelationType,
      numberOfAyahs: s.ayahs.length,
      ayahs: s.ayahs.map((a, k) => ({
        numberInSurah: a.numberInSurah,
        ar: a.text,
        en: e.ayahs[k].text,
        ur: u.ayahs[k].text,
      })),
    };
  });

  const total = checkTexts(surahs.map((s) => ({ number: s.number, ayahs: s.ayahs.map((a) => ({ numberInSurah: a.numberInSurah, text: a.ar })) })), "Arabic");
  if (total !== TOTAL_AYAHS) fail(`expected ${TOTAL_AYAHS} ayahs in total, found ${total}. The download may be incomplete; run it again.`);

  const file = {
    meta: {
      source: "alquran.cloud",
      editions: EDITIONS,
      surahs: surahs.length,
      ayahs: total,
      downloadedAt: new Date().toISOString(),
    },
    surahs,
  };

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  const tmp = OUT + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(file));
  fs.renameSync(tmp, OUT);
  const kb = Math.round(fs.statSync(OUT).size / 1024);
  console.log(`\nSaved ${surahs.length} surahs and ${total} ayahs to ${path.relative(process.cwd(), OUT) || OUT} (${kb} KB).`);
  console.log('Next: run "npm run quran:check" to verify the file, then "npm run build".');
}

main().catch((err) => fail(err.message || String(err)));
