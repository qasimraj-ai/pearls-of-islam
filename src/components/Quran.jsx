import { useEffect, useRef, useState } from "react";
import { useApp } from "../context";
import { QURAN_API, RECITERS, URDU_EDITIONS } from "../lib/constants";
import { buildJuz, fetchSurahList, fetchSurahText, fetchUrdu } from "../lib/quranData";
import QuranPage from "./QuranPage";
import { fmtDate } from "../lib/utils";

// The first ayah of most surahs arrives with the Bismillah glued to the front; it is shown once as a heading instead.
const plainLetters = (t) => t.replace(/\u0671/g, "\u0627").replace(/[^\u0621-\u063A\u0641-\u064A]/g, ""); // letters only, no marks
const BISMILLAH_PLAIN = plainLetters("بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ");
function stripBismillah(text, surah, ayah) {
  if (surah === 1 || surah === 9 || ayah !== 1) return text;
  const words = text.replace(/^\uFEFF/, "").trim().split(/\s+/);
  // Some Quran files (for example the Tanzil import) already have verse 1 without the Bismillah: leave those untouched
  return plainLetters(words.slice(0, 4).join("")) === BISMILLAH_PLAIN ? words.slice(4).join(" ") : text;
}
const arabicDigits = (n) => String(n).replace(/\d/g, (d) => "٠١٢٣٤٥٦٧٨٩"[d]);
const surahTitle = (name) => name.replace(/^\s*(سُورَةُ|سورة)\s*/, "");
const norm = (t) => t.toLowerCase().replace(/[^a-z0-9\u0600-\u06ff]/g, ""); // "Al-Fatiha", "al fatiha" and "alfatiha" all match

export default function Quran() {
  const { user, update, addHistory } = useApp();
  const [surahs, setSurahs] = useState([]);
  const [q, setQ] = useState("");
  const [n, setN] = useState(user.lastRead?.surah || 1);
  const [reciter, setReciter] = useState(user.reciter || "ar.alafasy");
  const [text, setText] = useState(null);
  const [audio, setAudio] = useState([]);
  const [err, setErr] = useState("");
  const [idx, setIdx] = useState(-1);
  const [playing, setPlaying] = useState(false);
  const [mode, setMode] = useState("off"); // off | ayah | surah
  const [speed, setSpeed] = useState(1);
  const [showUr, setShowUr] = useState(user.quranPrefs?.ur ?? true);
  const [urEdition, setUrEdition] = useState(user.quranPrefs?.urEdition || "ur.jalandhry");
  const [urdu, setUrdu] = useState([]);
  const [showEn, setShowEn] = useState(user.quranPrefs?.en ?? true);
  const [pageView, setPageView] = useState(false);
  const [audioErr, setAudioErr] = useState("");
  const [size, setSize] = useState(user.quranPrefs?.size ?? 1); // text size multiplier
  const [view, setView] = useState(user.quranPrefs?.view || "surah"); // surah | juz
  const pendingAyah = useRef(null); // ayah to scroll to once the chosen surah has loaded
  const el = useRef(null);
  const latest = useRef({});
  const logged = useRef(new Set());
  const heard = useRef(new Set()); // ayahs fully listened to in this surah

  useEffect(() => {
    fetchSurahList().then((j) => { if (!Array.isArray(j.data)) throw new Error(); setSurahs(j.data); }).catch(() => setErr("Could not load the Quran text. Check your internet connection and reload the page."));
  }, []);

  useEffect(() => {
    let ok = true; setText(null); setErr(""); stop(); setIdx(-1); heard.current = new Set();
    fetchSurahText(n).then((j) => {
      if (!ok) return;
      if (j.code !== 200 || !Array.isArray(j.data) || !j.data[0]?.ayahs) throw new Error("bad response");
      const [ar, en] = j.data;
      setText({ meta: ar, ayahs: ar.ayahs.map((a, i) => ({ n: a.numberInSurah, ar: stripBismillah(a.text, n, a.numberInSurah), en: en?.ayahs?.[i]?.text || "" })) });
    }).catch(() => ok && setErr("Could not load this surah. Check your internet connection and try again."));
    return () => { ok = false; };
  }, [n]);

  // Urdu translation (loaded separately so changing translator never interrupts the recitation)
  useEffect(() => {
    let ok = true; setUrdu([]);
    if (!showUr) return;
    fetchUrdu(n, urEdition).then((j) => ok && setUrdu(j.data.ayahs.map((a) => a.text))).catch(() => {});
    return () => { ok = false; };
  }, [n, urEdition, showUr]);

  useEffect(() => {
    let ok = true; setAudio([]); setAudioErr(""); stop();
    fetch(`${QURAN_API}/surah/${n}/${reciter}`).then((r) => r.json()).then((j) => {
      if (!ok) return;
      if (j.code !== 200 || !j.data?.ayahs) throw new Error("bad response");
      setAudio(j.data.ayahs.map((a) => a.audio));
    }).catch(() => ok && setAudioErr("Audio for this reciter could not be loaded. Check your connection or choose another reciter."));
    return () => { ok = false; };
  }, [n, reciter]);

  const stop = () => { const a = el.current; if (a) { a.pause(); } setPlaying(false); };

  const markDone = () => {
    if (!text || user.completed?.[n]) return;
    update((u) => ({ ...u, completed: { ...u.completed, [n]: new Date().toISOString() } }));
    addHistory("read", `Completed Surah ${text.meta.englishName}`);
  };

  const playAt = (i) => {
    const url = audio[i]; if (!url || !text) return;
    const a = el.current || (el.current = new Audio());
    a.src = url; a.defaultPlaybackRate = speed; a.playbackRate = speed;
    setAudioErr("");
    a.play().then(() => setPlaying(true)).catch(() => setAudioErr("Audio could not start. Tap Play again."));
    setIdx(i);
    const ayahNo = text.ayahs[i].n;
    update((u) => ({ ...u, lastRead: { surah: n, ayah: ayahNo, name: text.meta.englishName } }));
    if (!logged.current.has(n)) { logged.current.add(n); addHistory("listen", `Recited Surah ${text.meta.englishName} with ${RECITERS.find((r) => r[0] === reciter)?.[1]}`); }
  };

  latest.current = { mode, idx, text, playAt, markDone };
  useEffect(() => {
    const a = el.current || (el.current = new Audio());
    a.onended = () => {
      const { mode: m, idx: i, text: t, playAt: p, markDone: done } = latest.current;
      heard.current.add(i);
      if (m === "ayah") return p(i);
      if (i + 1 < t.ayahs.length) return p(i + 1);
      if (heard.current.size >= t.ayahs.length) done(); // only counts when every ayah was really played
      if (m === "surah") { heard.current = new Set(); p(0); } else setPlaying(false);
    };
    a.onpause = () => setPlaying(false); a.onplay = () => setPlaying(true);
    return () => { a.pause(); a.onended = null; };
  }, []);
  useEffect(() => { if (el.current) { el.current.defaultPlaybackRate = speed; el.current.playbackRate = speed; } }, [speed]);
  useEffect(() => { document.getElementById(`ayah-${idx}`)?.scrollIntoView({ block: "center", behavior: "smooth" }); }, [idx]);

  useEffect(() => {
    if (!text || !pendingAyah.current) return;
    const i = pendingAyah.current - 1; pendingAyah.current = null;
    requestAnimationFrame(() => document.getElementById(`ayah-${i}`)?.scrollIntoView({ block: "start", behavior: "smooth" }));
  }, [text]);
  const openPart = (surah, ayah) => {
    if (surah === n && text) document.getElementById(`ayah-${ayah - 1}`)?.scrollIntoView({ block: "start", behavior: "smooth" });
    else { pendingAyah.current = ayah; setN(surah); }
  };
  const changeView = (v) => { setView(v); savePrefs({ view: v }); };

  const toggle = () => {
    const a = el.current;
    if (playing) a.pause();
    else if (idx >= 0 && a.src === audio[idx]) a.play(); // resume the same recitation
    else playAt(Math.max(idx, 0));                         // new reciter or nothing playing yet: start from the current ayah
  };
  const savePrefs = (patch) => update((u) => ({ ...u, quranPrefs: { en: showEn, ur: showUr, urEdition, size, view, ...patch } }));
  const changeSize = (delta) => {
    const v = Math.min(1.6, Math.max(0.8, Math.round((size + delta) * 100) / 100));
    setSize(v); savePrefs({ size: v });
  };
  const changeReciter = (v) => { setReciter(v); update((u) => ({ ...u, reciter: v })); };
  const isMarked = (a) => user.bookmarks.some((b) => b.surah === n && b.ayah === a);
  const bookmark = (a) => {
    update((u) => ({ ...u, bookmarks: isMarked(a) ? u.bookmarks.filter((b) => !(b.surah === n && b.ayah === a)) : [...u.bookmarks, { surah: n, ayah: a, name: text.meta.englishName }] }));
    if (!isMarked(a)) addHistory("bookmark", `Bookmarked ${text.meta.englishName} ${a}`);
  };

  const filtered = surahs.filter((s) => norm(`${s.number} ${s.englishName} ${s.englishNameTranslation} ${s.name}`).includes(norm(q)));
  const juzList = buildJuz(surahs)
    .map((j) => ({ ...j, parts: j.parts.filter((p) => norm(`${p.surah} ${surahs[p.surah - 1].englishName} ${surahs[p.surah - 1].englishNameTranslation} ${surahs[p.surah - 1].name}`).includes(norm(q))) }))
    .filter((j) => j.parts.length);
  const reciterName = RECITERS.find((r) => r[0] === reciter)?.[1];

  return (
    <>
      <div className="page-head"><h2>Holy Quran</h2>
        <div className="chips">
          <span className="size-ctl" role="group" aria-label="Text size">
            <button className="iconbtn" onClick={() => changeSize(-0.1)} disabled={size <= 0.8} aria-label="Smaller text">A−</button>
            <button className="iconbtn" onClick={() => changeSize(0.1)} disabled={size >= 1.6} aria-label="Larger text">A+</button>
          </span>
          <button className="btn ghost small" onClick={() => setPageView((v) => !v)} aria-pressed={pageView}>{pageView ? "Verse view" : "Page view"}</button>
          <label className="toggle"><input type="checkbox" checked={showUr} onChange={(e) => { setShowUr(e.target.checked); savePrefs({ ur: e.target.checked }); }} />Urdu translation (اردو ترجمہ)</label>
          <label className="toggle"><input type="checkbox" checked={showEn} onChange={(e) => { setShowEn(e.target.checked); savePrefs({ en: e.target.checked }); }} />English translation</label>
        </div></div>
      {showUr && (
        <label className="field" style={{ maxWidth: 360, marginBottom: 16 }}>Urdu translator
          <select value={urEdition} onChange={(e) => { setUrEdition(e.target.value); savePrefs({ urEdition: e.target.value }); }}>
            {URDU_EDITIONS.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
          </select></label>
      )}
      <div className="quran" style={{ "--qs": size }}>
        <div className="panel" style={{ padding: 12 }}>
          <input type="text" placeholder="Search surah" aria-label="Search surah" value={q} onChange={(e) => setQ(e.target.value)} style={{ marginBottom: 10 }} />
          <div className="view-tabs" role="tablist" aria-label="Browse by">
            <button role="tab" aria-selected={view === "surah"} className={view === "surah" ? "on" : ""} onClick={() => changeView("surah")}>Surahs</button>
            <button role="tab" aria-selected={view === "juz"} className={view === "juz" ? "on" : ""} onClick={() => changeView("juz")}>Juz (Para)</button>
          </div>
          <div className="surah-list">
            {view === "surah" && filtered.map((s) => (
              <button key={s.number} className={`surah-item ${s.number === n ? "on" : ""}`} onClick={() => setN(s.number)}>
                <span className="no">{user.completed?.[s.number] ? "✓" : s.number}</span>
                <span><b>{s.englishName}</b><div className="muted" style={{ fontSize: ".78rem" }}>{s.numberOfAyahs} ayahs</div></span>
                <span className="ar" dir="rtl">{surahTitle(s.name)}</span>
              </button>
            ))}
            {view === "juz" && juzList.map((j) => (
              <div key={j.juz} className="juz-group">
                <div className="juz-head">Juz {j.juz} <span className="ar" dir="rtl">الجزء {arabicDigits(j.juz)}</span></div>
                {j.parts.map((p) => {
                  const s = surahs[p.surah - 1];
                  const full = p.from === 1 && p.to === s.numberOfAyahs;
                  return (
                    <button key={`${j.juz}-${p.surah}`} className={`surah-item ${p.surah === n ? "on" : ""}`} onClick={() => openPart(p.surah, p.from)}>
                      <span className="no">{user.completed?.[p.surah] ? "✓" : p.surah}</span>
                      <span><b>{s.englishName}</b><div className="muted" style={{ fontSize: ".78rem" }}>{full ? `${s.numberOfAyahs} ayahs` : `Ayah ${p.from}–${p.to}`}</div></span>
                      <span className="ar" dir="rtl">{surahTitle(s.name)}</span>
                    </button>
                  );
                })}
              </div>
            ))}
            {view === "juz" && !juzList.length && <p className="muted" style={{ padding: 8 }}>No match.</p>}
          </div>
        </div>
        <div>
          <div className="panel">
            {err && <p className="err" role="alert">{err}</p>}
            {audioErr && <p className="err" role="alert">{audioErr}</p>}
            {!text && !err && <p className="muted">Loading surah…</p>}
            {text && (
              <>
                {!pageView && <div className="reader-head">
                  <div className="ar" dir="rtl" lang="ar">{text.meta.name}</div>
                  <h3>{text.meta.englishName}</h3>
                  <span className="muted">{text.meta.englishNameTranslation} · {text.meta.revelationType} · {text.meta.numberOfAyahs} ayahs</span>
                </div>}
                {!pageView && n !== 1 && n !== 9 && <div className="bismillah" lang="ar" dir="rtl">بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ</div>}
                {pageView ? <QuranPage text={text} urdu={urdu} showUr={showUr} showEn={showEn} activeIndex={idx} bismillah={n !== 1 && n !== 9} surahNo={n} onPlay={playAt} /> : text.ayahs.map((a, i) => (
                  <article key={a.n} id={`ayah-${i}`} className={`ayah ${i === idx ? "live" : ""}`}>
                    <div className="ar" lang="ar" dir="rtl">{a.ar}<span className="end" aria-hidden>۝{arabicDigits(a.n)}</span></div>
                    {showUr && urdu[i] && <div className="ur" lang="ur" dir="rtl">{urdu[i]}</div>}
                    {showEn && a.en && <div className="en">{a.en}</div>}
                    <div className="tools">
                      <span className="num">{a.n}</span>
                      <button className="iconbtn" onClick={() => playAt(i)} disabled={!audio[i]}>▶ Play ayah</button>
                      <button className="iconbtn" onClick={() => bookmark(a.n)}>{isMarked(a.n) ? "★ Bookmarked" : "☆ Bookmark"}</button>
                    </div>
                  </article>
                ))}
                <div style={{ textAlign: "center", marginTop: 16 }}>
                  <button className="btn ghost" onClick={markDone} disabled={!!user.completed?.[n]}>
                    {user.completed?.[n] ? `Completed on ${fmtDate(user.completed[n])}` : "Mark surah as completed"}</button>
                </div>
              </>
            )}
          </div>
          <div className="player" role="group" aria-label="Qirat player">
            <button className="btn small" onClick={toggle} disabled={!text || !audio.length}>{playing ? "❚❚ Pause" : "▶ Play"}</button>
            <button className="btn ghost small" onClick={() => idx > 0 && playAt(idx - 1)} aria-label="Previous ayah">⏮</button>
            <button className="btn ghost small" onClick={() => text && idx < text.ayahs.length - 1 && playAt(idx + 1)} aria-label="Next ayah">⏭</button>
            <div className="grow">
              <select aria-label="Reciter (qirat)" value={reciter} onChange={(e) => changeReciter(e.target.value)} style={{ width: "100%" }}>
                {RECITERS.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
              </select>
            </div>
            <button className={`btn ghost small ${mode !== "off" ? "on" : ""}`} onClick={() => setMode(mode === "off" ? "ayah" : mode === "ayah" ? "surah" : "off")}>
              Repeat: {mode === "off" ? "off" : mode === "ayah" ? "ayah" : "surah"}</button>
            <select aria-label="Speed" value={speed} onChange={(e) => setSpeed(Number(e.target.value))}>
              {[0.75, 1, 1.25, 1.5].map((s) => <option key={s} value={s}>{s}×</option>)}
            </select>
          </div>
          {reciterName && <p className="muted" style={{ fontSize: ".85rem", textAlign: "center" }}>Reciter: {reciterName}</p>}
        </div>
      </div>
    </>
  );
}

