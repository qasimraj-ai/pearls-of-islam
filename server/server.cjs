/* Pearls Of Islam - lecture server
   No extra packages needed. Requires Node.js 18+.

   Run:   node server/server.js
   Env:   PORT          port to listen on (default 8787)
          DATA_DIR      where accounts, posts and files are kept (default ./server/data)
          ADMIN_EMAIL   the ONLY account that can post lectures. If not set, the first
                        account created becomes the publisher.
          CORS_ORIGIN   website allowed to call this server (default "*")

   Rules:
   - Anyone with an account can read lectures, like them and comment.
   - Only the publisher can add or delete lectures and upload their pictures/videos.
   - Files are streamed to disk, so very large videos (over 3 GB) are fine.     */

const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const PORT = Number(process.env.PORT) || 8787;
const DATA = process.env.DATA_DIR || path.join(__dirname, "data");
fs.mkdirSync(DATA, { recursive: true });
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || "").trim().toLowerCase();
const ORIGINS = (process.env.CORS_ORIGIN || "*").split(",").map((x) => x.trim()).filter(Boolean); // e.g. "https://my-site.netlify.app,https://localhost"
const corsFor = (req) => (ORIGINS.includes("*") ? "*" : ORIGINS.includes(req.headers.origin) ? req.headers.origin : ORIGINS[0]);


function read(name, fallback) {
  try { return JSON.parse(fs.readFileSync(path.join(DATA, name), "utf8")); } catch { return fallback; }
}
function write(name, value) {
  const file = path.join(DATA, name);
  fs.writeFileSync(file + ".tmp", JSON.stringify(value));
  fs.renameSync(file + ".tmp", file);
}

let users = read("users.json", []);       // {id,name,email,salt,hash,role,joinedAt}
let sessions = read("sessions.json", {}); // token -> userId
let userData = read("userdata.json", {}); // userId -> { data, updatedAt }  (settings, attendance, bookmarks, history ...)
const GOOGLE_CLIENT_ID = (process.env.GOOGLE_CLIENT_ID || "").trim();
const APPLE_CLIENT_ID = (process.env.APPLE_CLIENT_ID || "").trim();
const GOOGLE_TOKENINFO = process.env.GOOGLE_TOKENINFO_URL || "https://oauth2.googleapis.com/tokeninfo";
const APPLE_KEYS = process.env.APPLE_KEYS_URL || "https://appleid.apple.com/auth/keys";

/* ───────── Prayer alerts (Web Push) ─────────
   The server works out each subscribed phone's prayer times from its location, and
   sends a push at the exact minute. The phone shows the notification even when the
   app is closed. Times come from the same service the app uses (aladhan.com); if that
   is unreachable the server calculates them itself. */
const ALADHAN = (process.env.ALADHAN_BASE || "https://api.aladhan.com/v1").replace(/\/$/, "");
const PUSH_FILE = "push.json";
const VAPID_SUB = process.env.VAPID_SUBJECT || "mailto:admin@pearls-of-islam.invalid";
const PRAYER_NAMES = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"];
let pushSubs = read(PUSH_FILE, []);             // {endpoint,lat,lng,tzOffsetMin,method,school,perPrayer,preMinutes,pending,sent}
const savePush = () => write(PUSH_FILE, pushSubs);

/* VAPID key pair: from the environment, or created once and kept in data/vapid.json */
let vapid;
(function loadVapid() {
  const env = process.env.VAPID_PRIVATE_JWK && process.env.VAPID_PUBLIC_KEY;
  if (env) {
    vapid = { publicKey: process.env.VAPID_PUBLIC_KEY, key: crypto.createPrivateKey({ key: JSON.parse(process.env.VAPID_PRIVATE_JWK), format: "jwk" }) };
    return;
  }
  let saved = read("vapid.json", null);
  if (!saved) {
    const pair = crypto.generateKeyPairSync("ec", { namedCurve: "prime256v1" });
    const x = pair.publicKey.export({ format: "jwk" });
    const raw = Buffer.concat([Buffer.from([4]), Buffer.from(x.x, "base64url"), Buffer.from(x.y, "base64url")]);
    saved = { publicKey: raw.toString("base64url"), jwk: pair.privateKey.export({ format: "jwk" }) };
    write("vapid.json", saved);
  }
  vapid = { publicKey: saved.publicKey, key: crypto.createPrivateKey({ key: saved.jwk, format: "jwk" }) };
})();

function vapidHeaders(endpoint) {
  const b64 = (x) => Buffer.from(x).toString("base64url");
  const head = b64(JSON.stringify({ typ: "JWT", alg: "ES256" }));
  const body = b64(JSON.stringify({ aud: new URL(endpoint).origin, exp: Math.floor(Date.now() / 1000) + 12 * 3600, sub: VAPID_SUB }));
  const sig = crypto.sign("sha256", Buffer.from(`${head}.${body}`), { key: vapid.key, dsaEncoding: "ieee-p1363" });
  return { Authorization: `vapid t=${head}.${body}.${b64(sig)}, k=${vapid.publicKey}`, TTL: "3600", "Content-Length": "0" };
}
async function sendEmptyPush(endpoint) {
  const r = await fetch(endpoint, { method: "POST", headers: vapidHeaders(endpoint) });
  return r.status;
}

/* prayer times for one place and day (same method numbers as the app) */
const hhmm = (d) => `${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}`;
const dmy = (d) => `${String(d.getUTCDate()).padStart(2, "0")}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${d.getUTCFullYear()}`;
const timesCache = new Map();
async function prayerTimes(sub, localDay) {
  const key = `${dmy(localDay)}|${sub.lat}|${sub.lng}|${sub.method}|${sub.school}`;
  if (timesCache.has(key)) return timesCache.get(key);
  let times = null;
  try {
    const url = `${ALADHAN}/timings/${dmy(localDay)}?latitude=${sub.lat}&longitude=${sub.lng}&method=${sub.method}&school=${sub.school}`;
    const j = await getJsonUrl(url);
    if (j.code === 200 && j.data && j.data.timings) {
      times = {};
      for (const k of ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"]) times[k] = String(j.data.timings[k] || "").split(" ")[0];
    }
  } catch { /* use the local calculation below */ }
  if (!times) times = localPrayerTimes(sub.lat, sub.lng, localDay, sub.tzOffsetMin / 60, sub.method, sub.school);
  timesCache.set(key, times);
  if (timesCache.size > 500) timesCache.delete(timesCache.keys().next().value);
  return times;
}
function localPrayerTimes(lat, lng, day, tz, method, school) {
  const rad = Math.PI / 180, deg = 180 / Math.PI;
  const D = (Date.UTC(day.getUTCFullYear(), day.getUTCMonth(), day.getUTCDate(), 12) - Date.UTC(2000, 0, 1, 12)) / 86400000 - lng / 360;
  const g = (357.529 + 0.98560028 * D) % 360, q = (280.459 + 0.98564736 * D) % 360;
  const L = q + 1.915 * Math.sin(g * rad) + 0.02 * Math.sin(2 * g * rad);
  const e = 23.439 - 0.00000036 * D;
  const RA = (Math.atan2(Math.cos(e * rad) * Math.sin(L * rad), Math.cos(L * rad)) * deg) / 15;
  const fix = (h) => ((h % 24) + 24) % 24;
  const eqt = q / 15 - fix(RA);
  const decl = Math.asin(Math.sin(e * rad) * Math.sin(L * rad)) * deg;
  const noon = 12 + tz - lng / 15 - eqt;
  const ha = (sinAlt) => { const x = (sinAlt - Math.sin(decl * rad) * Math.sin(lat * rad)) / (Math.cos(decl * rad) * Math.cos(lat * rad)); return (Math.acos(Math.max(-1, Math.min(1, x))) * deg) / 15; };
  const ANG = { 1: [18, 18], 2: [15, 15], 3: [18, 17], 4: [18.5, 0], 5: [19.5, 17.5], 8: [19.5, 0], 9: [18, 17.5], 10: [18, 0], 13: [18, 17], 15: [18, 18] };
  const [fa, ia] = ANG[method] || [18, 17];
  const asrAlt = Math.atan(1 / ((school === 1 ? 2 : 1) + Math.tan(Math.abs(lat - decl) * rad)));
  const maghrib = noon + ha(Math.sin(-0.833 * rad));
  const isha = ia === 0 ? maghrib + 1.5 : noon + ha(Math.sin(-ia * rad));
  const f = (h) => { const t = Math.round(fix(h) * 60) % 1440; return `${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`; };
  return { Fajr: f(noon - ha(Math.sin(-fa * rad))), Dhuhr: f(noon + 1 / 60), Asr: f(noon + ha(Math.sin(asrAlt))), Maghrib: f(maghrib), Isha: f(isha) };
}
const minusMins = (t, mins) => { const [h, m] = t.split(":").map(Number); const x = (h * 60 + m - mins + 1440) % 1440; return `${String(Math.floor(x / 60)).padStart(2, "0")}:${String(x % 60).padStart(2, "0")}`; };

let pushBusy = false;
async function pushTick() {
  if (pushBusy || pushSubs.length === 0) return;
  pushBusy = true;
  try {
    const nowMs = Date.now();
    let changed = false;
    for (const sub of pushSubs.slice()) {
      const local = new Date(nowMs + (sub.tzOffsetMin || 0) * 60000);
      const now = hhmm(local), day = local.toISOString().slice(0, 10);
      if (!sub.sent || sub.sent.day !== day) { sub.sent = { day, keys: [] }; changed = true; }
      const times = await prayerTimes(sub, local);
      for (const p of PRAYER_NAMES) {
        if (sub.perPrayer && sub.perPrayer[p] === false) continue;
        const jobs = [];
        if (times[p] === now) jobs.push(["at", `${p} — Allahu Akbar`, `It is time for ${p}.`]);
        if (sub.preMinutes > 0 && minusMins(times[p], sub.preMinutes) === now) jobs.push(["pre", `${p} soon`, `${p} begins in ${sub.preMinutes} minutes.`]);
        for (const [kind, title, body] of jobs) {
          const key = `${p}-${kind}`;
          if (sub.sent.keys.includes(key)) continue;
          sub.sent.keys.push(key); changed = true;
          sub.pending = { title, body, tag: key };
          const status = await sendEmptyPush(sub.endpoint).catch(() => 0);
          if (status === 404 || status === 410) { pushSubs = pushSubs.filter((x) => x.endpoint !== sub.endpoint); break; }
        }
      }
    }
    if (changed) savePush();
  } finally {
    pushBusy = false;
  }
}

const JITSI_BASE = (process.env.JITSI_BASE || "https://meet.jit.si").replace(/\/$/, "");       // mediaId -> {owner,kind,name,type,size,postId}

const SESSION_DAYS = Number(process.env.SESSION_DAYS) || 90;
const DATA_MAX = 1500000;
const AVATAR_MAX = 300000; // profile picture, after the browser resizes it (characters) // largest personal-data blob one member may store (bytes)
const failed = new Map(); // ip+email -> { n, until }  (login throttle)
const clientIp = (req) => String(req.headers["x-forwarded-for"] || "").split(",")[0].trim() || req.socket.remoteAddress || "?";
const throttleKey = (req, email) => `${clientIp(req)}|${email}`;
const signups = new Map(); // ip -> { n, since }  (limits fake sign-ups)
function signupAllowed(req) {
  const ip = clientIp(req), now = Date.now(), r = signups.get(ip);
  if (!r || now - r.since > 3600000) { signups.set(ip, { n: 1, since: now }); return true; }
  return ++r.n <= 20;
}
function throttled(key) { const f = failed.get(key); return f && f.until > Date.now() && f.n >= 5 ? Math.ceil((f.until - Date.now()) / 60000) : 0; }
function noteFail(key) { const f = failed.get(key); failed.set(key, { n: (f && f.until > Date.now() ? f.n : 0) + 1, until: Date.now() + 15 * 60000 }); }

const currentRole = (u) => (ADMIN_EMAIL ? (u.email === ADMIN_EMAIL ? "admin" : "member") : u.role);
const hashPassword = (pw, salt) => crypto.scryptSync(pw, salt, 64).toString("hex");

function send(res, code, body) {
  res.writeHead(code, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(body));
}
function readJson(req, max = 200000) {
  return new Promise((resolve, reject) => {
    let size = 0; const chunks = [];
    req.on("data", (c) => { size += c.length; if (size > max) { reject(new Error("Request too large")); req.destroy(); } else chunks.push(c); });
    req.on("end", () => { try { resolve(JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}")); } catch { reject(new Error("Bad JSON")); } });
    req.on("error", reject);
  });
}
function userFromRequest(req, url) {
  const h = req.headers.authorization || "";
  const token = h.startsWith("Bearer ") ? h.slice(7) : url.searchParams.get("token");
  if (!token || !Object.hasOwn(sessions, token)) return null;
  const rec = sessions[token];
  const userId = typeof rec === "string" ? rec : rec.userId;
  if (typeof rec !== "string" && Date.now() - rec.at > SESSION_DAYS * 86400000) { delete sessions[token]; write("sessions.json", sessions); return null; }
  const u = users.find((x) => x.id === userId);
  return u ? { ...u, role: currentRole(u), _token: token } : null;
}
async function newSession(u) {
  const token = crypto.randomBytes(32).toString("hex");
  sessions[token] = { userId: u.id, at: Date.now() };
  write("sessions.json", sessions);
  return { token, user: { id: u.id, name: u.name, email: u.email, role: currentRole(u), joinedAt: u.joinedAt } };
}
function normalizeUrl(raw) {
  let t = String(raw || "").trim();
  if (!t) return null;
  if (!/^https?:\/\//i.test(t)) t = "https://" + t;
  try {
    const u = new URL(t);
    return ["http:", "https:"].includes(u.protocol) && u.hostname.includes(".") ? u.href : null;
  } catch { return null; }
}
/* what a browser is allowed to see for one lecture */
async function getJsonUrl(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`could not reach the sign-in service (HTTP ${r.status})`);
  return r.json();
}

/* Google: Google itself checks the token; we check that it was issued for this app */
async function verifyGoogle(idToken) {
  if (!GOOGLE_CLIENT_ID) throw new Error("Google sign-in is not set up on this server (GOOGLE_CLIENT_ID is missing).");
  const info = await getJsonUrl(`${GOOGLE_TOKENINFO}?id_token=${encodeURIComponent(idToken)}`);
  if (info.error) throw new Error("Google sign-in expired or is invalid. Please try again.");
  if (info.aud !== GOOGLE_CLIENT_ID) throw new Error("This Google sign-in was made for another app.");
  if (info.iss !== "accounts.google.com" && info.iss !== "https://accounts.google.com") throw new Error("Google sign-in is not from Google.");
  if (Number(info.exp) * 1000 < Date.now()) throw new Error("Google sign-in expired. Please try again.");
  if (String(info.email_verified) !== "true") throw new Error("Your Google email is not verified.");
  return { provider: "google", sub: String(info.sub), email: String(info.email || "").toLowerCase(), name: String(info.name || "") };
}

/* Apple: the token is signed by Apple; we check the signature with Apple's public keys */
let appleKeys = null;
async function verifyApple(idToken, nameHint) {
  if (!APPLE_CLIENT_ID) throw new Error("Apple sign-in is not set up on this server (APPLE_CLIENT_ID is missing).");
  const parts = String(idToken).split(".");
  if (parts.length !== 3) throw new Error("Apple sign-in token is not valid.");
  const [h64, p64, s64] = parts;
  const header = JSON.parse(Buffer.from(h64, "base64url").toString("utf8"));
  let jwk = appleKeys && appleKeys.keys.find((k) => k.kid === header.kid);
  if (!jwk) {
    appleKeys = await getJsonUrl(APPLE_KEYS);
    jwk = appleKeys.keys.find((k) => k.kid === header.kid);
  }
  if (!jwk) throw new Error("Apple sign-in key not found. Please try again.");
  const key = crypto.createPublicKey({ key: jwk, format: "jwk" });
  if (!crypto.verify("RSA-SHA256", Buffer.from(`${h64}.${p64}`), key, Buffer.from(s64, "base64url"))) {
    throw new Error("Apple sign-in could not be verified.");
  }
  const claims = JSON.parse(Buffer.from(p64, "base64url").toString("utf8"));
  if (claims.iss !== "https://appleid.apple.com") throw new Error("Apple sign-in is not from Apple.");
  if (claims.aud !== APPLE_CLIENT_ID) throw new Error("This Apple sign-in was made for another app.");
  if (Number(claims.exp) * 1000 < Date.now()) throw new Error("Apple sign-in expired. Please try again.");
  return { provider: "apple", sub: String(claims.sub), email: String(claims.email || "").toLowerCase(), name: nameHint || "" };
}

/* the same account is used every time the same person signs in with the same email */
async function socialSession(profile) {
  const email = profile.email || `${profile.provider}-${profile.sub}@private.invalid`;
  let u = users.find((x) => x.email === email);
  if (!u) {
    u = {
      id: crypto.randomUUID(), name: (profile.name || email.split("@")[0]).slice(0, 80), email, salt: "", hash: "",
      role: users.length === 0 ? "admin" : "member", joinedAt: new Date().toISOString(), provider: profile.provider,
    };
    users.push(u); write("users.json", users);
  }
  return newSession(u);
}

async function route(req, res, url) {
  const p = url.pathname, m = req.method;

  /* ---- accounts ---- */
  if (m === "GET" && (p === "/" || p === "/health")) return send(res, 200, { ok: true, service: "pearls-of-islam" }); // for the host's health check
  if (m === "POST" && p === "/api/register") {
    if (!signupAllowed(req)) return send(res, 429, { error: "Too many sign-ups from this network. Please try again later." });
    const b = await readJson(req);
    const name = String(b.name || "").trim().slice(0, 80);
    const email = String(b.email || "").trim().toLowerCase();
    const password = String(b.password || "");
    if (name.length < 2) return send(res, 400, { error: "Enter your full name." });
    if (!/^\S+@\S+\.\S+$/.test(email)) return send(res, 400, { error: "Enter a valid email address." });
    if (password.length < 6) return send(res, 400, { error: "Password needs at least 6 characters." });
    if (users.some((x) => x.email === email)) return send(res, 409, { error: "An account with this email already exists. Sign in instead." });
    const salt = crypto.randomBytes(16).toString("hex");
    const u = { id: crypto.randomUUID(), name, email, salt, hash: hashPassword(password, salt), role: users.length === 0 ? "admin" : "member", joinedAt: new Date().toISOString() };
    users.push(u); write("users.json", users);
    return send(res, 201, await newSession(u));
  }
  if (m === "POST" && p === "/api/login") {
    const b = await readJson(req);
    const email = String(b.email || "").trim().toLowerCase();
    const tk = throttleKey(req, email);
    const wait = throttled(tk);
    if (wait) return send(res, 429, { error: `Too many failed sign-ins. Try again in ${wait} minute${wait === 1 ? "" : "s"}.` });
    const u = users.find((x) => x.email === email);
    if (!u || !u.hash || hashPassword(String(b.password || ""), u.salt) !== u.hash) { noteFail(tk); return send(res, 401, { error: "Email or password is incorrect." }); }
    failed.delete(tk);
    return send(res, 200, await newSession(u));
  }
  if (p.startsWith("/api/push/")) {
    if (m === "GET" && p === "/api/push/key") return send(res, 200, { publicKey: vapid.publicKey });
    if (m === "POST" && p === "/api/push/alert") {
      // called by the phone's service worker when a push arrives; returns the text to show
      const b = await readJson(req, 4000);
      const sub = pushSubs.find((x) => x.endpoint === String(b.endpoint || ""));
      const alert = (sub && sub.pending) || { title: "Prayer time", body: "Open Pearls Of Islam for the prayer time.", tag: "prayer" };
      if (sub) { sub.pending = null; savePush(); }
      return send(res, 200, alert);
    }
    const me = userFromRequest(req, url);
    if (!me) return send(res, 401, { error: "Please sign in again." });
    if (m === "POST" && p === "/api/push/subscribe") {
      const b = await readJson(req, 20000);
      const endpoint = String(b.endpoint || "");
      if (!/^https:\/\//.test(endpoint) && !/^http:\/\/localhost/.test(endpoint)) return send(res, 400, { error: "This phone's notification address is not valid." });
      const lat = Number(b.lat), lng = Number(b.lng);
      if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) return send(res, 400, { error: "The location is not valid." });
      const tzOffsetMin = Math.max(-840, Math.min(840, Math.round(Number(b.tzOffsetMin) || 0)));
      const method = [1, 2, 3, 4, 5, 8, 9, 10, 13, 15].includes(Number(b.method)) ? Number(b.method) : 1;
      const school = Number(b.school) === 1 ? 1 : 0;
      const perPrayer = {};
      for (const k of PRAYER_NAMES) perPrayer[k] = !(b.perPrayer && b.perPrayer[k] === false);
      const preMinutes = Math.max(0, Math.min(60, Math.round(Number(b.preMinutes) || 0)));
      const old = pushSubs.find((x) => x.endpoint === endpoint);
      const rec = { endpoint, userId: me.id, lat, lng, tzOffsetMin, method, school, perPrayer, preMinutes, pending: old ? old.pending : null, sent: old ? old.sent : null };
      pushSubs = pushSubs.filter((x) => x.endpoint !== endpoint).concat(rec);
      savePush();
      return send(res, 200, { ok: true, subscribers: pushSubs.length });
    }
    if (m === "POST" && p === "/api/push/unsubscribe") {
      const b = await readJson(req, 4000);
      pushSubs = pushSubs.filter((x) => !(x.endpoint === String(b.endpoint || "") && x.userId === me.id));
      savePush();
      return send(res, 200, { ok: true });
    }
    return send(res, 404, { error: "Not found" });
  }
  if (m === "POST" && p === "/api/auth/social") {
    const b = await readJson(req, 20000);
    const idToken = String(b.idToken || "");
    if (!idToken) return send(res, 400, { error: "Sign-in token is missing. Please try again." });
    try {
      let profile;
      if (b.provider === "google") profile = await verifyGoogle(idToken);
      else if (b.provider === "apple") profile = await verifyApple(idToken, String(b.name || "").trim().slice(0, 80));
      else return send(res, 400, { error: "Unknown sign-in provider." });
      return send(res, 200, await socialSession(profile));
    } catch (err) {
      return send(res, 401, { error: err.message || "Sign-in failed. Please try again." });
    }
  }
  if (m === "GET" && p === "/api/me") {
    const me = userFromRequest(req, url);
    return me ? send(res, 200, { user: { id: me.id, name: me.name, email: me.email, role: me.role, joinedAt: me.joinedAt } }) : send(res, 401, { error: "Please sign in again." });
  }

  /* ---- lectures ---- */
  const me = userFromRequest(req, url);
  if (p.startsWith("/api/") && !me) return send(res, 401, { error: "Please sign in again." });

  /* ---- the member's own data (settings, attendance, bookmarks, history ...), kept on the server so it follows them across devices ---- */
  if (p === "/api/me/data") {
    if (m === "GET") {
      const rec = userData[me.id];
      return send(res, 200, rec ? { data: rec.data, updatedAt: rec.updatedAt } : { data: null, updatedAt: null });
    }
    if (m === "PUT") {
      const b = await readJson(req, DATA_MAX);
      if (!b.data || typeof b.data !== "object" || Array.isArray(b.data)) return send(res, 400, { error: "Nothing to save." });
      const allowed = ["settings", "attendance", "completed", "bookmarks", "lastRead", "reciter", "quranPrefs", "history", "avatar"];
      const data = {};
      for (const k of allowed) if (b.data[k] !== undefined) data[k] = b.data[k];
      if (data.avatar !== null && data.avatar !== undefined) {
        const a = data.avatar;
        if (typeof a !== "string" || !a.startsWith("data:image/jpeg;base64,") || a.length > AVATAR_MAX) return send(res, 400, { error: "The profile picture is not valid or too large." });
      }
      if (Array.isArray(data.history)) data.history = data.history.slice(0, 500);
      userData[me.id] = { data, updatedAt: new Date().toISOString() };
      write("userdata.json", userData);
      return send(res, 200, { ok: true, updatedAt: userData[me.id].updatedAt });
    }
  }
  if (m === "POST" && p === "/api/logout") {
    delete sessions[me._token]; write("sessions.json", sessions);
    return send(res, 200, { ok: true });
  }

  send(res, 404, { error: "Not found" });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, "http://localhost");
  res.setHeader("Access-Control-Allow-Origin", corsFor(req));
  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Headers", "Authorization, Content-Type");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Expose-Headers", "Content-Range, Accept-Ranges, Content-Length");
  if (req.method === "OPTIONS") { res.writeHead(204); return res.end(); }
  try {
    await route(req, res, url);
  } catch (err) {
    console.error(err.message);
    if (!res.headersSent) send(res, 400, { error: err.message || "Something went wrong." });
    else res.end();
  }
});

function housekeeping() {
  const now = Date.now(); let changed = false;
  for (const [t, rec] of Object.entries(sessions)) {
    if (typeof rec !== "string" && now - rec.at > SESSION_DAYS * 86400000) { delete sessions[t]; changed = true; }
  }
  if (changed) write("sessions.json", sessions);
  for (const [k, f] of failed) if (f.until < now) failed.delete(k);
  for (const [k, r] of signups) if (now - r.since > 3600000) signups.delete(k);
}
housekeeping();
setInterval(housekeeping, 3600000).unref();
process.on("unhandledRejection", (e) => console.error("unhandled:", e && e.message ? e.message : e));
process.on("uncaughtException", (e) => console.error("uncaught:", e && e.message ? e.message : e));

setInterval(() => { pushTick().catch((e) => console.error("prayer alerts:", e.message)); }, Number(process.env.PUSH_TICK_MS) || 15000).unref();

server.listen(PORT, () => {
  console.log(`Pearls Of Islam lecture server on http://localhost:${PORT}`);
  console.log(ADMIN_EMAIL ? `Publisher account: ${ADMIN_EMAIL}` : "Publisher: the first account created.");
});
