import { useEffect, useState } from "react";

const isStandalone = () => window.matchMedia?.("(display-mode: standalone)").matches || window.navigator.standalone === true;
const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

/* Slim install bar on Home. It is always shown (it cannot be closed). One tap installs the app (Android / Chrome / Edge).
   iPhone does not allow installing from a button, so there the tap shows a one-line hint. */
export default function InstallBanner() {
  const [installed, setInstalled] = useState(isStandalone());
  const [hint, setHint] = useState("");

  useEffect(() => {
    const done = () => setInstalled(true);
    window.addEventListener("appinstalled", done);
    return () => window.removeEventListener("appinstalled", done);
  }, []);

  const install = async () => {
    const e = window.__installPrompt;
    if (e) {
      e.prompt();
      const r = await e.userChoice;
      window.__installPrompt = null;
      if (r.outcome === "accepted") setInstalled(true);
    } else if (isIOS()) setHint("On iPhone: tap the Share button, then Add to Home Screen.");
    else setHint("Open the browser menu (⋮) and choose Install app or Add to Home screen.");
  };

  return (
    <div className="install" role="region" aria-label="Install the app">
      <div className="install-row">
        <span>{installed ? "Pearls Of Islam is installed on this device." : "Install Pearls Of Islam on this device to open it like an app."}</span>
        <span className="install-act">
          {installed
            ? <span className="install-done">✓ Installed</span>
            : <button className="btn small" onClick={install}>Install app</button>}
        </span>
      </div>
      {hint && !installed && <p className="install-hint" role="status">{hint}</p>}
    </div>
  );
}
