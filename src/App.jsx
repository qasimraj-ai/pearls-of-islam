import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import "./App.css";
import "./ui.css";
import { Ctx } from "./context";
import { ALL_TIMES, DEFAULT_ADHAN, NAV, PRAYER_API, PRAYERS } from "./lib/constants";
import { db, read, uid, write } from "./lib/storage";
import { getMyData, hasServer, saveMyData, serverLogout } from "./lib/api";
import { disablePrayerAlerts, refreshPrayerAlerts } from "./lib/push";
import { clean, dayKey, defaultSettings, minusMinutes, pad } from "./lib/utils";
import { CITIES, localHijri, localTimes } from "./lib/offline";
import Auth from "./components/Auth";
import Home from "./components/Home";
const Quran = lazy(() => import("./components/Quran"));
const Prayers = lazy(() => import("./components/Prayers"));
const IntroNamaz = lazy(() => import("./components/IntroNamaz"));
const Ahadees = lazy(() => import("./components/Ahadees"));
const Attendance = lazy(() => import("./components/Attendance"));
const Profile = lazy(() => import("./components/Profile"));
import Avatar from "./components/Avatar";
import Splash from "./components/Splash";
import Logo from "./components/Logo";
import NavIcon from "./components/NavIcon";
import ThemeToggle from "./components/ThemeToggle";

/* what is kept on the server for each member (the same list the server accepts) */
const SYNC_KEYS = ["settings", "attendance", "completed", "bookmarks", "lastRead", "reciter", "quranPrefs", "history", "avatar"];
const pickSync = (u) => Object.fromEntries(SYNC_KEYS.filter((k) => u[k] !== undefined).map((k) => [k, u[k]]));

export default function App() {
  const [splash, setSplash] = useState(true);
  const hideSplash = useCallback(() => setSplash(false), []);
  const [user, setUser] = useState(() => {
    const id = db.session();
    return id ? db.users().find((u) => u.id === id) || null : null;
  });
  const userRef = useRef(user);
  userRef.current = user;

  const update = useCallback((fn) => {
    const next = fn(userRef.current);
    userRef.current = next; setUser(next); db.saveUser(next);
  }, []);
  const addHistory = useCallback((type, detail) => {
    update((u) => ({ ...u, history: [{ id: uid(), type, detail, at: new Date().toISOString() }, ...u.history].slice(0, 500) }));
  }, [update]);

  /* Server sync. When the member signed in through the server, their data is pulled once per visit
     (the server copy wins if it was changed on another device) and then saved after every change. */
  const syncReady = useRef(false);
  const lastPushed = useRef("");
  const userId = user?.id, token = user?.token;
  useEffect(() => {
    syncReady.current = false;
    if (!hasServer || !token) return;
    let ok = true;
    getMyData(token).then((r) => {
      if (!ok) return;
      const cur = userRef.current;
      if (r.data && r.updatedAt && r.updatedAt !== cur.syncedAt) {
        const next = { ...cur, ...r.data, syncedAt: r.updatedAt };
        userRef.current = next; setUser(next); db.saveUser(next);
        lastPushed.current = JSON.stringify(pickSync(next));
      } else lastPushed.current = r.data ? JSON.stringify(r.data) : "";
      syncReady.current = true;
      setUser((u) => (u ? { ...u } : u)); // run the save effect once so first-time data reaches the server
    }).catch(() => { /* offline or server down: keep working locally, try again next visit */ });
    return () => { ok = false; };
  }, [userId, token]);
  useEffect(() => {
    if (!hasServer || !token || !syncReady.current || !user) return;
    const body = JSON.stringify(pickSync(user));
    if (body === lastPushed.current) return;
    const t = setTimeout(() => {
      saveMyData(token, JSON.parse(body)).then((r) => {
        lastPushed.current = body;
        const cur = userRef.current;
        if (cur && r.updatedAt) { const next = { ...cur, syncedAt: r.updatedAt }; userRef.current = next; db.saveUser(next); }
      }).catch(() => {});
    }, 1500);
    return () => clearTimeout(t);
  }, [user, token]);

  const login = (u) => {
    db.setSession(u.id);
    const next = { ...u, lastLoginAt: new Date().toISOString(), history: [{ id: uid(), type: "login", detail: "Signed in", at: new Date().toISOString() }, ...u.history] };
    db.saveUser(next); userRef.current = next; setUser(next);
  };
  const logout = () => {
    if (userRef.current) addHistory("logout", "Signed out");
    const t = userRef.current?.token;
    if (hasServer && t) {
      // stop prayer alerts for this phone, then end the server session (alerts must not keep arriving after sign-out)
      (userRef.current.alertsOn ? disablePrayerAlerts(t).catch(() => {}) : Promise.resolve()).then(() => serverLogout(t)).catch(() => {});
    }
    db.setSession(null); setUser(null);
  };

  const screen = !user ? <Auth onAuth={login} /> : <Signed key={user.id} user={user} update={update} addHistory={addHistory} logout={logout} />;
  return <>{splash && <Splash onDone={hideSplash} />}{screen}</>;
}

/* Tapping the logo / name reloads the app */
const refreshPage = () => window.location.reload();

/* On phones the menu is a scrolling bottom bar: keep the tapped item in view */
function centerNavItem(btn) {
  const nav = btn?.parentElement;
  if (!nav || nav.scrollWidth <= nav.clientWidth) return;
  nav.scrollTo({ left: btn.offsetLeft - (nav.clientWidth - btn.offsetWidth) / 2, behavior: "smooth" });
}

/* ───────────────────────── signed-in shell ───────────────────────── */
function Signed({ user, update, addHistory, logout }) {
  const [page, setPage] = useState("home");
  const [toast, setToast] = useState(null);
  const settings = useMemo(() => ({ ...defaultSettings(), ...user.settings }), [user.settings]);
  const adhanAudio = useRef(null);
  const fired = useRef(new Set());
  const [today, setToday] = useState(dayKey());

  useEffect(() => { const id = setInterval(() => setToday(dayKey()), 30000); return () => clearInterval(id); }, []);

  /* prayer times */
  const [timesState, setTimesState] = useState({ times: null, hijri: "", loading: true, error: "" });
  useEffect(() => {
    let ok = true;
    const d = new Date();
    const dd = `${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()}`;
    const loc = settings.coords
      ? `timings/${dd}?latitude=${settings.coords.lat}&longitude=${settings.coords.lng}`
      : `timingsByCity/${dd}?city=${encodeURIComponent(settings.city)}&country=${encodeURIComponent(settings.country)}`;
    const url = `${PRAYER_API}/${loc}&method=${settings.method}&school=${settings.school}`;
    const cacheKey = `poi_times_${url}`;
    const cached = read(cacheKey, null);
    if (cached) { setTimesState({ ...cached, loading: false, error: "" }); return; }
    setTimesState((s) => ({ ...s, loading: true, error: "" }));
    fetch(url).then((r) => r.json()).then((j) => {
      if (!ok) return;
      if (j.code !== 200) throw new Error();
      const t = {}; ALL_TIMES.forEach((k) => (t[k] = clean(j.data.timings[k])));
      const h = j.data.date.hijri;
      const val = { times: t, hijri: `${h.day} ${h.month.en} ${h.year} AH` };
      try { Object.keys(localStorage).filter((k) => k.startsWith("poi_times_") && k !== cacheKey).forEach((k) => localStorage.removeItem(k)); } catch { /* storage blocked */ }
      write(cacheKey, val); setTimesState({ ...val, loading: false, error: "" });
    }).catch(() => {
      if (!ok) return;
      const c = settings.coords ? [settings.coords.lat, settings.coords.lng] : CITIES[settings.city.trim().toLowerCase()];
      if (c) {
        setTimesState({ times: localTimes(c[0], c[1], d, settings.method, settings.school), hijri: localHijri(d), loading: false, error: "", offline: true });
      } else {
        setTimesState({ times: null, hijri: "", loading: false, error: "Could not reach the prayer-time service, and this city is not in the offline list. Use the device location button on the Prayers page." });
      }
    });
    return () => { ok = false; };
  }, [settings.city, settings.country, settings.coords, settings.method, settings.school, today]);

  /* adhan + notifications */
  const stopAdhan = useCallback(() => { const a = adhanAudio.current; if (a) { a.pause(); a.currentTime = 0; } setToast(null); }, []);
  const playAdhan = useCallback(() => {
    const a = adhanAudio.current || (adhanAudio.current = new Audio());
    a.src = settings.adhanUrl || DEFAULT_ADHAN; a.volume = settings.volume;
    return a.play().catch(() => setToast({ text: "Browser blocked the adhan sound. Tap anywhere on the page once, then test again.", sticky: true }));
  }, [settings.adhanUrl, settings.volume]);

  const fire = useCallback((prayer, kind) => {
    const body = kind === "pre" ? `${prayer} begins in ${settings.preMinutes} minutes.` : `It is time for ${prayer}.`;
    setToast({ text: body, adhan: kind === "at" && settings.adhan });
    if (settings.notify && "Notification" in window && Notification.permission === "granted") {
      const title = kind === "pre" ? `${prayer} soon` : `${prayer} — Allahu Akbar`;
      const icon = `${import.meta.env.BASE_URL}icons/icon-192.png`;
      const tag = `${prayer}-${kind}`; // matches the server push, so one prayer shows one notification
      // Installed phone apps must show notifications through the service worker
      (navigator.serviceWorker?.getRegistration() || Promise.resolve(null)).then((reg) => {
        if (reg) return reg.showNotification(title, { body, icon, tag });
        new Notification(title, { body, icon, tag });
      }).catch(() => { /* ignore */ });
    }
    if (kind === "at" && settings.adhan) playAdhan();
  }, [settings, playAdhan]);

  useEffect(() => {
    const times = timesState.times;
    if (!times) return;
    const id = setInterval(() => {
      const n = new Date(); const dk = dayKey(n); const hm = `${pad(n.getHours())}:${pad(n.getMinutes())}`;
      PRAYERS.forEach((p) => {
        if (!settings.perPrayer[p]) return;
        const atKey = `${dk}-${p}-at`; const preKey = `${dk}-${p}-pre`;
        if (times[p] === hm && !fired.current.has(atKey)) { fired.current.add(atKey); fire(p, "at"); }
        if (settings.preMinutes > 0 && minusMinutes(times[p], settings.preMinutes) === hm && !fired.current.has(preKey)) { fired.current.add(preKey); fire(p, "pre"); }
      });
    }, 1000);
    return () => clearInterval(id);
  }, [timesState.times, settings, fire]);

  useEffect(() => () => adhanAudio.current?.pause(), []);

  // first time the app opens: find the phone's location automatically (the browser asks once)
  useEffect(() => {
    if (settings.coords || user.locationAsked || !navigator.geolocation) return;
    update((u) => ({ ...u, locationAsked: true }));
    navigator.geolocation.getCurrentPosition(
      (p) => update((u) => ({ ...u, settings: { ...u.settings, coords: { lat: p.coords.latitude, lng: p.coords.longitude } } })),
      () => { /* not allowed: the city in Prayers is used instead */ },
      { timeout: 15000, maximumAge: 600000 }
    );
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // prayer alerts that were turned on: send the current location and time zone to the server
  useEffect(() => {
    if (!user.alertsOn || !user.token) return;
    refreshPrayerAlerts(user.token, settings, settings.coords).catch(() => {});
  }, [user.alertsOn, user.token, settings.coords, settings.method, settings.school, settings.preMinutes, settings.perPrayer]); // eslint-disable-line react-hooks/exhaustive-deps

  const value = useMemo(() => ({ user, update, addHistory, settings, timesState, playAdhan, stopAdhan, setPage, logout }), [user, update, addHistory, settings, timesState, playAdhan, stopAdhan, logout]);
  return (
    <Ctx.Provider value={value}>
      <header className="topbar">
        <button type="button" className="brand-sm brand-btn" onClick={refreshPage} aria-label="Pearls Of Islam - refresh the page" title="Refresh"><Logo size={28} />Pearls Of Islam</button>
        <span className="topbar-actions"><ThemeToggle compact /><button className="btn ghost small" onClick={logout}>Sign out</button></span>
      </header>
      <div className="orbs" aria-hidden><i /><i /><i /><i /><i /><i /></div>
      <div className="shell">
        <aside className="side">
          <button type="button" className="brand brand-btn" onClick={refreshPage} aria-label="Pearls Of Islam - refresh the page" title="Refresh"><Logo size={40} /><b>Pearls<br />Of Islam</b></button>
          <nav className="nav" aria-label="Main">
            {NAV.map(([id, label, icon]) => (
              <button key={id} className={page === id ? "on" : ""} onClick={(e) => { setPage(id); centerNavItem(e.currentTarget); window.scrollTo({ top: 0 }); }} aria-current={page === id ? "page" : undefined}>
                <span aria-hidden className="nav-i"><NavIcon id={id} /></span><span className="nav-t">{label}</span>
              </button>
            ))}
          </nav>
          <ThemeToggle />
          <div className="who">
            <div className="who-row"><Avatar user={user} size={36} /><div><b>{user.name}</b><div className="muted" style={{ fontSize: ".85rem" }}>{user.email}</div></div></div>
            <button className="btn ghost small" onClick={logout}>Sign out</button>
          </div>
        </aside>
        <main className="main">
          <Suspense fallback={<div className="page-loading" aria-busy="true" />}>
          {page === "home" && <Home />}
          {page === "quran" && <Quran />}
          {page === "prayers" && <Prayers />}
          {page === "namaz" && <IntroNamaz />}
          {page === "ahadees" && <Ahadees />}
          {page === "attendance" && <Attendance />}
          {page === "profile" && <Profile />}
          </Suspense>
        </main>
      </div>
      {toast && (
        <div className="toast" role="alert">
          <span>{toast.text}</span>
          <button className="btn small" onClick={stopAdhan}>{toast.adhan ? "Stop adhan" : "Dismiss"}</button>
        </div>
      )}
    </Ctx.Provider>
  );
}

