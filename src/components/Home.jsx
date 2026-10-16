import { useApp } from "../context";
import InstallBanner from "./InstallBanner";
import { PRAYERS } from "../lib/constants";
import { countdown, dayKey, fmt12, nextPrayer, pad, useNow } from "../lib/utils";

export default function Home() {
  const { user, settings, timesState, setPage } = useApp();
  const now = useNow();
  const next = nextPrayer(timesState.times, now);
  const todayAtt = user.attendance[dayKey()] || {};
  const prayedToday = PRAYERS.filter((p) => todayAtt[p] && todayAtt[p] !== "missed").length;
  const done = Object.keys(user.completed || {}).length;
  const hour = now.getHours();
  const greet = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <>
      <div className="page-head">
        <div><h2>Assalamu alaikum, {user.name.split(" ")[0]}</h2>
          <span className="muted">{now.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" })}{timesState.hijri && ` · ${timesState.hijri}`}</span></div>
        <span className="muted">{greet}</span>
      </div>
      <InstallBanner />
      <section className="hero">
        {next ? (
          <>
            <span>Next prayer in {settings.coords ? "your area" : settings.city}</span>
            <span className="name">{next.name} at {fmt12(`${pad(next.at.getHours())}:${pad(next.at.getMinutes())}`)}</span>
            <span className="count">{countdown(next.at - now)}</span>
          </>
        ) : (
          <span>{timesState.loading ? "Loading prayer times…" : timesState.error || "Set your location to see prayer times."}</span>
        )}
      </section>
      <div className="grid two">
        <div className="panel stat"><span className="muted">Prayers today</span><b>{prayedToday} / 5</b>
          <div className="bar"><span style={{ width: `${prayedToday * 20}%` }} /></div>
          <button className="btn ghost small" style={{ justifySelf: "start", marginTop: 8 }} onClick={() => setPage("attendance")}>Mark attendance</button></div>
        <div className="panel stat"><span className="muted">Surahs completed</span><b>{done} / 114</b>
          <div className="bar"><span style={{ width: `${(done / 114) * 100}%` }} /></div>
          <button className="btn ghost small" style={{ justifySelf: "start", marginTop: 8 }} onClick={() => setPage("quran")}>
            {user.lastRead ? `Continue ${user.lastRead.name}` : "Start reciting"}</button></div>
      </div>
    </>
  );
}

