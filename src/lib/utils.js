import { useEffect, useState } from "react";
import { DEFAULT_ADHAN, PRAYERS } from "./constants";

export const pad = (n) => String(n).padStart(2, "0");
export const dayKey = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const fmtDate = (iso) => new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
export const fmtDateTime = (iso) => new Date(iso).toLocaleString(undefined, { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
export const clean = (t) => (t || "").split(" ")[0];
export function fmt12(hhmm) {
  if (!hhmm) return "--:--";
  const [h, m] = hhmm.split(":").map(Number);
  return `${h % 12 || 12}:${pad(m)} ${h >= 12 ? "PM" : "AM"}`;
}
export function minusMinutes(hhmm, mins) {
  const [h, m] = hhmm.split(":").map(Number);
  const t = (h * 60 + m - mins + 1440) % 1440;
  return `${pad(Math.floor(t / 60))}:${pad(t % 60)}`;
}
export function nextPrayer(times, now) {
  if (!times) return null;
  const at = (hhmm, add = 0) => {
    const [h, m] = hhmm.split(":").map(Number);
    const d = new Date(now); d.setHours(h, m, 0, 0); d.setDate(d.getDate() + add); return d;
  };
  for (const p of PRAYERS) { const d = at(times[p]); if (d > now) return { name: p, at: d }; }
  return { name: "Fajr", at: at(times.Fajr, 1) };
}
export function countdown(ms) {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${pad(Math.floor(s / 3600))}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`;
}
export function useNow() {
  const [now, setNow] = useState(new Date());
  useEffect(() => { const id = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(id); }, []);
  return now;
}
export const defaultSettings = (city = "Lahore", country = "Pakistan") => ({
  city, country, coords: null, method: 1, school: 0,
  adhan: true, notify: true, preMinutes: 10, volume: 0.8, adhanUrl: DEFAULT_ADHAN,
  perPrayer: { Fajr: true, Dhuhr: true, Asr: true, Maghrib: true, Isha: true },
});


