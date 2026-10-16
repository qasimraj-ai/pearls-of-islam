/* Replaces the Arabic text in src/data/quran.json with the text from a Tanzil file.
   Nothing is retyped: every verse is copied exactly as it is in the file.

   Steps:
     1. Open https://tanzil.net/download/ , choose "Uthmani" text and the
        "Text with verse numbers" format (lines like:  1|1|بِسْمِ ...), and save the file.
     2. Run:  npm run quran:import -- path\to\the-downloaded-file.txt
     3. Run:  npm run quran:check   (then npm run quran:compare if you want)

   English and Urdu text already in quran.json are kept. A backup of the old file is saved.   */

const fs = require("fs");
const path = require("path");

const OUT = process.env.QURAN_FILE || path.join(__dirname, "..", "src", "data", "quran.json");
const input = process.argv[2];

function stop(message) {
  console.error("\nERROR: " + message);
  process.exit(1);
}

if (!input) stop('give the Tanzil file path, for example: npm run quran:import -- "C:\\Users\\you\\Downloads\\quran-uthmani.txt"');
if (!fs.existsSync(input)) stop(`the file was not found: ${input}`);
if (!fs.existsSync(OUT)) stop(`${OUT} does not exist yet. Run "npm run quran:download" first (it gives the English and Urdu text).`);

const current = JSON.parse(fs.readFileSync(OUT, "utf8"));
const lines = fs.readFileSync(input, "utf8").replace(/^\uFEFF/, "").split(/\r?\n/);

// Tanzil lines: "sura|aya|text". Lines starting with # are comments.
const arabic = new Map();
let badLines = 0;
for (const line of lines) {
  if (!line.trim() || line.startsWith("#")) continue;
  const parts = line.split("|");
  if (parts.length < 3) { badLines++; continue; }
  const sura = Number(parts[0]), aya = Number(parts[1]);
  const text = parts.slice(2).join("|").trim();
  if (!Number.isInteger(sura) || !Number.isInteger(aya) || !text) { badLines++; continue; }
  arabic.set(`${sura}:${aya}`, text);
}

if (badLines > 0) stop(`${badLines} line(s) are not in the form "sura|aya|text". Make sure you chose the "Text with verse numbers" format.`);
if (arabic.size !== 6236) stop(`the file has ${arabic.size} verses, expected 6236. Download the file again from tanzil.net.`);

let replaced = 0;
const missing = [];
for (const s of current.surahs) {
  for (const a of s.ayahs) {
    const key = `${s.number}:${a.numberInSurah}`;
    const text = arabic.get(key);
    if (text === undefined) { missing.push(key); continue; }
    a.ar = text;
    replaced++;
  }
}
if (missing.length) stop(`these verses are missing from the Tanzil file: ${missing.slice(0, 5).join(", ")}${missing.length > 5 ? " ..." : ""}`);

current.meta = { ...(current.meta || {}), arabicSource: "tanzil.net (imported " + new Date().toISOString() + ")" };

const backup = OUT + ".backup";
fs.copyFileSync(OUT, backup);
const tmp = OUT + ".tmp";
fs.writeFileSync(tmp, JSON.stringify(current));
fs.renameSync(tmp, OUT);
console.log(`OK: replaced the Arabic text of ${replaced} verses from ${path.basename(input)}.`);
console.log(`Old file saved as ${path.basename(backup)}.`);
console.log('Next: run "npm run quran:check".');
