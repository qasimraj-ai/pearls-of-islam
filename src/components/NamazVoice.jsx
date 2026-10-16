import { useEffect, useRef, useState } from "react";
import { QURAN_API } from "../lib/constants";

/* Recitations of the surahs used in Namaz. Audio: the same reciter as the Quran page (Alafasy). */
const NAMAZ_SURAHS = [
  [1, "Al-Fatiha"], [108, "Al-Kawthar"], [103, "Al-Asr"], [110, "An-Nasr"],
  [112, "Al-Ikhlas"], [113, "Al-Falaq"], [114, "An-Nas"],
];

export default function NamazVoice() {
  const [playing, setPlaying] = useState(null); // surah number
  const [status, setStatus] = useState("");
  const audio = useRef(null);
  const run = useRef(0);

  const stop = () => {
    run.current++;
    const a = audio.current;
    if (a) { a.onended = null; a.onerror = null; a.pause(); a.removeAttribute("src"); }
    setPlaying(null); setStatus("");
  };
  useEffect(() => () => stop(), []); // eslint-disable-line react-hooks/exhaustive-deps

  async function play(surah) {
    stop();
    const id = ++run.current;
    setPlaying(surah); setStatus("Loading…");
    try {
      const res = await fetch(`${QURAN_API}/surah/${surah}/ar.alafasy`);
      const json = await res.json();
      if (json.code !== 200 || !json.data || !Array.isArray(json.data.ayahs)) throw new Error("bad response");
      const urls = json.data.ayahs.map((a) => a.audio).filter(Boolean);
      if (!urls.length) throw new Error("no audio");
      if (!audio.current) audio.current = new Audio();
      const a = audio.current;
      let i = 0;
      const next = () => {
        if (id !== run.current) return;
        if (i >= urls.length) { stop(); return; }
        setStatus(`Ayah ${i + 1} of ${urls.length}`);
        a.src = urls[i++];
        a.play().catch(() => { if (id === run.current) { setStatus("Tap Play again. The browser blocked the sound."); } });
      };
      a.onended = next;
      a.onerror = () => { if (id === run.current) { setStatus("Audio could not be loaded. Check your internet connection."); setPlaying(null); } };
      next();
    } catch (err) {
      if (id === run.current) { setStatus("Could not load the recitation. Check your internet connection and try again."); setPlaying(null); }
    }
  }

  return (
    <section className="panel namaz-voice" aria-label="Recitations for Namaz">
      <div className="page-head" style={{ marginBottom: 8 }}>
        <h3>Listen to the recitations used in Namaz</h3>
        {playing !== null && <button className="btn danger small" onClick={stop}>Stop</button>}
      </div>
      <p className="muted small" style={{ marginTop: 0 }}>Recited by Mishary Rashid Alafasy. Each ayah plays one after another.</p>
      <div className="chips">
        {NAMAZ_SURAHS.map(([n, name]) => (
          <button key={n} className={`chip ${playing === n ? "on" : ""}`} aria-pressed={playing === n} onClick={() => (playing === n ? stop() : play(n))}>
            {playing === n ? "■ " : "▶ "}{name}
          </button>
        ))}
      </div>
      {status && <p className="small" role="status">{status}</p>}
    </section>
  );
}
