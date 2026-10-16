/* ───────────────────────── local "database" ─────────────────────────
   Everything is kept in this browser's localStorage. Swap these helpers
   for real API calls (Node/Express + MongoDB, Firebase, Supabase …) when
   you want accounts that follow people across devices.                 */
export const read = (k, fallback) => {
  try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : fallback; } catch { return fallback; }
};
export const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* storage full */ } };
export const db = {
  users: () => read("poi_users", []),
  saveUser(u) { write("poi_users", this.users().map((x) => (x.id === u.id ? u : x))); },
  addUser(u) { write("poi_users", [...this.users(), u]); },
  joinLog: () => read("poi_joinlog", []),
  addJoin(entry) { write("poi_joinlog", [...this.joinLog(), entry]); },
  session: () => read("poi_session", null),
  setSession: (id) => write("poi_session", id),
};
export async function sha256(text) {
  if (!globalThis.crypto || !crypto.subtle) throw new Error("Sign-in needs a secure connection (https). Open the app from its https address.");
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
export const uid = () => (crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random());

