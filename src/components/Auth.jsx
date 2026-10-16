import { useState } from "react";
import ThemeToggle from "./ThemeToggle";
import Logo from "./Logo";
import { db, sha256, uid } from "../lib/storage";
import { defaultSettings } from "../lib/utils";
import { hasServer, login as serverLogin, register as serverRegister, socialLogin } from "../lib/api";
import { useEffect, useRef } from "react";

/* Keeps this device's copy of the member's personal data (attendance, settings, history) */
function localRecord(serverUser, token, form) {
  const existing = db.users().find((x) => x.id === serverUser.id);
  if (existing) return { ...existing, name: serverUser.name, email: serverUser.email, role: serverUser.role, token };
  const now = new Date().toISOString();
  const u = {
    id: serverUser.id, name: serverUser.name, email: serverUser.email, role: serverUser.role, token,
    joinedAt: serverUser.joinedAt || now, lastLoginAt: now,
    settings: defaultSettings(form.city.trim() || "Lahore", form.country.trim() || "Pakistan"),
    attendance: {}, completed: {}, bookmarks: [], lastRead: null, reciter: "ar.alafasy",
    history: [{ id: uid(), type: "join", detail: "Joined Pearls Of Islam", at: now }],
  };
  db.addUser(u);
  return u;
}

const GOOGLE_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";
const APPLE_ID = import.meta.env.VITE_APPLE_CLIENT_ID || "";

/* loads an external sign-in script once */
const scripts = {};
function loadScript(src) {
  if (!scripts[src]) {
    scripts[src] = new Promise((resolve, reject) => {
      const el = document.createElement("script");
      el.src = src; el.async = true;
      el.onload = resolve;
      el.onerror = () => { delete scripts[src]; reject(new Error("The sign-in script could not load. Check your internet connection.")); };
      document.head.appendChild(el);
    });
  }
  return scripts[src];
}

export default function Auth({ onAuth }) {
  const [mode, setMode] = useState("login");
  const [f, setF] = useState({ name: "", email: "", password: "", confirm: "", city: "Lahore", country: "Pakistan" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const googleBox = useRef(null);
  const [socialBusy, setSocialBusy] = useState(false);

  async function finishSocial(provider, idToken, name) {
    setError(""); setSocialBusy(true);
    try {
      const r = await socialLogin({ provider, idToken, name });
      onAuth(localRecord(r.user, r.token, { city: "", country: "" }));
    } catch (err) {
      setError(err.message || "Sign-in failed. Please try again.");
    } finally {
      setSocialBusy(false);
    }
  }

  // Google: Google draws its own sign-in button; the answer comes back here
  useEffect(() => {
    if (!GOOGLE_ID || !googleBox.current) return;
    let alive = true;
    loadScript("https://accounts.google.com/gsi/client")
      .then(() => {
        if (!alive || !window.google || !googleBox.current) return;
        window.google.accounts.id.initialize({
          client_id: GOOGLE_ID,
          callback: (resp) => finishSocial("google", resp.credential, ""),
        });
        window.google.accounts.id.renderButton(googleBox.current, { theme: "outline", size: "large", width: 340, text: "continue_with" });
      })
      .catch((err) => { if (alive) setError(err.message); });
    return () => { alive = false; };
  }, [mode]); // eslint-disable-line react-hooks/exhaustive-deps

  async function appleSignIn() {
    setError(""); setSocialBusy(true);
    try {
      await loadScript("https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js");
      if (!window.AppleID || !window.AppleID.auth) throw new Error("Apple sign-in could not start. Check your internet connection and try again.");
      window.AppleID.auth.init({ clientId: APPLE_ID, scope: "name email", redirectURI: window.location.origin, usePopup: true });
      const res = await window.AppleID.auth.signIn();
      const name = res.user && res.user.name ? `${res.user.name.firstName || ""} ${res.user.name.lastName || ""}`.trim() : "";
      setSocialBusy(false);
      await finishSocial("apple", res.authorization.id_token, name);
    } catch (err) {
      setSocialBusy(false);
      if (err && (err.error === "popup_closed_by_user" || err.error === "user_cancelled_authorize")) return;
      setError((err && err.message) || "Apple sign-in did not finish. Please try again.");
    }
  }

  function socialSetup(name) {
    setError(`${name} sign-in is not set up yet. Add the ${name} client ID to .env.local (see the README). Email sign-in works now.`);
  }

  async function submit(e) {
    e.preventDefault();
    setError(""); setBusy(true);
    try {
      const email = f.email.trim().toLowerCase();
      if (mode === "signup") {
        if (f.name.trim().length < 2) return setError("Enter your full name.");
        if (!/^\S+@\S+\.\S+$/.test(email)) return setError("Enter a valid email address.");
        if (f.password.length < 6) return setError("Password needs at least 6 characters.");
        if (f.password !== f.confirm) return setError("Passwords do not match.");
      }
      if (hasServer) {
        const r = mode === "signup"
          ? await serverRegister({ name: f.name.trim(), email, password: f.password })
          : await serverLogin({ email, password: f.password });
        return onAuth(localRecord(r.user, r.token, f));
      }
      // local mode (no lecture server): accounts are kept on this device only
      if (mode === "signup") {
        if (db.users().some((u) => u.email === email)) return setError("An account with this email already exists. Sign in instead.");
        const now = new Date().toISOString();
        const salt = uid();
        const u = {
          id: uid(), name: f.name.trim(), email, salt, passHash: await sha256(salt + f.password), role: "member",
          joinedAt: now, lastLoginAt: now, settings: defaultSettings(f.city.trim() || "Lahore", f.country.trim() || "Pakistan"),
          attendance: {}, completed: {}, bookmarks: [], lastRead: null, reciter: "ar.alafasy",
          history: [{ id: uid(), type: "join", detail: "Joined Pearls Of Islam", at: now }],
        };
        db.addUser(u);
        db.addJoin({ id: u.id, name: u.name, city: f.city.trim(), country: f.country.trim(), at: now });
        onAuth(u);
      } else {
        const u = db.users().find((x) => x.email === email);
        if (!u || (await sha256(u.salt + f.password)) !== u.passHash) return setError("Email or password is incorrect.");
        onAuth(u);
      }
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth">
      <div className="auth-theme"><ThemeToggle /></div>
      <section className="auth-art">
        <Logo size={96} className="auth-logo" />
        <div className="bismillah" lang="ar">بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ</div>
        <h1>Pearls Of Islam</h1>
        <p>Recite the Quran with beautiful qirat, never miss the adhan, and keep a gentle record of every prayer.</p>
      </section>
      <section className="auth-form">
        <form className="auth-card" onSubmit={submit} noValidate>
          <h2>{mode === "login" ? "Welcome back" : "Create your account"}</h2>
          {mode === "signup" && (
            <label className="field">Full name<input type="text" value={f.name} onChange={set("name")} autoComplete="name" required /></label>
          )}
          <label className="field">Email<input type="email" value={f.email} onChange={set("email")} autoComplete="email" required /></label>
          <label className="field">Password<input type="password" value={f.password} onChange={set("password")} autoComplete={mode === "login" ? "current-password" : "new-password"} required /></label>
          {mode === "signup" && (
            <>
              <label className="field">Confirm password<input type="password" value={f.confirm} onChange={set("confirm")} autoComplete="new-password" required /></label>
              <div className="row">
                <label className="field">City<input type="text" value={f.city} onChange={set("city")} /></label>
                <label className="field">Country<input type="text" value={f.country} onChange={set("country")} /></label>
              </div>
              <p className="muted small">Your city sets your prayer times. You can change it later.</p>
            </>
          )}
          {error && <p className="err" role="alert">{error}</p>}
          <button className="btn" disabled={busy}>{busy ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}</button>
          <div className="social-sep" aria-hidden><span>or</span></div>
          {GOOGLE_ID
            ? <div ref={googleBox} className="google-box" />
            : <button type="button" className="social-btn" onClick={() => socialSetup("Google")} disabled={socialBusy}>
                <span aria-hidden className="social-ico">G</span> Continue with Google
              </button>}
          <button type="button" className="social-btn apple" onClick={() => (APPLE_ID ? appleSignIn() : socialSetup("Apple"))} disabled={socialBusy}>
            <span aria-hidden className="social-ico"></span> {socialBusy ? "Please wait…" : "Continue with Apple ID"}
          </button>
          <p className="switch">
            {mode === "login" ? "New here? " : "Already a member? "}
            <button type="button" onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(""); }}>
              {mode === "login" ? "Create an account" : "Sign in"}
            </button>
          </p>
        </form>
      </section>
    </div>
  );
}
