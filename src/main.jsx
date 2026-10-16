import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import { applyTheme } from "./lib/theme";

applyTheme(); // set light/dark before the first paint

// Weak phones / data-saver / battery-saver: switch off the moving background so the app stays smooth
const nav = navigator;
const weak = (nav.deviceMemory && nav.deviceMemory <= 4) || (nav.hardwareConcurrency && nav.hardwareConcurrency <= 4) || nav.connection?.saveData;
if (weak) document.documentElement.dataset.perf = "lite";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Load the web fonts AFTER the app has appeared, so a slow or blocked font
// server can never delay or blank the page. System fonts are used meanwhile.
window.setTimeout(() => {
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href =
    "https://fonts.googleapis.com/css2?family=Scheherazade+New:wght@400;700&family=Amiri+Quran&family=Amiri:wght@400;700&family=Noto+Nastaliq+Urdu:wght@400;500&family=Poppins:wght@400;500;600;700&display=swap";
  document.head.appendChild(link);
}, 300);

// Make the site installable and usable offline (production build only)
if ("serviceWorker" in navigator && import.meta.env.PROD) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch(() => { /* not available here */ });
  });
}
// Keep the browser's "install app" prompt so Home can show an Install button
window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  window.__installPrompt = e;
  window.dispatchEvent(new Event("pwa-ready"));
});
