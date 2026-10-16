import { useState } from "react";
import { useApp } from "../context";
import { enablePrayerAlerts, getDeviceLocation } from "../lib/push";
import { ALL_TIMES, METHODS, PRAYERS } from "../lib/constants";
import { fmt12, nextPrayer, useNow } from "../lib/utils";

export default function Prayers() {
  const { user, update, addHistory, settings, timesState, playAdhan, stopAdhan } = useApp();
  const now = useNow();
  const next = nextPrayer(timesState.times, now);
  const [draft, setDraft] = useState({ city: settings.city, country: settings.country });
  const [perm, setPerm] = useState("Notification" in window ? Notification.permission : "unsupported");
  const [msg, setMsg] = useState("");
  const save = (patch, log) => { update((u) => ({ ...u, settings: { ...settings, ...patch } })); if (log) addHistory("settings", log); };

  const turnOnAlerts = async () => {
    setMsg("");
    try {
      const coords = settings.coords || (await getDeviceLocation());
      if (coords && !settings.coords) save({ coords }, "Found the phone's location for prayer times");
      await enablePrayerAlerts(user.token, settings, coords);
      update((u) => ({ ...u, alertsOn: true }));
      setMsg("Prayer alerts are on. You will get a notification at each prayer time, even when the app is closed.");
    } catch (err) {
      setMsg(err.message || "Prayer alerts could not be turned on.");
    }
  };
  const askPermission = async () => {
    if (!("Notification" in window)) return setMsg("This browser does not support notifications.");
    const p = await Notification.requestPermission(); setPerm(p);
    setMsg(p === "granted" ? "Notifications are on." : "Notifications are blocked. Allow them in your browser's site settings.");
  };
  const useLocation = () => {
    if (!navigator.geolocation) return setMsg("Location is not available in this browser.");
    navigator.geolocation.getCurrentPosition(
      (p) => { save({ coords: { lat: p.coords.latitude, lng: p.coords.longitude } }, "Switched to device location for prayer times"); setMsg("Using your device location."); },
      () => setMsg("Location permission was denied.")
    );
  };

  return (
    <>
      <div className="page-head"><h2>Prayer times</h2>
        <span className="muted">{settings.coords ? "Device location" : `${settings.city}, ${settings.country}`}{timesState.hijri && ` · ${timesState.hijri}`}</span></div>
      <div className="grid two">
        <div className="panel">
          <h3 style={{ marginBottom: 12 }}>Today</h3>
          {timesState.loading && <p className="muted">Loading…</p>}
          {timesState.error && <p className="err">{timesState.error}</p>}
          {timesState.offline && <p className="muted" style={{ fontSize: ".85rem" }}>Calculated on your device (online service unavailable). Times can differ by a few minutes from your local mosque.</p>}
          {timesState.times && (
            <div className="times">
              {ALL_TIMES.map((p) => (
                <div key={p} className={`time-row ${next?.name === p ? "next" : ""}`}>
                  <span>{p}</span><span className="t">{fmt12(timesState.times[p])}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="panel grid">
          <h3>Location</h3>
          <div className="grid cols2">
            <label className="field">City<input type="text" value={draft.city} onChange={(e) => setDraft({ ...draft, city: e.target.value })} /></label>
            <label className="field">Country<input type="text" value={draft.country} onChange={(e) => setDraft({ ...draft, country: e.target.value })} /></label>
          </div>
          <div className="chips">
            <button className="btn small" onClick={() => save({ city: draft.city.trim(), country: draft.country.trim(), coords: null }, `Prayer location set to ${draft.city}, ${draft.country}`)}>Save location</button>
            <button className="btn ghost small" onClick={useLocation}>Use my device location</button>
          </div>
          <label className="field">Calculation method
            <select value={settings.method} onChange={(e) => save({ method: Number(e.target.value) })}>{METHODS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></label>
          <label className="field">Asr time
            <select value={settings.school} onChange={(e) => save({ school: Number(e.target.value) })}>
              <option value={0}>Standard (shadow length 1×)</option><option value={1}>Later (shadow length 2×)</option></select></label>
        </div>
      </div>

      <div className="panel grid" style={{ marginTop: 16 }}>
        <h3>Adhan and reminders</h3>
        <label className="toggle"><input type="checkbox" checked={settings.adhan} onChange={(e) => save({ adhan: e.target.checked })} />Play the adhan when a prayer time starts</label>
        <label className="toggle"><input type="checkbox" checked={settings.notify} onChange={(e) => save({ notify: e.target.checked })} />Show a browser notification</label>
        <div className="chips" aria-label="Prayers to announce">
          {PRAYERS.map((p) => (
            <button key={p} className={`chip ${settings.perPrayer[p] ? "on" : ""}`} aria-pressed={settings.perPrayer[p]}
              onClick={() => save({ perPrayer: { ...settings.perPrayer, [p]: !settings.perPrayer[p] } })}>{p}</button>
          ))}
        </div>
        <div className="grid two">
          <label className="field">Reminder before prayer (minutes, 0 = off)
            <input type="number" min="0" max="60" value={settings.preMinutes} onChange={(e) => save({ preMinutes: Math.max(0, Math.min(60, Number(e.target.value) || 0)) })} /></label>
          <label className="field">Adhan volume
            <input type="range" min="0" max="1" step="0.05" value={settings.volume} onChange={(e) => save({ volume: Number(e.target.value) })} /></label>
        </div>
        <label className="field">Adhan audio link (mp3)
          <input type="url" value={settings.adhanUrl} onChange={(e) => save({ adhanUrl: e.target.value })} /></label>
        <div className="chips">
          <button className="btn small" onClick={turnOnAlerts} disabled={!!user.alertsOn}>{user.alertsOn ? "Exact prayer alerts are on" : "Turn on exact prayer alerts"}</button>
          <button className="btn small" onClick={askPermission} disabled={perm === "granted"}>{perm === "granted" ? "Notifications allowed" : "Allow notifications"}</button>
          <button className="btn ghost small" onClick={playAdhan}>Test adhan</button>
          <button className="btn ghost small" onClick={stopAdhan}>Stop</button>
        </div>
        {msg && <p className="ok">{msg}</p>}
        <p className="muted" style={{ margin: 0, fontSize: ".88rem" }}>
          The adhan plays while Pearls Of Islam is open in a browser tab. Browsers only allow sound after you have interacted with the page once.</p>
      </div>
    </>
  );
}

