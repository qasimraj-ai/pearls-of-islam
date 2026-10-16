import { useEffect, useState } from "react";

const KEY = "poi_theme";

function initial() {
  try { const v = localStorage.getItem(KEY); if (v === "dark" || v === "light") return v; } catch { /* storage blocked */ }
  return "dark"; // black and green is the default; the button switches to light
}
let current = initial();

export function applyTheme(t = current) {
  document.documentElement.dataset.theme = t;
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", t === "dark" ? "#0a2a1d" : "#1f7a4d");
}
export function setTheme(t) {
  current = t;
  try { localStorage.setItem(KEY, t); } catch { /* storage blocked */ }
  applyTheme(t);
  window.dispatchEvent(new Event("poi-theme"));
}
/** [theme, toggle] - theme is "light" or "dark" */
export function useTheme() {
  const [t, setT] = useState(current);
  useEffect(() => {
    const f = () => setT(current);
    window.addEventListener("poi-theme", f);
    return () => window.removeEventListener("poi-theme", f);
  }, []);
  return [t, () => setTheme(t === "dark" ? "light" : "dark")];
}
