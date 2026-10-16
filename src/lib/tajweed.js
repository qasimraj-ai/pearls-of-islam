/* Tajweed colouring (colour only - the Quran text itself is never changed).
   Only rules that can be read safely from the marks in the text are coloured:
     qalqalah  : ق ط ب ج د carrying a sukun            -> blue
     ghunnah   : ن or م carrying a shadda               -> pink
     madd      : a letter carrying the maddah sign (ٓ)   -> orange-red
   Other rules (ikhfa, idgham, etc.) need a full tajweed-annotated text and are not coloured. */
const QALQALAH = "قطبجد";
const SUKUN = /[\u0652\u06E1]/; // standard sukun and the Uthmani-script sukun
const SHADDA = "\u0651";
const MADDAH = "\u0653";

/* Splits Arabic text into [{ t: text, c: className | "" }] - one entry per letter with its marks. */
export function tajweedParts(text) {
  const clusters = text.match(/\P{M}\p{M}*|\p{M}+/gu) || [];
  return clusters.map((t) => {
    const base = t[0];
    let c = "";
    if (t.includes(MADDAH)) c = "tj-madd";
    else if (QALQALAH.includes(base) && SUKUN.test(t)) c = "tj-qalqalah";
    else if ((base === "ن" || base === "م") && t.includes(SHADDA)) c = "tj-ghunnah";
    return { t, c };
  });
}
