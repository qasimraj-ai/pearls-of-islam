/* Imports an Urdu translation file for one hadith book into the app.

   Usage:
     npm run hadith:urdu -- <book> <file.json>
     <book> is one of: bukhari, muslim, abudawud, tirmidhi, ibnmajah

   The file must be JSON in one of these two forms:
     1) [ { "number": 1, "urdu": "..." }, { "number": 2, "urdu": "..." } ]
     2) { "1": "...", "2": "..." }

   "number" must be the hadith number shown in the app (Hadith No.).
   Every entry is checked. If anything is wrong, nothing is saved.
   The file is saved as src/data/hadith-urdu/<book>.json (old file kept as .backup). */

const fs = require("fs");
const path = require("path");

const BOOKS = ["bukhari", "muslim", "abudawud", "tirmidhi", "ibnmajah"];
const DIR = path.join(__dirname, "..", "src", "data", "hadith-urdu");

function stop(msg) {
  console.error("\nERROR: " + msg);
  process.exit(1);
}

const [, , book, file] = process.argv;
if (!BOOKS.includes(book)) stop(`the book must be one of: ${BOOKS.join(", ")}`);
if (!file) stop("give the JSON file path after the book name.");
if (!fs.existsSync(file)) stop(`the file was not found: ${file}`);

let raw;
try { raw = JSON.parse(fs.readFileSync(file, "utf8").replace(/^\uFEFF/, "")); }
catch (err) { stop(`the file is not valid JSON (${err.message}).`); }

let pairs;
if (Array.isArray(raw)) pairs = raw.map((x, i) => [x && x.number, x && x.urdu, `item ${i + 1}`]);
else if (raw && typeof raw === "object") pairs = Object.entries(raw).map(([k, v]) => [k, v, `key "${k}"`]);
else stop("the file must be a JSON array or object.");

const items = {};
const problems = [];
for (const [num, text, where] of pairs) {
  const n = Number(num);
  const t = typeof text === "string" ? text.trim() : "";
  if (!Number.isInteger(n) || n < 1) { problems.push(`${where}: number is not a valid hadith number`); continue; }
  if (!t) { problems.push(`${where}: Urdu text is empty`); continue; }
  if (items[n] !== undefined) { problems.push(`${where}: hadith ${n} appears more than once`); continue; }
  items[n] = t;
}
if (problems.length) {
  console.error("Nothing was saved. Fix these problems and run the command again:");
  problems.slice(0, 20).forEach((p) => console.error("  - " + p));
  if (problems.length > 20) console.error(`  ...and ${problems.length - 20} more`);
  process.exit(1);
}

const count = Object.keys(items).length;
if (count === 0) stop("the file has no hadith.");

fs.mkdirSync(DIR, { recursive: true });
const out = path.join(DIR, `${book}.json`);
if (fs.existsSync(out)) fs.copyFileSync(out, out + ".backup");
const tmp = out + ".tmp";
fs.writeFileSync(tmp, JSON.stringify({ book, source: `imported from ${path.basename(file)} on ${new Date().toISOString()}`, count, items }));
fs.renameSync(tmp, out);
console.log(`OK: saved ${count} Urdu hadith for ${book} to src/data/hadith-urdu/${book}.json`);
