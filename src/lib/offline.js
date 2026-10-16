import { pad } from "./utils";

/* Prayer times are calculated on the device when the online service is unavailable. */
export const CITIES = {
  lahore: [31.5497, 74.3436], karachi: [24.8607, 67.0011], islamabad: [33.6844, 73.0479], rawalpindi: [33.5651, 73.0169],
  peshawar: [34.0151, 71.5249], quetta: [30.1798, 66.975], faisalabad: [31.4504, 73.135], multan: [30.1575, 71.5249],
  makkah: [21.4225, 39.8262], mecca: [21.4225, 39.8262], madinah: [24.4709, 39.6122], riyadh: [24.7136, 46.6753],
  dubai: [25.2048, 55.2708], london: [51.5072, -0.1276], "new york": [40.7128, -74.006], istanbul: [41.0082, 28.9784],
  cairo: [30.0444, 31.2357], dhaka: [23.8103, 90.4125], delhi: [28.6139, 77.209], "kuala lumpur": [3.139, 101.6869],
  jakarta: [-6.2088, 106.8456], toronto: [43.6532, -79.3832],
};
export const ANGLES = { 1: [18, 18], 2: [15, 15], 3: [18, 17], 4: [18.5, 0], 5: [19.5, 17.5], 8: [19.5, 0], 9: [18, 17.5], 10: [18, 0], 13: [18, 17], 15: [18, 18] };
export function localTimes(lat, lng, date, method, school) {
  const rad = Math.PI / 180, deg = 180 / Math.PI;
  const D = (Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), 12) - Date.UTC(2000, 0, 1, 12)) / 86400000 - lng / 360;
  const g = (357.529 + 0.98560028 * D) % 360, q = (280.459 + 0.98564736 * D) % 360;
  const L = q + 1.915 * Math.sin(g * rad) + 0.02 * Math.sin(2 * g * rad);
  const e = 23.439 - 0.00000036 * D;
  const RA = (Math.atan2(Math.cos(e * rad) * Math.sin(L * rad), Math.cos(L * rad)) * deg) / 15;
  const fix = (h) => ((h % 24) + 24) % 24;
  const eqt = q / 15 - fix(RA);
  const decl = Math.asin(Math.sin(e * rad) * Math.sin(L * rad)) * deg;
  const tz = -date.getTimezoneOffset() / 60;
  const noon = 12 + tz - lng / 15 - eqt;
  const ha = (sinAlt) => {
    const x = (sinAlt - Math.sin(decl * rad) * Math.sin(lat * rad)) / (Math.cos(decl * rad) * Math.cos(lat * rad));
    return (Math.acos(Math.max(-1, Math.min(1, x))) * deg) / 15;
  };
  const [fa, ia] = ANGLES[method] || [18, 17];
  const asrAlt = Math.atan(1 / ((school === 1 ? 2 : 1) + Math.tan(Math.abs(lat - decl) * rad)));
  const maghrib = noon + ha(Math.sin(-0.833 * rad));
  const isha = ia === 0 ? maghrib + 1.5 : noon + ha(Math.sin(-ia * rad));
  const f = (h) => { const t = Math.round(fix(h) * 60) % 1440; return `${pad(Math.floor(t / 60))}:${pad(t % 60)}`; };
  return {
    Fajr: f(noon - ha(Math.sin(-fa * rad))), Sunrise: f(noon - ha(Math.sin(-0.833 * rad))), Dhuhr: f(noon + 1 / 60),
    Asr: f(noon + ha(Math.sin(asrAlt))), Maghrib: f(maghrib), Isha: f(isha),
  };
}
export function localHijri(d) {
  try { return new Intl.DateTimeFormat("en-u-ca-islamic-umalqura", { day: "numeric", month: "long", year: "numeric" }).format(d) + " (approx.)"; } catch { return ""; }
}

