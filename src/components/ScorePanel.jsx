import { useEffect, useId, useMemo, useState } from "react";
import { useApp } from "../context";
import { PRAYERS } from "../lib/constants";
import { dayKey } from "../lib/utils";

/* Counts up to `to` once, with an ease-out curve (jumps straight to the value if motion is reduced) */
function useCountUp(to, ms = 1300) {
  const [v, setV] = useState(0);
  useEffect(() => {
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) { setV(to); return; }
    let raf, t0;
    const step = (t) => {
      t0 ??= t;
      const p = Math.min((t - t0) / ms, 1);
      setV(Math.round(to * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [to, ms]);
  return v;
}

/* One circular gauge. The ring draws itself from empty to `pct` after mount. */
function Ring({ pct, size, stroke, label, sub, big = false, delay = 0 }) {
  const id = useId();
  const [go, setGo] = useState(false);
  useEffect(() => { const t = setTimeout(() => setGo(true), 60 + delay); return () => clearTimeout(t); }, [delay]);
  const r = (size - stroke) / 2, c = 2 * Math.PI * r;
  const shown = useCountUp(Math.round(pct));
  return (
    <figure className={`ring ${big ? "big" : ""}`} style={{ "--size": `${size}px` }}>
      <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} role="img" aria-label={`${label}: ${Math.round(pct)} percent`}>
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#d8c27a" /><stop offset="45%" stopColor="#5fe0a6" /><stop offset="100%" stopColor="#1d945f" /></linearGradient>
        </defs>
        <circle className="ring-bg" cx={size / 2} cy={size / 2} r={r} strokeWidth={stroke} fill="none" />
        <circle className="ring-fg" cx={size / 2} cy={size / 2} r={r} strokeWidth={stroke} fill="none" stroke={`url(#${id})`} strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={go ? c * (1 - Math.min(pct, 100) / 100) : c} transform={`rotate(-90 ${size / 2} ${size / 2})`} />
      </svg>
      <figcaption className="ring-mid"><b>{shown}{big ? "" : "%"}</b>{big && <small>/ 100</small>}</figcaption>
      <span className="ring-label">{label}</span>
      {sub && <span className="muted ring-sub">{sub}</span>}
    </figure>
  );
}

/* Score panel: overall score + four circles (prayers this week, Quran, streak, 28-day consistency) */
export default function ScorePanel() {
  const { user } = useApp();
  const s = useMemo(() => {
    const att = user.attendance || {};
    const days = Array.from({ length: 28 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() - (27 - i)); return dayKey(d); });
    const prayed = (k) => PRAYERS.filter((p) => att[k]?.[p] && att[k][p] !== "missed").length;
    const total28 = days.reduce((a, k) => a + prayed(k), 0);
    const week = days.slice(-7).reduce((a, k) => a + prayed(k), 0);
    let streak = 0;
    for (let i = days.length - 1; i >= 0; i--) {
      const full = prayed(days[i]) === 5;
      if (i === days.length - 1 && !full) continue;
      if (full) streak++; else break;
    }
    const surahs = Object.keys(user.completed || {}).length;
    const prayersPct = (week / 35) * 100, quranPct = (surahs / 114) * 100, streakPct = Math.min(streak / 28, 1) * 100, consPct = (total28 / 140) * 100;
    const score = Math.round(prayersPct * 0.4 + quranPct * 0.2 + streakPct * 0.2 + consPct * 0.2);
    return { week, surahs, streak, total28, prayersPct, quranPct, streakPct, consPct, score };
  }, [user.attendance, user.completed]);

  const level = s.score >= 80 ? "Excellent" : s.score >= 55 ? "Steady" : s.score >= 25 ? "Growing" : "Just starting";
  return (
    <section className="panel score-panel" aria-label="Your score">
      <div className="score-main">
        <Ring big pct={s.score} size={190} stroke={16} label="Your score" sub={level} />
      </div>
      <div className="score-grid">
        <Ring pct={s.prayersPct} size={96} stroke={9} label="Prayers" sub={`${s.week}/35 this week`} delay={150} />
        <Ring pct={s.quranPct} size={96} stroke={9} label="Quran" sub={`${s.surahs}/114 surahs`} delay={300} />
        <Ring pct={s.streakPct} size={96} stroke={9} label="Streak" sub={`${s.streak} ${s.streak === 1 ? "day" : "days"}`} delay={450} />
        <Ring pct={s.consPct} size={96} stroke={9} label="Consistency" sub="last 28 days" delay={600} />
      </div>
    </section>
  );
}
