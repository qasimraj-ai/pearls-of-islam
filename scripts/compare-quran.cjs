/* Compares the Arabic text in src/data/quran.json with a second Quran source
   (the Quran.com API) verse by verse, and writes a report.

   Usage:
     npm run quran:compare            all 114 surahs (takes a few minutes)
     npm run quran:compare -- 114     one surah
     npm run quran:compare -- 1-10    a range of surahs

   What it ignores (these are spelling styles, not different words):
     harakat (vowel marks), tanween, sukun, shadda, small letters, verse-number
     symbols, tatweel (the stretching line), and the difference between alif forms
     (أ إ آ ٱ ا). Only the letters themselves are compared.

   Result:
     Report file: scripts/quran-compare-report.txt
     Exit code 0 = no real differences, 1 = differences found, 2 = could not run.

   Optional environment variables:
     QURAN_FILE       default src/data/quran.json
     QURAN_COM_BASE   default https://api.quran.com/api/v4                              */

const fs = require("fs");
const path = require("path");

const FILE = process.env.QURAN_FILE || path.join(__dirname, "..", "src", "data", "quran.json");
const COM = (process.env.QURAN_COM_BASE || "https://api.quran.com/api/v4").replace(/\/$/, "");
const REPORT = path.join(__dirname, "quran-compare-report.txt");
const BISMILLAH = "بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ";

function stop(message, code = 2) {
  console.error("\nERROR: " + message);
  process.exit(code);
}

if (typeof fetch !== "function") stop(`This script needs Node.js 18 or newer (you have ${process.version}).`);

/* Turns any spelling of a verse into plain letters, so only real word differences remain */
function normalize(text) {
  return String(text || "")
    .normalize("NFC")
    .replace(/\u0670/g, "\u0627")                         // superscript alif -> alif
    .replace(/[\u0622\u0623\u0625\u0671\u0672\u0673\u0675]/g, "\u0627") // alif forms -> alif
    .replace(/\u0640/g, "")                               // tatweel
    .replace(/[^\u0621-\u063A\u0641-\u064A\u0671-\u06D3\u06FA-\u06FF]/g, ""); // keep letters only
}
const BISMILLAH_N = normalize(BISMILLAH);

/* The first verse of most surahs starts with the Bismillah. Remove it on both sides before comparing,
   because some sources count it as verse 1 and others do not. Surahs 1 and 9 are left as they are. */
function withoutBismillah(surahNumber, ayahNumber, normalized) {
  if (ayahNumber === 1 && surahNumber !== 1 && surahNumber !== 9 && normalized.startsWith(BISMILLAH_N)) {
    return normalized.slice(BISMILLAH_N.length);
  }
  return normalized;
}

async function getJson(url) {
  let lastError = "unknown error";
  for (let attempt = 1; attempt <= 4; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 60000);
    try {
      const res = await fetch(url, { signal: controller.signal, headers: { Accept: "application/json" } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      lastError = err.name === "AbortError" ? "timed out" : err.message;
      if (attempt < 4) await new Promise((r) => setTimeout(r, 1500 * attempt));
    } finally {
      clearTimeout(timer);
    }
  }
  throw new Error(`${lastError} (${url})`);
}

/* All verses of one surah from Quran.com (follows the pages until there are no more) */
async function fetchSurahFromCom(n) {
  const verses = [];
  let page = 1;
  for (let guard = 0; guard < 50; guard++) {
    const url = `${COM}/quran/verses/uthmani?chapter_number=${n}&per_page=300&page=${page}`;
    const json = await getJson(url);
    if (!Array.isArray(json.verses)) throw new Error(`unexpected reply for surah ${n}`);
    for (const v of json.verses) {
      const ayah = Number(String(v.verse_key).split(":")[1]);
      verses.push({ ayah, text: v.text_uthmani || "" });
    }
    const next = json.pagination && json.pagination.next_page;
    if (!next) return verses;
    page = next;
  }
  throw new Error(`too many pages for surah ${n}`);
}

function parseRange(arg, total) {
  if (!arg) return Array.from({ length: total }, (_, i) => i + 1);
  const m = /^(\d+)(?:-(\d+))?$/.exec(arg.trim());
  if (!m) stop(`"${arg}" is not a surah number or range. Examples: 114  or  1-10`, 2);
  const from = Number(m[1]), to = m[2] ? Number(m[2]) : from;
  if (from < 1 || to > total || from > to) stop(`surah numbers must be between 1 and ${total}.`, 2);
  return Array.from({ length: to - from + 1 }, (_, i) => from + i);
}

async function main() {
  if (!fs.existsSync(FILE)) stop(`No Quran file at ${FILE}. Run "npm run quran:download" first.`);
  let local;
  try { local = JSON.parse(fs.readFileSync(FILE, "utf8")); }
  catch (err) { stop(`the Quran file cannot be read (${err.message}). Run "npm run quran:download" again.`); }
  const surahs = local.surahs || [];
  if (surahs.length !== 114) stop(`the Quran file has ${surahs.length} surahs, expected 114.`);

  const wanted = parseRange(process.argv[2], 114);
  console.log(`Comparing ${wanted.length} surah(s) with ${COM}`);
  console.log("Verses are compared as letters only (spelling marks are ignored).\n");

  const differences = [];
  const countMismatch = [];
  const unavailable = [];
  let versesChecked = 0;

  for (const n of wanted) {
    const mine = surahs[n - 1];
    process.stdout.write(`Surah ${String(n).padStart(3)} ${mine.englishName.padEnd(20).slice(0, 20)} `);
    let theirs;
    try {
      theirs = await fetchSurahFromCom(n);
    } catch (err) {
      unavailable.push(`surah ${n}: ${err.message}`);
      console.log("could not download from the second source");
      continue;
    }
    if (theirs.length !== mine.ayahs.length) {
      countMismatch.push(`surah ${n}: our file has ${mine.ayahs.length} verses, the second source has ${theirs.length}`);
    }
    const byAyah = new Map(theirs.map((v) => [v.ayah, v.text]));
    let bad = 0;
    for (const a of mine.ayahs) {
      const other = byAyah.get(a.numberInSurah);
      if (other === undefined) continue;
      versesChecked++;
      const x = withoutBismillah(n, a.numberInSurah, normalize(a.ar));
      const y = withoutBismillah(n, a.numberInSurah, normalize(other));
      if (x !== y) {
        bad++;
        differences.push({ surah: n, ayah: a.numberInSurah, ours: a.ar, theirs: other });
      }
    }
    console.log(bad === 0 ? "OK" : `${bad} verse(s) differ`);
  }

  const lines = [];
  lines.push("Pearls Of Islam - Quran text comparison");
  lines.push(`Date: ${new Date().toISOString()}`);
  lines.push(`Our file: ${FILE}`);
  lines.push(`Second source: ${COM}`);
  lines.push(`Surahs compared: ${wanted.length}, verses compared: ${versesChecked}`);
  lines.push("");
  if (unavailable.length) {
    lines.push(`SURAHS NOT CHECKED (${unavailable.length}):`);
    unavailable.forEach((u) => lines.push("  " + u));
    lines.push("");
  }
  if (countMismatch.length) {
    lines.push(`VERSE COUNT DIFFERENCES (${countMismatch.length}):`);
    countMismatch.forEach((c) => lines.push("  " + c));
    lines.push("");
  }
  lines.push(`WORD DIFFERENCES (${differences.length}):`);
  for (const d of differences) {
    lines.push(`  Surah ${d.surah}, verse ${d.ayah}`);
    lines.push(`    our file:      ${d.ours}`);
    lines.push(`    second source: ${d.theirs}`);
    lines.push("");
  }
  if (!differences.length && !countMismatch.length && !unavailable.length) {
    lines.push("No differences found.");
  }
  fs.writeFileSync(REPORT, lines.join("\n"), "utf8");

  console.log(`\nVerses compared: ${versesChecked}`);
  console.log(`Word differences: ${differences.length}`);
  if (countMismatch.length) console.log(`Verse count differences: ${countMismatch.length}`);
  if (unavailable.length) console.log(`Surahs not checked: ${unavailable.length}`);
  console.log(`Report saved to ${path.relative(process.cwd(), REPORT) || REPORT}`);

  if (unavailable.length) process.exit(2);
  process.exit(differences.length || countMismatch.length ? 1 : 0);
}

main().catch((err) => stop(err.message || String(err)));
