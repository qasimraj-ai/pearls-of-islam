/* Prayer alerts that work when the app is closed (Web Push).
   The phone sends its location and time zone; the server sends the alert at the exact prayer minute. */
import { API_URL, getPushKey, hasServer, subscribePush, unsubscribePush } from "./api";
import { CITIES } from "./offline";

const CONFIG_CACHE = "poi-v4-config"; // starts with the service worker version, so it survives updates

function keyBytes(b64) {
  const pad = "=".repeat((4 - (b64.length % 4)) % 4);
  const raw = atob((b64 + pad).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

/* the phone's current location, or null if it is not allowed */
export function getDeviceLocation() {
  return new Promise((resolve) => {
    if (!navigator.geolocation) return resolve(null);
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude }),
      () => resolve(null),
      { timeout: 15000, maximumAge: 600000 }
    );
  });
}

/* where the service worker should send its requests (it cannot read the app settings) */
async function rememberApiBase() {
  try {
    const cache = await caches.open(CONFIG_CACHE);
    await cache.put("api-base", new Response(API_URL));
  } catch { /* storage not available */ }
}

async function placeFor(settings, coords) {
  if (coords) return coords;
  const c = CITIES[(settings.city || "").trim().toLowerCase()];
  return c ? { lat: c[0], lng: c[1] } : null;
}

async function send(token, settings, coords, sub) {
  const place = await placeFor(settings, coords);
  if (!place) throw new Error("Set your location first (Prayers page), then turn on prayer alerts again.");
  await subscribePush(token, {
    endpoint: sub.endpoint,
    lat: place.lat, lng: place.lng,
    tzOffsetMin: -new Date().getTimezoneOffset(),
    method: settings.method, school: settings.school,
    perPrayer: settings.perPrayer, preMinutes: settings.preMinutes,
  });
}

/* turns prayer alerts on for this phone; throws a clear message if something is missing */
export async function enablePrayerAlerts(token, settings, coords) {
  if (!hasServer) throw new Error("Prayer alerts need the lecture server (see the README).");
  if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
    throw new Error("This browser cannot send background alerts. On iPhone, open the site in Safari, tap Share, add it to the Home Screen, then open it from there (iOS 16.4 or later).");
  }
  const permission = await Notification.requestPermission();
  if (permission !== "granted") throw new Error("Notifications are blocked. Allow notifications for this site in your phone settings, then try again.");
  const reg = await navigator.serviceWorker.ready;
  let sub = await reg.pushManager.getSubscription();
  if (!sub) {
    const { publicKey } = await getPushKey();
    sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(publicKey) });
  }
  await rememberApiBase();
  await send(token, settings, coords, sub);
  return true;
}

/* keeps the server's copy of the location and time zone up to date each time the app opens */
export async function refreshPrayerAlerts(token, settings, coords) {
  if (!hasServer || !("serviceWorker" in navigator) || !("PushManager" in window)) return;
  if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
  const reg = await navigator.serviceWorker.ready.catch(() => null);
  const sub = reg && (await reg.pushManager.getSubscription());
  if (!sub) return;
  await rememberApiBase();
  await send(token, settings, coords, sub).catch(() => {});
}

/* removes this phone from the server's alert list (used when signing out) */
export async function disablePrayerAlerts(token) {
  if (!hasServer || !("serviceWorker" in navigator) || !("PushManager" in window)) return;
  const reg = await navigator.serviceWorker.getRegistration();
  const sub = reg && (await reg.pushManager.getSubscription());
  if (sub) await unsubscribePush(token, sub.endpoint);
}
