import { useEffect, useMemo, useRef, useState } from "react";
import { HADITH_BOOKS, loadBook, sectionFor } from "../lib/hadithData";

const PAGE = 30;
const ALL = "all"; // pseudo-chapter: every hadith of the book (used when a hadith is not inside a listed chapter)

function Hadith({ h, showAr, showUr, showEn, grade, flash }) {
  return (
    <article className={`hadith panel${flash ? " flash" : ""}`} id={`h-${h.n}`}>
      <header className="hadith-head">
        <span className="badge">Hadith No. {h.n}</span>
        <span className="hadith-no-ur" lang="ur" dir="rtl">حدیث نمبر {h.n}</span>
        {h.arabicNo && h.arabicNo !== h.n && <span className="muted small">Book number: {h.arabicNo}</span>}
        {grade && <span className="muted small">{grade}</span>}
      </header>
      {showAr && h.ar && <p className="hadith-ar" lang="ar" dir="rtl">{h.ar}</p>}
      {showUr && (
        <section className="hadith-tr" aria-label="Urdu translation">
          <h4 className="hadith-tr-label" lang="ur" dir="rtl">اردو ترجمہ</h4>
          {h.ur ? <p className="hadith-ur" lang="ur" dir="rtl">{h.ur}</p> : <p className="muted small" lang="ur" dir="rtl">اردو ترجمہ دستیاب نہیں۔</p>}
        </section>
      )}
      {showEn && (
        <section className="hadith-tr" aria-label="English translation">
          <h4 className="hadith-tr-label">English translation</h4>
          {h.en ? <p className="hadith-en">{h.en}</p> : <p className="muted small">English translation not available for this hadith.</p>}
        </section>
      )}
    </article>
  );
}

export default function Ahadees() {
  const [bookKey, setBookKey] = useState(HADITH_BOOKS[0].key);
  const [data, setData] = useState({ state: "loading" });
  const [sectionId, setSectionId] = useState(null); // null = first chapter
  const [page, setPage] = useState(0);
  const [showAr, setShowAr] = useState(true);
  const [showUr, setShowUr] = useState(true);
  const [showEn, setShowEn] = useState(true);
  const [goto, setGoto] = useState("");
  const [retry, setRetry] = useState(0);
  const [gotoMsg, setGotoMsg] = useState("");
  const [target, setTarget] = useState(null); // hadith number we are about to scroll to
  const [flash, setFlash] = useState(null);   // hadith number shown highlighted for a moment
  const book = HADITH_BOOKS.find((b) => b.key === bookKey);
  const reqId = useRef(0);
  const topRef = useRef(null);
  const scrollTopNext = useRef(false);

  useEffect(() => {
    const id = ++reqId.current;
    setData({ state: "loading" }); setSectionId(null); setPage(0); setGoto(""); setGotoMsg(""); setTarget(null);
    loadBook(book).then((res) => {
      if (id !== reqId.current) return; // a newer book was chosen
      setData(res.ok ? { state: "ready", ...res } : { state: "error", reason: res.reason });
    });
  }, [bookKey, retry]); // eslint-disable-line react-hooks/exhaustive-deps

  const sections = data.state === "ready" ? data.sections : [];
  const current = useMemo(() => {
    if (data.state !== "ready") return null;
    if (sectionId === ALL) return { sec: null, list: data.hadiths };
    const sec = data.sections.find((s) => s.id === sectionId) || data.sections[0] || null;
    const hasRange = sec && sec.first !== undefined && sec.last !== undefined;
    const list = hasRange ? data.hadiths.filter((h) => h.n >= sec.first && h.n <= sec.last) : data.hadiths;
    return { sec: hasRange ? sec : null, list };
  }, [data, sectionId]);

  const pages = current ? Math.max(1, Math.ceil(current.list.length / PAGE)) : 1;
  const shown = current ? current.list.slice(page * PAGE, page * PAGE + PAGE) : [];
  const secIdx = current?.sec ? sections.findIndex((s) => s.id === current.sec.id) : -1;
  const hasPrev = page > 0 || secIdx > 0;
  const hasNext = page < pages - 1 || (secIdx >= 0 && secIdx < sections.length - 1);

  /* after a chapter / page change, bring the top of the list into view (phones show the chapter list above it) */
  useEffect(() => {
    if (!scrollTopNext.current) return;
    scrollTopNext.current = false;
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [sectionId, page]);

  /* after "Go": wait until the right chapter and page are on screen, then scroll to the hadith and highlight it */
  useEffect(() => {
    if (target == null) return;
    const el = document.getElementById(`h-${target}`);
    if (!el) return; // not rendered yet; this effect runs again after the next render
    el.scrollIntoView({ behavior: "smooth", block: "start" });
    setFlash(target); setTarget(null);
  }, [target, shown]);
  useEffect(() => {
    if (flash == null) return;
    const t = setTimeout(() => setFlash(null), 2600);
    return () => clearTimeout(t);
  }, [flash]);

  const openChapter = (id) => { scrollTopNext.current = true; setSectionId(id); setPage(0); };
  function go(delta) {
    if (!current) return;
    scrollTopNext.current = true;
    if (delta > 0) {
      if (page < pages - 1) setPage(page + 1);
      else if (secIdx >= 0 && secIdx < sections.length - 1) { setSectionId(sections[secIdx + 1].id); setPage(0); }
    } else if (page > 0) setPage(page - 1);
    else if (secIdx > 0) {
      const prev = sections[secIdx - 1];
      const count = data.hadiths.filter((h) => h.n >= prev.first && h.n <= prev.last).length;
      setSectionId(prev.id); setPage(Math.max(0, Math.ceil(count / PAGE) - 1));
    }
  }

  const maxNo = data.state === "ready" && data.hadiths.length ? data.hadiths[data.hadiths.length - 1].n : null;
  function jump(e) {
    e.preventDefault();
    if (data.state !== "ready" || !data.hadiths.length) return;
    const raw = String(goto).trim();
    const typed = Number(raw);
    if (!raw || !Number.isFinite(typed) || typed < 1) return setGotoMsg("Type a hadith number, for example 74.");
    // exact hadith if it exists; otherwise the closest one (a number this book skips, or past its last hadith)
    let h = data.hadiths.find((x) => x.n === typed);
    let note = "";
    if (!h) {
      h = data.hadiths.reduce((best, x) => (Math.abs(x.n - typed) < Math.abs(best.n - typed) ? x : best), data.hadiths[0]);
      note = `Hadith ${typed} is not in ${book.name}; showing the nearest one, ${h.n}.`;
    }
    const n = h.n;
    // find the chapter that holds it; if the book lists none for this number, show the whole book instead
    const sec = sectionFor(data.sections, n);
    const list = sec ? data.hadiths.filter((x) => x.n >= sec.first && x.n <= sec.last) : data.hadiths;
    const idx = Math.max(0, list.findIndex((x) => x.n === n));
    setGotoMsg(note);
    setSectionId(sec ? sec.id : ALL);
    setPage(Math.floor(idx / PAGE));
    setTarget(n);
    if (document.activeElement && document.activeElement.blur) document.activeElement.blur(); // close the phone keyboard so the scroll lands correctly
  }

  const pager = (
    <nav className="ah-pager" aria-label="Pages and chapters">
      <button className="btn ghost small" disabled={!hasPrev} onClick={() => go(-1)}>← Previous</button>
      <span className="muted small">
        Page {page + 1} of {pages}{sections.length > 1 && secIdx >= 0 ? ` · Chapter ${secIdx + 1} of ${sections.length}` : ""}
      </span>
      <button className="btn ghost small" disabled={!hasNext} onClick={() => go(1)}>Next →</button>
    </nav>
  );

  return (
    <>
      <div className="page-head">
        <h2>Ahadees</h2>
        <span className="muted small">Hadith from five major collections, each with the Arabic text and its Urdu and English translation.</span>
      </div>

      <div className="ah-layout">
        <aside className="panel ah-side" aria-label="Books and chapters">
          <h3 className="ah-side-title">Books</h3>
          <div className="ah-books">
            {HADITH_BOOKS.map((b) => (
              <button key={b.key} className={`ah-book ${b.key === bookKey ? "on" : ""}`} aria-pressed={b.key === bookKey} onClick={() => setBookKey(b.key)}>
                <span>{b.name}</span><small dir="rtl" lang="ur">{b.nameUr}</small>
              </button>
            ))}
          </div>

          {data.state === "ready" && (
            <>
              <h3 className="ah-side-title">Chapters</h3>
              <ul className="ah-chapters" aria-label="Chapters">
                {data.sections.map((s) => (
                  <li key={s.id}>
                    <button className={current?.sec?.id === s.id ? "on" : ""} aria-current={current?.sec?.id === s.id ? "true" : undefined} onClick={() => openChapter(s.id)}>
                      <span>{s.name}</span><small className="muted">{s.first}–{s.last}</small>
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}
        </aside>

        <section className="ah-main" aria-live="polite" ref={topRef}>
          {data.state === "loading" && <p className="panel muted">Loading {book.name}… this can take a moment the first time.</p>}
          {data.state === "error" && (
            <div className="panel err" role="alert">
              <p>{data.reason}</p>
              <button className="btn small" onClick={() => setRetry((r) => r + 1)}>Try again</button>
            </div>
          )}

          {data.state === "ready" && (
            <>
              <div className="panel ah-toolbar">
                <div className="ah-chapter-title">
                  <small className="muted">{book.name}</small>
                  <h3>{current.sec ? current.sec.name : book.name}</h3>
                  <small className="muted">{current.list.length} hadith in this {current.sec ? "chapter" : "book"}</small>
                </div>
                <div className="chips" role="group" aria-label="Languages">
                  <label className="toggle"><input type="checkbox" checked={showAr} onChange={(e) => setShowAr(e.target.checked)} />Arabic</label>
                  <label className="toggle"><input type="checkbox" checked={showUr} onChange={(e) => setShowUr(e.target.checked)} />Urdu</label>
                  <label className="toggle"><input type="checkbox" checked={showEn} onChange={(e) => setShowEn(e.target.checked)} />English</label>
                </div>
                <form className="chips" onSubmit={jump} noValidate aria-label="Go to a hadith number">
                  <input type="number" inputMode="numeric" min="1" max={maxNo || undefined} value={goto} onChange={(e) => { setGoto(e.target.value); setGotoMsg(""); }}
                    placeholder={maxNo ? `Go to hadith no. (1–${maxNo})` : "Go to hadith no."} aria-label="Hadith number" style={{ maxWidth: 220 }} />
                  <button type="submit" className="btn ghost small">Go</button>
                </form>
                {gotoMsg && <p className={gotoMsg.startsWith("Type") ? "err small" : "muted small"} role="status">{gotoMsg}</p>}
                <p className="small" style={{ margin: 0 }}>
                  {["ar", "ur", "en"].map((l) => (
                    <span key={l} style={{ marginInlineEnd: 14 }}>
                      {data.missing[l] ? "✗" : "✓"} {l === "ar" ? "Arabic" : l === "ur" ? "Urdu" : "English"}
                    </span>
                  ))}
                </p>
                {data.urduFrom === "imported" && <p className="muted small">Urdu: from your imported translation ({data.urduCount} hadith in this book).</p>}
                {Object.entries(data.missing).filter(([, v]) => v).map(([lang, v]) => (
                  <p key={lang} className="muted small">{lang === "ar" ? "Arabic" : lang === "ur" ? "Urdu" : "English"}: {v}.</p>
                ))}
              </div>

              {shown.length > 0 && pager}
              {shown.length === 0 && <p className="panel muted">No hadith in this chapter.</p>}
              {shown.map((h) => (
                <Hadith key={h.n} h={h} flash={flash === h.n} showAr={showAr} showUr={showUr} showEn={showEn} grade={h.grades[0] ? `${h.grades[0].name}: ${h.grades[0].grade}` : null} />
              ))}
              {shown.length > 0 && pager}
            </>
          )}
        </section>
      </div>
    </>
  );
}
