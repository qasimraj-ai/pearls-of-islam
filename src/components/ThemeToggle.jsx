import { setTheme, useTheme } from "../lib/theme";

/* Two-part switch: Dark (black and green) or Light (green and white) */
export default function ThemeToggle({ compact = false }) {
  const [theme] = useTheme();
  return (
    <div className={`theme-seg ${compact ? "compact" : ""}`} role="group" aria-label="Theme">
      <button type="button" aria-pressed={theme === "dark"} onClick={() => setTheme("dark")}>
        <span aria-hidden>☾</span>{!compact && " Dark"}<span className="sr"> mode</span>
      </button>
      <button type="button" aria-pressed={theme === "light"} onClick={() => setTheme("light")}>
        <span aria-hidden>☀</span>{!compact && " Light"}<span className="sr"> mode</span>
      </button>
    </div>
  );
}
