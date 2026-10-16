/* Hadith data for the Ahadees page.
   Source: fawazahmed0/hadith-api (jsDelivr CDN). The text is loaded from the internet
   when a book is opened; nothing is typed into the app by hand.
   Some editions or hadith numbers may not exist in every language; the page says so. */

/* The same files are served from several mirrors. If one is slow or blocked (it happens on some
   networks), the next one is tried automatically. */
const BASES = [
  "https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1",
  "https://fastly.jsdelivr.net/gh/fawazahmed0/hadith-api@1",
  "https://gcore.jsdelivr.net/gh/fawazahmed0/hadith-api@1",
  "https://raw.githubusercontent.com/fawazahmed0/hadith-api/1",
];

export const HADITH_BOOKS = [
  { key: "bukhari", name: "Sahih al-Bukhari", nameUr: "صحیح بخاری", editions: { ar: "ara-bukhari", en: "eng-bukhari", ur: "urd-bukhari" } },
  { key: "muslim", name: "Sahih Muslim", nameUr: "صحیح مسلم", editions: { ar: "ara-muslim", en: "eng-muslim", ur: "urd-muslim" } },
  { key: "abudawud", name: "Sunan Abu Dawood", nameUr: "سنن ابو داؤد", editions: { ar: "ara-abudawud", en: "eng-abudawud", ur: "urd-abudawud" } },
  { key: "tirmidhi", name: "Jami at-Tirmidhi", nameUr: "جامع ترمذی", editions: { ar: "ara-tirmidhi", en: "eng-tirmidhi", ur: "urd-tirmidhi" } },
  { key: "ibnmajah", name: "Sunan Ibn Majah", nameUr: "سنن ابن ماجہ", editions: { ar: "ara-ibnmajah", en: "eng-ibnmajah", ur: "urd-ibnmajah" } },
];

/* Urdu translations you imported with "npm run hadith:urdu" (src/data/hadith-urdu/<book>.json).
   Empty object until you import a file. */
const importedUrdu = import.meta.glob("../data/hadith-urdu/*.json");

async function loadImportedUrdu(bookKey) {
  const loader = importedUrdu[`../data/hadith-urdu/${bookKey}.json`];
  if (!loader) return null;
  try {
    const mod = await loader();
    return mod.default && mod.default.items ? mod.default.items : null;
  } catch {
    return null;
  }
}

const cache = new Map(); // edition name -> Promise<normalized data>

async function fetchOne(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 60000);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (res.status === 404) throw Object.assign(new Error("not available"), { notFound: true });
    if (!res.ok) throw new Error(`server answered ${res.status}`);
    return await res.json();
  } catch (err) {
    if (err.name === "AbortError") throw new Error("timed out");
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

/* path is relative to the repository, e.g. "editions/eng-bukhari.json" */
async function fetchJson(path) {
  let lastError = "";
  for (let round = 1; round <= 2; round++) {
    let notFound = 0;
    for (const base of BASES) {
      try { return await fetchOne(`${base}/${path}`); }
      catch (err) { if (err.notFound) notFound++; else lastError = err.message; }
    }
    if (notFound === BASES.length) throw Object.assign(new Error("not available"), { notFound: true });
    if (round < 2) await new Promise((r) => setTimeout(r, 1200));
  }
  throw new Error(lastError || "download failed");
}

function normalize(json) {
  const meta = json.metadata || {};
  const sections = Object.entries(meta.section || {})
    .filter(([id, name]) => Number(id) > 0 && String(name || "").trim() !== "")
    .map(([id, name]) => {
      const d = (meta.section_detail || {})[id] || {};
      return { id: Number(id), name: String(name).trim(), first: d.hadithnumber_first, last: d.hadithnumber_last };
    });
  const hadiths = (json.hadiths || [])
    .filter((h) => typeof h.hadithnumber === "number" && h.text)
    .map((h) => ({ n: h.hadithnumber, arabicNo: h.arabicnumber, text: h.text, grades: h.grades || [] }));
  return { sections, hadiths };
}

/* one edition (for example "eng-bukhari"); returns { ok, data } or { ok:false, reason } */
/* The source publishes an index of all editions. Urdu editions are found from it, so no names are guessed. */
let indexPromise = null;
function loadEditionIndex() {
  if (!indexPromise) {
    indexPromise = fetchJson("editions.json")
      .then((json) => {
        const list = Array.isArray(json) ? json : Object.entries(json).map(([k, v]) => ({ name: (v && v.name) || k, ...(typeof v === "object" ? v : {}) }));
        return list.map((e) => String(e.name || e.edition || "")).filter(Boolean);
      })
      .catch(() => { indexPromise = null; return []; });
  }
  return indexPromise;
}

/* the Urdu edition for a book, if the source has one */
async function findUrduEdition(book) {
  const names = await loadEditionIndex();
  if (!names.length) return book.editions.ur; // index unavailable: try the usual name
  if (names.includes(book.editions.ur)) return book.editions.ur;
  return names.find((n) => n.startsWith("urd-") && n.includes(book.key)) || null;
}

function loadEdition(edition) {
  if (!cache.has(edition)) {
    const p = fetchJson(`editions/${edition}.json`)
      .then((json) => ({ ok: true, data: normalize(json) }))
      .catch((err) => ({ ok: false, reason: err.notFound ? "not available in this language yet" : err.message }))
      .then((res) => { if (!res.ok) cache.delete(edition); return res; }); // failed downloads can be retried
    cache.set(edition, p);
  }
  return cache.get(edition);
}

/* all three languages of one book, merged by hadith number */
export async function loadBook(book) {
  const urduName = await findUrduEdition(book);
  const [ar, en, ur] = await Promise.all([
    loadEdition(book.editions.ar),
    loadEdition(book.editions.en),
    urduName ? loadEdition(urduName) : Promise.resolve({ ok: false, reason: "no Urdu edition for this book in the source" }),
  ]);
  const primary = en.ok ? en : ar.ok ? ar : ur;
  if (!primary.ok) return { ok: false, reason: `${book.name} could not be loaded (${primary.reason}). Check your internet connection and try again.` };

  const byNo = new Map();
  const add = (list, field) => {
    if (!list.ok) return;
    for (const h of list.data.hadiths) {
      const row = byNo.get(h.n) || { n: h.n, arabicNo: h.arabicNo, ar: "", en: "", ur: "", grades: [] };
      row[field] = h.text;
      if (field === "en" && h.grades.length) row.grades = h.grades;
      byNo.set(h.n, row);
    }
  };
  add(ar, "ar"); add(en, "en"); add(ur, "ur");
  // Urdu you imported is used for every hadith it covers; it takes priority over the source's Urdu
  const imported = await loadImportedUrdu(book.key);
  let urduFrom = ur.ok ? "source" : null;
  if (imported) {
    urduFrom = "imported";
    for (const [n, text] of Object.entries(imported)) {
      const num = Number(n);
      const row = byNo.get(num) || { n: num, arabicNo: undefined, ar: "", en: "", ur: "", grades: [] };
      row.ur = text;
      byNo.set(num, row);
    }
  }
  const hadiths = [...byNo.values()].sort((a, b) => a.n - b.n);

  return {
    ok: true,
    sections: primary.data.sections,
    hadiths,
    urduFrom,
    urduCount: hadiths.filter((h) => h.ur).length,
    missing: {
      ar: !ar.ok ? ar.reason : null,
      en: !en.ok ? en.reason : null,
      ur: urduFrom ? null : (!ur.ok ? ur.reason : "no Urdu translation yet"),
    },
  };
}

/* the chapter that a hadith number belongs to */
export function sectionFor(sections, n) {
  return sections.find((s) => s.first !== undefined && s.last !== undefined && n >= s.first && n <= s.last) || null;
}
