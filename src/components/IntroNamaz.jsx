import { useEffect, useRef, useState } from "react";
import { BEFORE, REC, SEQUENCE, STEPS, TIPS } from "../lib/namazData";
import NamazVoice from "./NamazVoice";
import { GROUND, HEAD_R, POSES, blend, ease, joints } from "../lib/namazPose";

const pts = (list) => list.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
const reducedMotion = () => typeof window !== "undefined" && !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
const rad = (d) => (d * Math.PI) / 180;

/* ───────── the animated worshipper (side view, facing the Qibla on the right) ───────── */
function Figure({ pose, label }) {
  const j = joints(pose);
  const c = j.head;
  const edge = (a) => [c[0] + HEAD_R * Math.cos(rad(a)), c[1] + HEAD_R * Math.sin(rad(a))];
  const [c1, c2] = [edge(pose.hang - 80), edge(pose.hang + 80)];
  const face = pose.hang + 90;
  const nose = [c[0] + (HEAD_R + 1) * Math.cos(rad(face)), c[1] + (HEAD_R + 1) * Math.sin(rad(face))];
  const finger = [j.hand[0] + 11 * Math.cos(rad(-75)), j.hand[1] + 11 * Math.sin(rad(-75))];
  return (
    <svg className="nz-svg" viewBox="0 38 360 218" role="img" aria-label={label}>
      <rect x="28" y={GROUND - 1} width="290" height="11" rx="5" className="nf-mat" />
      <rect x="40" y={GROUND + 3} width="266" height="2" rx="1" className="nf-mat-line" />
      {/* Kaaba marks the Qibla */}
      <g aria-hidden>
        <rect x="324" y={GROUND - 30} width="28" height="30" rx="2" className="nf-kaaba" />
        <rect x="324" y={GROUND - 22} width="28" height="4" className="nf-kaaba-band" />
        <text x="338" y={GROUND - 36} textAnchor="middle" className="nf-label">قبلہ</text>
      </g>
      <polyline points={pts([j.hip, j.knee, j.ankle])} className="nf-body" strokeWidth="13" />
      <polyline points={pts([j.ankle, j.toe])} className="nf-body" strokeWidth="8" />
      <polyline points={pts([j.hip, j.shoulder])} className="nf-body" strokeWidth="20" />
      <circle cx={c[0]} cy={c[1]} r={HEAD_R} className="nf-skin" />
      <path d={`M ${c1[0]} ${c1[1]} A ${HEAD_R} ${HEAD_R} 0 0 1 ${c2[0]} ${c2[1]} Z`} className="nf-cap" />
      <circle cx={nose[0]} cy={nose[1]} r="2.6" className="nf-skin" />
      <polyline points={pts([j.shoulder, j.elbow, j.hand])} className="nf-arm" strokeWidth="9" />
      <circle cx={j.hand[0]} cy={j.hand[1]} r="4.6" className="nf-skin" />
      {pose.finger > 0 && <line x1={j.hand[0]} y1={j.hand[1]} x2={finger[0]} y2={finger[1]} className="nf-finger" />}
    </svg>
  );
}

/* ───────── one recitation: Arabic, transliteration, Urdu and English meaning ───────── */
function RecBody({ rec, extra }) {
  return (
    <div className="rec">
      <div className="rec-head">
        <b>{rec.name[0]}</b> <span className="nz-ur" dir="rtl">{rec.name[1]}</span>
        {rec.times && <span className="rec-times">× {rec.times} (at least)</span>}
        {rec.who && <span className="rec-who">{rec.who[0]} · <span className="nz-ur" dir="rtl">{rec.who[1]}</span></span>}
        {extra}
      </div>
      {rec.lines.map((l, i) => (
        <div className="rec-line" key={i}>
          {l.n && <span className="rec-n" aria-label={`Ayah ${l.n}`}>{l.n}</span>}
          <div className="nz-ar" lang="ar" dir="rtl">{l.ar}</div>
          <div className="nz-tr">{l.tr}</div>
          <div className="nz-ur" lang="ur" dir="rtl">{l.ur}</div>
          <div className="nz-en">{l.en}</div>
        </div>
      ))}
    </div>
  );
}

function RecCard({ rec }) {
  if (!rec.options) return <RecBody rec={rec} />;
  return (
    <div className="rec">
      <div className="rec-head"><b>{rec.name[0]}</b> <span className="nz-ur" dir="rtl">{rec.name[1]}</span></div>
      {rec.options.map((o) => (
        <details className="rec-opt" key={o.name[0]}>
          <summary>{o.name[0]} · <span className="nz-ur" dir="rtl">{o.name[1]}</span></summary>
          <RecBody rec={o} />
        </details>
      ))}
    </div>
  );
}

const recLabel = (id) => `${REC[id].name[0]}${REC[id].times ? ` ×${REC[id].times}` : ""}`;

export default function IntroNamaz() {
  const [lang, setLang] = useState("en");
  const [idx, setIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [pose, setPose] = useState(() => POSES[STEPS[SEQUENCE[0].step].pose]);
  const cur = useRef(pose);
  const raf = useRef(0);
  const guide = useRef(null);

  const item = SEQUENCE[idx];
  const step = STEPS[item.step];
  const last = SEQUENCE.length - 1;
  const t = (en, ur) => (lang === "ur" ? ur : en);

  /* glide from the current pose to the pose of the chosen step */
  useEffect(() => {
    const target = POSES[step.pose];
    const from = cur.current;
    cancelAnimationFrame(raf.current);
    if (reducedMotion()) { cur.current = target; setPose(target); return; }
    const t0 = performance.now();
    const dur = 1300 / speed;
    const tick = (now) => {
      const p = Math.min(1, (now - t0) / dur);
      const next = p >= 1 ? target : blend(from, target, ease(p));
      cur.current = next; setPose(next);
      if (p < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [idx, speed]);

  /* auto-play: hold each step long enough to read it */
  useEffect(() => {
    if (!playing) return;
    const wait = (1500 + 3500 + step.say.length * 1500) / speed;
    const id = setTimeout(() => (idx < last ? setIdx(idx + 1) : setPlaying(false)), wait);
    return () => clearTimeout(id);
  }, [playing, idx, speed]);

  const play = () => { if (!playing && idx === last) setIdx(0); setPlaying(!playing); };
  const go = (i) => setIdx(Math.max(0, Math.min(last, i)));
  const showStep = (id) => {
    const i = SEQUENCE.findIndex((s) => s.step === id);
    setPlaying(false); go(i); guide.current?.scrollIntoView({ behavior: reducedMotion() ? "auto" : "smooth", block: "start" });
  };

  const stepIds = Object.keys(STEPS);

  return (
    <>
      <div className="page-head"><h2>Intro To Namaz</h2>
        <div className="view-tabs" role="group" aria-label="Instruction language" style={{ minWidth: 200, margin: 0 }}>
          <button className={lang === "en" ? "on" : ""} aria-pressed={lang === "en"} onClick={() => setLang("en")}>English</button>
          <button className={lang === "ur" ? "on" : ""} aria-pressed={lang === "ur"} onClick={() => setLang("ur")}>اردو</button>
        </div>
      </div>

      <p className={lang === "ur" ? "nz-ur nz-lead" : "muted nz-lead"} dir={lang === "ur" ? "rtl" : "ltr"}>
        {t("Learn how to pray, step by step. Watch the figure move through each position, and see exactly what to recite in it. The animation shows a 2-rakat prayer such as Fajr (fard).",
          "نماز سیکھیں، قدم بہ قدم۔ ہر حالت میں پتلے کو حرکت کرتے دیکھیں اور اسی وقت پڑھنے کی چیزیں بھی دیکھیں۔ اینیمیشن دو رکعت نماز (مثلاً فجر کے فرض) دکھاتی ہے۔")}
      </p>

      <div className="panel nz-note" role="note">
        <b>{t("About this page", "اس صفحے کے بارے میں")}</b>{" "}
        <span className={lang === "ur" ? "nz-ur" : ""} dir={lang === "ur" ? "rtl" : "ltr"}>
          {t("This page teaches the basic steps of salah that all Muslims share. If you are unsure about a small detail, ask your teacher or a trusted scholar.",
            "یہ صفحہ نماز کے وہ بنیادی مراحل سکھاتا ہے جو تمام مسلمانوں میں مشترک ہیں۔ کسی چھوٹی تفصیل میں شک ہو تو اپنے استاد یا قابلِ اعتماد عالم سے پوچھ لیں۔")}
        </span>
      </div>

      <NamazVoice />

      <h3 className="nz-h">{t("Before you pray", "نماز سے پہلے")}</h3>
      <div className="nz-before">
        {BEFORE.map((b, i) => (
          <div className="panel" key={b.en}>
            <span className="nz-badge">{i + 1}</span>
            <b>{lang === "ur" ? b.ur : b.en}</b>
            <p className={lang === "ur" ? "nz-ur" : "muted"} dir={lang === "ur" ? "rtl" : "ltr"}>{lang === "ur" ? b.dUr : b.dEn}</p>
          </div>
        ))}
      </div>

      <h3 className="nz-h" ref={guide}>{t("Step by step, with animation", "اینیمیشن کے ساتھ قدم بہ قدم")}</h3>
      <div className="nz-guide">
        <div className="panel nz-stage">
          <Figure pose={pose} label={`${step.name[0]}, rakat ${item.rakat}`} />
          <div className="nz-bar" aria-hidden><i style={{ width: `${((idx + 1) / SEQUENCE.length) * 100}%` }} /></div>
          <div className="nz-caption" aria-live="polite">
            <span className="nz-badge">{t("Rakat", "رکعت")} {item.rakat}</span>
            <b>{step.name[0]}</b>
            <span className="nz-ur" dir="rtl">{step.name[1]}</span>
            <span className="muted nz-count">{idx + 1} / {SEQUENCE.length}</span>
          </div>
          <div className="nz-controls">
            <button className="btn ghost small" onClick={() => { setPlaying(false); go(idx - 1); }} disabled={idx === 0} aria-label="Previous step">⏮</button>
            <button className="btn small" onClick={play}>{playing ? "❚❚ Pause" : idx === last ? "↺ Replay" : "▶ Play"}</button>
            <button className="btn ghost small" onClick={() => { setPlaying(false); go(idx + 1); }} disabled={idx === last} aria-label="Next step">⏭</button>
            <select aria-label="Animation speed" value={speed} onChange={(e) => setSpeed(Number(e.target.value))} style={{ width: "auto" }}>
              {[0.5, 0.75, 1, 1.5].map((s) => <option key={s} value={s}>{s}×</option>)}
            </select>
          </div>
          <label className="field" style={{ marginTop: 10 }}>{t("Jump to a step", "کسی مرحلے پر جائیں")}
            <select value={idx} onChange={(e) => { setPlaying(false); go(Number(e.target.value)); }}>
              {SEQUENCE.map((s, i) => <option key={i} value={i}>{i + 1}. R{s.rakat} · {STEPS[s.step].name[0]}</option>)}
            </select>
          </label>
        </div>

        <div className="panel nz-detail">
          <h4 className="nz-sub">{t("What to do in this position", "اس حالت میں کیا کریں")}</h4>
          <ul className={`nz-list ${lang === "ur" ? "nz-ur" : ""}`} dir={lang === "ur" ? "rtl" : "ltr"}>
            {(lang === "ur" ? step.ur : step.en).map((x, i) => <li key={i}>{x}</li>)}
          </ul>

          <h4 className="nz-sub">{t("What to recite here", "یہاں کیا پڑھیں")}</h4>
          {step.say.length === 0 && <p className="muted">{t("Nothing is recited aloud.", "زبان سے کچھ نہیں پڑھا جاتا۔")}</p>}
          {step.say.map((id) => <RecCard key={id} rec={REC[id]} />)}
          {step.noteEn && (
            <p className={`nz-tip ${lang === "ur" ? "nz-ur" : ""}`} dir={lang === "ur" ? "rtl" : "ltr"}>💡 {lang === "ur" ? step.noteUr : step.noteEn}</p>
          )}
          {item.nextEn && (
            <p className={`nz-next ${lang === "ur" ? "nz-ur" : ""}`} dir={lang === "ur" ? "rtl" : "ltr"}>→ {lang === "ur" ? item.nextUr : item.nextEn}</p>
          )}
        </div>
      </div>

      <h3 className="nz-h">{t("Quick chart: position → what to recite", "جلدی کا چارٹ: حالت ← کیا پڑھیں")}</h3>
      <div className="panel nz-table-wrap">
        <table className="nz-table">
          <thead><tr><th>{t("Position", "حالت")}</th><th>{t("Recite", "پڑھیں")}</th><th /></tr></thead>
          <tbody>
            {stepIds.map((id) => (
              <tr key={id}>
                <td><b>{STEPS[id].name[0]}</b><div className="nz-ur" dir="rtl">{STEPS[id].name[1]}</div></td>
                <td>{STEPS[id].say.length ? STEPS[id].say.map((r) => <div key={r}>{recLabel(r)}</div>) : <span className="muted">—</span>}</td>
                <td><button className="iconbtn" onClick={() => showStep(id)}>▶ {t("Show", "دکھائیں")}</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h3 className="nz-h">{t("Good habits", "اچھی عادات")}</h3>
      <div className="panel">
        <ul className={`nz-list ${lang === "ur" ? "nz-ur" : ""}`} dir={lang === "ur" ? "rtl" : "ltr"}>
          {TIPS.map((x) => <li key={x.en}>{lang === "ur" ? x.ur : x.en}</li>)}
        </ul>
      </div>
    </>
  );
}
