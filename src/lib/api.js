/* Talks to the lecture server (server/server.cjs).
   Set VITE_API_URL in a file called .env.local, for example:
   VITE_API_URL=http://localhost:8787
   When it is not set, the app runs in local mode and lectures are disabled. */

export const API_URL = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");
export const hasServer = !!API_URL;

async function call(path, { method = "GET", body, token } = {}) {
  let res;
  try {
    res = await fetch(API_URL + path, {
      method,
      headers: { ...(body ? { "Content-Type": "application/json" } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error("Cannot reach the lecture server. Check your internet connection.");
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Server error (${res.status})`);
  return data;
}

export const register = (b) => call("/api/register", { method: "POST", body: b });
export const login = (b) => call("/api/login", { method: "POST", body: b });
export const socialLogin = (b) => call("/api/auth/social", { method: "POST", body: b });

/* the member's own data (settings, attendance, bookmarks, history ...) kept on the server */
export const getMyData = (token) => call("/api/me/data", { token });
export const saveMyData = (token, data) => call("/api/me/data", { method: "PUT", body: { data }, token });
export const serverLogout = (token) => call("/api/logout", { method: "POST", body: {}, token });
export const getPushKey = () => call("/api/push/key");
export const subscribePush = (token, body) => call("/api/push/subscribe", { method: "POST", body, token });
export const unsubscribePush = (token, endpoint) => call("/api/push/unsubscribe", { method: "POST", body: { endpoint }, token });
