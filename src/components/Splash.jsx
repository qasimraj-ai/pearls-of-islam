import { useEffect, useRef, useState } from "react";
import Logo from "./Logo";

/* Opening screen: logo and name, then fades away */
export default function Splash({ onDone }) {
  const [leaving, setLeaving] = useState(false);
  const done = useRef(onDone);
  done.current = onDone;

  useEffect(() => {
    const a = setTimeout(() => setLeaving(true), 1800);
    const b = setTimeout(() => done.current(), 2400);
    return () => { clearTimeout(a); clearTimeout(b); };
  }, []);

  return (
    <div className={`splash ${leaving ? "out" : ""}`} role="status" aria-label="Loading Pearls Of Islam">
      <Logo size={132} className="splash-logo" />
      <h1>Pearls Of Islam</h1>
      <p className="arabic-line" lang="ar">بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ</p>
    </div>
  );
}
