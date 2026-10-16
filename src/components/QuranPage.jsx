/* One surah laid out like a printed mushaf page: green ornamental borders, flowing
   Arabic with ayah medallions and optional tajweed colours. The English and Urdu
   translation of every ayah sits directly under that ayah. */
import { useState } from "react";
import { JUZ_STARTS } from "../lib/quranData";
import { tajweedParts } from "../lib/tajweed";

const arabicDigits = (n) => String(n).replace(/\d/g, (d) => "٠١٢٣٤٥٦٧٨٩"[d]);
const BISMILLAH = "بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ";

/* juz (para) that holds a given ayah */
const juzOf = (surah, ayah) => {
  let j = 1;
  JUZ_STARTS.forEach(([s, a], i) => { if (s < surah || (s === surah && a <= ayah)) j = i + 1; });
  return j;
};

function Medallion({ n }) {
  return <span className="mf-end" aria-hidden><span>{arabicDigits(n)}</span></span>;
}

function Arabic({ text, tajweed }) {
  if (!tajweed) return text;
  return tajweedParts(text).map((p, i) => (p.c ? <span key={i} className={p.c}>{p.t}</span> : p.t));
}

export default function QuranPage({ text, urdu, showUr, showEn, activeIndex, bismillah, surahNo, onPlay }) {
  const [tajweed, setTajweed] = useState(true);
  const [variant, setVariant] = useState("classic"); // classic = printed Urdu-Quran look, green = green mushaf look
  const classic = variant === "classic";
  const colours = !classic && tajweed;
  const first = juzOf(surahNo, 1);
  const last = juzOf(surahNo, text.ayahs.length);
  const juz = first === last ? `Juz ${first}` : `Juz ${first}–${last}`;
  const hasTr = (showEn && text.ayahs.some((a) => a.en)) || (showUr && urdu.length);

  return (
    <section className={`mushaf ${variant}`} aria-label={`${text.meta.englishName} page`}>
      <div className="mf-toolbar">
        {classic
          ? <span />
          : <label className="toggle"><input type="checkbox" checked={tajweed} onChange={(e) => setTajweed(e.target.checked)} />Tajweed colours</label>}
        <span className="mf-actions">
          <button className="btn ghost small" onClick={() => setVariant(classic ? "green" : "classic")}>{classic ? "Green mushaf style" : "Classic print style"}</button>
          <button className="btn ghost small" onClick={() => window.print()}>Print this page</button>
        </span>
      </div>

      <header className="mf-head">
        <div className="mf-title" lang="ar" dir="rtl">{text.meta.name}</div>
        <div className="mf-sub">{classic ? `${text.meta.englishName} · ` : ""}{juz} <i>|</i> Surah {surahNo} <i>|</i> {text.meta.englishName} · {text.meta.revelationType} · {text.meta.numberOfAyahs} ayahs</div>
      </header>

      {colours && (
        <div className="mf-legend" aria-label="Tajweed colour key">
          <span><b className="tj-qalqalah">●</b> Qalqalah</span>
          <span><b className="tj-ghunnah">●</b> Ghunnah</span>
          <span><b className="tj-madd">●</b> Madd</span>
        </div>
      )}

      <div className="mf-frame">
        <div className="mf-border" aria-hidden />
        <div className="mf-body">
          {bismillah && <div className="mf-bis" lang="ar" dir="rtl">{BISMILLAH}</div>}
          {hasTr ? (
            <ol className="mf-list">
              {text.ayahs.map((a, i) => (
                <li key={a.n} id={`mf-${i}`} className={`mf-item ${i === activeIndex ? "live" : ""}`}>
                  <p className="mf-text one" lang="ar" dir="rtl" onClick={() => onPlay?.(i)}>
                    <Arabic text={a.ar} tajweed={colours} />{" "}<Medallion n={a.n} />
                  </p>
                  {showEn && a.en && <div className="qline-en">{a.en}</div>}
                  {showUr && urdu[i] && <div className="qline-ur" lang="ur" dir="rtl">{urdu[i]}</div>}
                </li>
              ))}
            </ol>
          ) : (
            <p className="mf-text" lang="ar" dir="rtl">
              {text.ayahs.map((a, i) => (
                <span key={a.n} id={`mf-${i}`} className={`mf-ayah ${i === activeIndex ? "live" : ""}`} onClick={() => onPlay?.(i)}>
                  <Arabic text={a.ar} tajweed={colours} />{" "}<Medallion n={a.n} />{" "}
                </span>
              ))}
            </p>
          )}
        </div>
        <div className="mf-border" aria-hidden />
      </div>
    </section>
  );
}
