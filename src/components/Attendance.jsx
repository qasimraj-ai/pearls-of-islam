import { useMemo, useState } from "react";
import { useApp } from "../context";
import { PRAYERS, STATUS } from "../lib/constants";
import { dayKey } from "../lib/utils";

export default function Attendance() {
  const { user, update, addHistory } = useApp();
  const days = useMemo(() => Array.from({ length: 28 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() - (27 - i)); return dayKey(d); }), []);
  const [date, setDate] = useState(dayKey());
  const att = user.attendance;
  const prayed = (k) => PRAYERS.filter((p) => att[k]?.[p] && att[k][p] !== "missed").length;

  const setStatus = (p, s) => {
    const current = att[date]?.[p];
    update((u) => {
      const day = { ...(u.attendance[date] || {}) };
      if (current === s) delete day[p]; else day[p] = s;
      return { ...u, attendance: { ...u.attendance, [date]: day } };
    });
    if (current !== s) addHistory("attendance", `${p} on ${date}: ${STATUS.find((x) => x[0] === s)[1]}`);
  };

  let streak = 0;
  for (let i = days.length - 1; i >= 0; i--) {
    const full = prayed(days[i]) === 5;
    if (i === days.length - 1 && !full) continue; // today still in progress
    if (full) streak++; else break;
  }
  const week = days.slice(-7);
  const weekTotal = week.reduce((s, k) => s + prayed(k), 0);
  const perPrayer = PRAYERS.map((p) => [p, Math.round((days.filter((k) => att[k]?.[p] && att[k][p] !== "missed").length / 28) * 100)]);
  const recent = days.slice(-7).reverse();

  return (
    <>
      <div className="page-head"><h2>Prayer attendance</h2></div>
      <div className="grid two">
        <div className="panel stat"><span className="muted">Current streak (all five prayers)</span><b>{streak} {streak === 1 ? "day" : "days"}</b></div>
        <div className="panel stat"><span className="muted">This week</span><b>{weekTotal} / 35</b><div className="bar"><span style={{ width: `${(weekTotal / 35) * 100}%` }} /></div></div>
      </div>

      <div className="panel" style={{ marginTop: 16 }}>
        <div className="page-head" style={{ marginBottom: 6 }}>
          <h3>Mark prayers</h3>
          <select value={date} onChange={(e) => setDate(e.target.value)} style={{ width: "auto" }} aria-label="Day">
            {recent.map((k) => <option key={k} value={k}>{k === dayKey() ? "Today" : new Date(k + "T00:00").toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "short" })}</option>)}
          </select>
        </div>
        {PRAYERS.map((p) => (
          <div className="pr-row" key={p}>
            <b>{p}</b>
            <div className="chips">
              {STATUS.map(([s, label]) => (
                <button key={s} className={`chip ${att[date]?.[p] === s ? "on" : ""}`} aria-pressed={att[date]?.[p] === s} onClick={() => setStatus(p, s)}>{label}</button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="grid two" style={{ marginTop: 16 }}>
        <div className="panel">
          <h3 style={{ marginBottom: 12 }}>Last 4 weeks</h3>
          <div className="heat" role="img" aria-label="Prayers completed per day over the last 28 days">
            {days.map((k) => <i key={k} data-l={prayed(k)} title={`${k}: ${prayed(k)}/5`} />)}
          </div>
        </div>
        <div className="panel grid">
          <h3>Consistency by prayer</h3>
          {perPrayer.map(([p, pct]) => (
            <div key={p}><div style={{ display: "flex", justifyContent: "space-between" }}><span>{p}</span><span className="muted">{pct}%</span></div>
              <div className="bar"><span style={{ width: `${pct}%` }} /></div></div>
          ))}
        </div>
      </div>
    </>
  );
}

